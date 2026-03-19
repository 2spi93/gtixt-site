/**
 * API endpoint to manage OpenAI API Key configuration
 * Uses OPENAI_API_KEY_FILE secret file by default.
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth';
import { getSecretEnv } from '@/lib/secret-env';

const ENV_FILE_PATH = path.join(process.cwd(), '.env.production.local');
const DEFAULT_OPENAI_KEY_FILE = '/run/secrets/gpti-site/openai_api_key';

async function readEnvFileSafe(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
}

async function resolveOpenAiKeyFilePath(): Promise<string> {
  const fromEnv = String(process.env.OPENAI_API_KEY_FILE || '').trim();
  if (fromEnv) return fromEnv;

  const envContent = await readEnvFileSafe(ENV_FILE_PATH);
  const line = envContent
    .split('\n')
    .find((item) => item.trim().startsWith('OPENAI_API_KEY_FILE='));

  if (line) {
    const [, value] = line.split('=', 2);
    const filePath = String(value || '').trim();
    if (filePath) return filePath;
  }

  return DEFAULT_OPENAI_KEY_FILE;
}

async function ensureOpenAiFileReferenceInEnv(filePath: string): Promise<void> {
  const envContent = await readEnvFileSafe(ENV_FILE_PATH);
  const lines = envContent ? envContent.split('\n') : [];

  let fileRefFound = false;
  const updated = lines.map((line) => {
    if (line.trim().startsWith('OPENAI_API_KEY_FILE=')) {
      fileRefFound = true;
      return `OPENAI_API_KEY_FILE=${filePath}`;
    }
    return line;
  });

  const sanitized = updated.filter((line) => !line.trim().startsWith('OPENAI_API_KEY='));

  if (!fileRefFound) {
    sanitized.push('');
    sanitized.push('# OpenAI Configuration');
    sanitized.push(`OPENAI_API_KEY_FILE=${filePath}`);
  }

  await fs.writeFile(ENV_FILE_PATH, sanitized.join('\n'), 'utf-8');
}

// GET - Check if OpenAI API key is configured
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminUser(req, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const apiKey = getSecretEnv('OPENAI_API_KEY');
    const isConfigured = !!apiKey && apiKey.trim().length > 0;
    
    return NextResponse.json({
      configured: isConfigured,
      masked: isConfigured ? `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}` : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check API key status' },
      { status: 500 }
    );
  }
}

// POST - Update OpenAI API key in secret file
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminUser(req, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const sameOriginError = requireSameOrigin(req);
    if (sameOriginError) return sameOriginError;

    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API key is required and must be a string' },
        { status: 400 }
      );
    }

    if (!apiKey.startsWith('sk-')) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key format (should start with sk-)' },
        { status: 400 }
      );
    }

    const keyFilePath = await resolveOpenAiKeyFilePath();
    await fs.mkdir(path.dirname(keyFilePath), { recursive: true });
    await fs.writeFile(keyFilePath, apiKey.trim(), { encoding: 'utf-8', mode: 0o600 });
    await fs.chmod(keyFilePath, 0o600).catch(() => null);
    await ensureOpenAiFileReferenceInEnv(keyFilePath);

    return NextResponse.json({
      success: true,
      message: 'OpenAI API key updated successfully in secret file. Restart the server for changes to take effect.',
      requiresRestart: true,
      target: 'OPENAI_API_KEY_FILE',
    });
  } catch (error) {
    console.error('Failed to update API key:', error);
    return NextResponse.json(
      { error: 'Failed to update API key secret file' },
      { status: 500 }
    );
  }
}

// DELETE - Clear OpenAI API key secret file
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdminUser(req, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const sameOriginError = requireSameOrigin(req);
    if (sameOriginError) return sameOriginError;

    const keyFilePath = await resolveOpenAiKeyFilePath();
    await fs.writeFile(keyFilePath, '', { encoding: 'utf-8', mode: 0o600 });
    await fs.chmod(keyFilePath, 0o600).catch(() => null);
    await ensureOpenAiFileReferenceInEnv(keyFilePath);

    return NextResponse.json({
      success: true,
      message: 'OpenAI API key cleared from secret file. Restart the server for changes to take effect.',
      target: 'OPENAI_API_KEY_FILE',
    });
  } catch (error) {
    console.error('Failed to remove API key:', error);
    return NextResponse.json(
      { error: 'Failed to clear API key secret file' },
      { status: 500 }
    );
  }
}
