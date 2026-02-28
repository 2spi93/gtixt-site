/**
 * API endpoint to manage OpenAI API Key configuration
 * Allows checking and updating OPENAI_API_KEY in .env file
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth';

const ENV_FILE_PATH = path.join(process.cwd(), '.env');

// GET - Check if OpenAI API key is configured
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminUser(req, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const apiKey = process.env.OPENAI_API_KEY;
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

// POST - Update OpenAI API key in .env file
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

    // Read current .env file
    let envContent = '';
    try {
      envContent = await fs.readFile(ENV_FILE_PATH, 'utf-8');
    } catch (error) {
      // If .env doesn't exist, create it
      envContent = '';
    }

    // Check if OPENAI_API_KEY already exists in .env
    const lines = envContent.split('\n');
    let found = false;
    const updatedLines = lines.map(line => {
      if (line.trim().startsWith('OPENAI_API_KEY=')) {
        found = true;
        return `OPENAI_API_KEY=${apiKey}`;
      }
      return line;
    });

    // If not found, add it to the AI Configuration section or at the end
    if (!found) {
      const aiConfigIndex = updatedLines.findIndex(line => 
        line.includes('# AI Configuration') || line.includes('# AI CONFIG')
      );
      
      if (aiConfigIndex !== -1) {
        // Add after AI Configuration comment
        updatedLines.splice(aiConfigIndex + 1, 0, `OPENAI_API_KEY=${apiKey}`);
      } else {
        // Add at the end
        updatedLines.push('');
        updatedLines.push('# OpenAI Configuration');
        updatedLines.push(`OPENAI_API_KEY=${apiKey}`);
      }
    }

    // Write updated content back to .env
    await fs.writeFile(ENV_FILE_PATH, updatedLines.join('\n'), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'OpenAI API key updated successfully. Restart the server for changes to take effect.',
      requiresRestart: true,
    });
  } catch (error) {
    console.error('Failed to update API key:', error);
    return NextResponse.json(
      { error: 'Failed to update API key in .env file' },
      { status: 500 }
    );
  }
}

// DELETE - Remove OpenAI API key from .env
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdminUser(req, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const sameOriginError = requireSameOrigin(req);
    if (sameOriginError) return sameOriginError;

    // Read current .env file
    const envContent = await fs.readFile(ENV_FILE_PATH, 'utf-8');
    
    // Remove OPENAI_API_KEY line
    const lines = envContent.split('\n');
    const filteredLines = lines.filter(line => 
      !line.trim().startsWith('OPENAI_API_KEY=')
    );

    // Write updated content back to .env
    await fs.writeFile(ENV_FILE_PATH, filteredLines.join('\n'), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'OpenAI API key removed. Restart the server for changes to take effect.',
    });
  } catch (error) {
    console.error('Failed to remove API key:', error);
    return NextResponse.json(
      { error: 'Failed to remove API key from .env file' },
      { status: 500 }
    );
  }
}
