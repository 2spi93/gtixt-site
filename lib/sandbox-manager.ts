// /opt/gpti/gpti-site/lib/sandbox-manager.ts

import fs from 'fs/promises';
import path from 'path';
import { auditLogger } from './audit-logger';
import { isPathAllowed } from './path-guard';

export class SandboxManager {
  private static instance: SandboxManager;
  private sandboxEnabled: boolean;
  private sandboxPath: string;
  private maxFileSizeBytes: number;

  private constructor() {
    this.sandboxEnabled = process.env.COPILOT_ENV === 'sandbox';
    this.sandboxPath = process.env.SANDBOX_PATH || '/opt/gpti/sandbox';
    this.maxFileSizeBytes = 1024 * 1024; // 1 MB
  }

  static getInstance(): SandboxManager {
    if (!SandboxManager.instance) {
      SandboxManager.instance = new SandboxManager();
    }
    return SandboxManager.instance;
  }

  isSandboxEnabled(): boolean {
    return this.sandboxEnabled;
  }

  setSandboxEnabled(enabled: boolean): void {
    this.sandboxEnabled = enabled;
    auditLogger.setEnvironment(enabled ? 'sandbox' : 'production');
  }

  getSandboxPath(): string {
    return this.sandboxPath;
  }

  async initializeSandbox(): Promise<void> {
    if (!this.sandboxEnabled) return;

    try {
      await fs.mkdir(this.sandboxPath, { recursive: true });
      console.log(`✅ Sandbox initialized at: ${this.sandboxPath}`);
    } catch (error) {
      console.error('Failed to initialize sandbox:', error);
      throw new Error('Sandbox initialization failed');
    }
  }

  async copySandbox(sourcePath: string): Promise<string> {
    if (!this.sandboxEnabled) {
      return sourcePath; // Return original path if sandbox disabled
    }

    try {
      const pathCheck = isPathAllowed(sourcePath);
      if (!pathCheck.allowed) {
        throw new Error(`Access denied - ${pathCheck.reason || 'invalid path'}`);
      }

      const relativePath = path.relative('/opt/gpti', sourcePath);
      const sandboxFilePath = path.join(this.sandboxPath, relativePath);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(sandboxFilePath), { recursive: true });
      
      // Copy file to sandbox
      const stats = await fs.stat(sourcePath);
      if (stats.size > this.maxFileSizeBytes) {
        throw new Error('File too large (max 1MB)');
      }

      await fs.copyFile(sourcePath, sandboxFilePath);
      
      await auditLogger.log({
        action: 'sandbox_copy',
        filePath: sourcePath,
        details: `Copied to sandbox: ${sandboxFilePath}`,
        environment: 'sandbox',
      });

      return sandboxFilePath;
    } catch (error) {
      console.error('Failed to copy to sandbox:', error);
      throw new Error(`Sandbox copy failed: ${error}`);
    }
  }

  async writeFile(filePath: string, content: string, userId?: string, ipAddress?: string): Promise<void> {
    const pathCheck = isPathAllowed(filePath);
    if (!pathCheck.allowed) {
      throw new Error(`Access denied - ${pathCheck.reason || 'invalid path'}`);
    }

    if (Buffer.byteLength(content, 'utf-8') > this.maxFileSizeBytes) {
      throw new Error('File too large (max 1MB)');
    }

    const targetPath = this.sandboxEnabled 
      ? await this.getSandboxFilePath(filePath)
      : filePath;

    try {
      // Read current content for audit
      let beforeContent = '';
      try {
        beforeContent = await fs.readFile(targetPath, 'utf-8');
      } catch {
        // File might not exist yet
      }

      // Write file
      await fs.writeFile(targetPath, content, 'utf-8');

      // Log the change
      await auditLogger.logFileWrite(
        filePath,
        beforeContent,
        content,
        userId,
        ipAddress
      );

      if (this.sandboxEnabled) {
        console.log(`✅ [SANDBOX] File written to: ${targetPath}`);
      }
    } catch (error) {
      await auditLogger.log({
        action: 'file_write_error',
        userId,
        ipAddress,
        filePath,
        success: false,
        errorMsg: String(error),
        environment: this.sandboxEnabled ? 'sandbox' : 'production',
      });
      throw error;
    }
  }

  async readFile(filePath: string, userId?: string, ipAddress?: string): Promise<string> {
    const pathCheck = isPathAllowed(filePath);
    if (!pathCheck.allowed) {
      throw new Error(`Access denied - ${pathCheck.reason || 'invalid path'}`);
    }

    const targetPath = this.sandboxEnabled
      ? await this.getSandboxFilePath(filePath, false) // Don't create if doesn't exist
      : filePath;

    try {
      const stats = await fs.stat(targetPath);
      if (stats.size > this.maxFileSizeBytes) {
        throw new Error('File too large (max 1MB)');
      }

      const content = await fs.readFile(targetPath, 'utf-8');
      
      await auditLogger.logFileRead(filePath, userId, ipAddress);

      return content;
    } catch (error) {
      // If sandbox file doesn't exist, try reading from original
      if (this.sandboxEnabled && targetPath !== filePath) {
        const stats = await fs.stat(filePath);
        if (stats.size > this.maxFileSizeBytes) {
          throw new Error('File too large (max 1MB)');
        }

        const content = await fs.readFile(filePath, 'utf-8');
        await auditLogger.logFileRead(filePath, userId, ipAddress);
        return content;
      }
      throw error;
    }
  }

  private async getSandboxFilePath(originalPath: string, createDir: boolean = true): Promise<string> {
    const relativePath = path.relative('/opt/gpti', originalPath);
    const sandboxFilePath = path.join(this.sandboxPath, relativePath);

    if (createDir) {
      await fs.mkdir(path.dirname(sandboxFilePath), { recursive: true });
    }

    return sandboxFilePath;
  }

  async clearSandbox(): Promise<void> {
    if (!this.sandboxEnabled) return;

    try {
      await fs.rm(this.sandboxPath, { recursive: true, force: true });
      await this.initializeSandbox();
      
      await auditLogger.log({
        action: 'sandbox_clear',
        details: 'Sandbox cleared',
        environment: 'sandbox',
      });

      console.log('✅ Sandbox cleared');
    } catch (error) {
      console.error('Failed to clear sandbox:', error);
      throw error;
    }
  }

  async getSandboxStatus(): Promise<{
    enabled: boolean;
    path: string;
    fileCount: number;
    totalSize: number;
  }> {
    if (!this.sandboxEnabled) {
      return {
        enabled: false,
        path: '',
        fileCount: 0,
        totalSize: 0,
      };
    }

    try {
      let fileCount = 0;
      let totalSize = 0;

      const countFiles = async (dir: string): Promise<void> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await countFiles(fullPath);
          } else {
            fileCount++;
            const stats = await fs.stat(fullPath);
            totalSize += stats.size;
          }
        }
      };

      await countFiles(this.sandboxPath);

      return {
        enabled: true,
        path: this.sandboxPath,
        fileCount,
        totalSize,
      };
    } catch (error) {
      return {
        enabled: true,
        path: this.sandboxPath,
        fileCount: 0,
        totalSize: 0,
      };
    }
  }
}

export const sandboxManager = SandboxManager.getInstance();
