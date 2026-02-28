// /opt/gpti/gpti-site/app/api/admin/file-explorer/route.ts

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getAllowedRoots, isPathAllowed } from '@/lib/path-guard';
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  children?: FileNode[];
}


const getFileTree = async (dirPath: string, depth: number = 0, maxDepth: number = 3): Promise<FileNode[]> => {
  if (depth > maxDepth) return [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      // Skip node_modules, .next, .git, etc.
      if (['.git', 'node_modules', '.next', 'dist', 'build', '.cache'].includes(entry.name)) {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);
      const stats = await fs.stat(fullPath);

      const node: FileNode = {
        name: entry.name,
        path: fullPath,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: entry.isFile() ? stats.size : undefined,
        modified: stats.mtime.toISOString(),
      };

      // Recursively get children for directories
      if (entry.isDirectory() && depth < maxDepth) {
        node.children = await getFileTree(fullPath, depth + 1, maxDepth);
      }

      nodes.push(node);
    }

    return nodes.sort((a, b) => {
      // Directories first
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error(`Failed to read directory ${dirPath}:`, error);
    return [];
  }
};

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminUser(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const requestedPath = searchParams.get('path');
    const maxDepth = parseInt(searchParams.get('depth') || '2', 10);

    if (requestedPath) {
      // Get specific directory
      const pathCheck = isPathAllowed(requestedPath);
      if (!pathCheck.allowed) {
        return NextResponse.json(
          { error: `Access denied - ${pathCheck.reason || 'invalid path'}` },
          { status: 403 }
        );
      }

      const tree = await getFileTree(requestedPath, 0, maxDepth);
      return NextResponse.json({
        success: true,
        path: requestedPath,
        tree,
      });
    }

    // Get all root directories
    const roots: FileNode[] = [];
    for (const root of getAllowedRoots()) {
      try {
        const stats = await fs.stat(root);
        const children = await getFileTree(root, 0, maxDepth);
        
        roots.push({
          name: path.basename(root),
          path: root,
          type: 'directory',
          modified: stats.mtime.toISOString(),
          children,
        });
      } catch (error) {
        // Skip if directory doesn't exist
        console.warn(`Root directory ${root} not accessible:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      roots,
    });
  } catch (error) {
    console.error('GET /api/admin/file-explorer failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file tree', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminUser(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const sameOriginError = requireSameOrigin(request);
    if (sameOriginError) return sameOriginError;

    const body = await request.json();
    const { path: filePath } = body as { path?: string };

    if (!filePath) {
      return NextResponse.json({ error: 'path is required' }, { status: 400 });
    }

    const pathCheck = isPathAllowed(filePath);
    if (!pathCheck.allowed) {
      return NextResponse.json(
        { error: `Access denied - ${pathCheck.reason || 'invalid path'}` },
        { status: 403 }
      );
    }

    const stats = await fs.stat(filePath);
    
    if (!stats.isFile()) {
      return NextResponse.json(
        { error: 'Path is not a file' },
        { status: 400 }
      );
    }

    // Limit file size to 1MB
    if (stats.size > 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large (max 1MB)' },
        { status: 413 }
      );
    }

    const content = await fs.readFile(filePath, 'utf-8');

    return NextResponse.json({
      success: true,
      filePath,
      content,
      size: stats.size,
      modified: stats.mtime.toISOString(),
    });
  } catch (error) {
    console.error('POST /api/admin/file-explorer failed:', error);
    return NextResponse.json(
      { error: 'Failed to read file', details: String(error) },
      { status: 500 }
    );
  }
}
