// /opt/gpti/gpti-site/app/api/admin/sandbox/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox-manager';
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminUser(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const status = await sandboxManager.getSandboxStatus();
    
    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get sandbox status', details: String(error) },
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
    const { action } = body as { action?: 'enable' | 'disable' | 'clear' | 'init' };

    switch (action) {
      case 'enable':
        sandboxManager.setSandboxEnabled(true);
        await sandboxManager.initializeSandbox();
        return NextResponse.json({
          success: true,
          message: 'Sandbox enabled',
          enabled: true,
        });

      case 'disable':
        sandboxManager.setSandboxEnabled(false);
        return NextResponse.json({
          success: true,
          message: 'Sandbox disabled (⚠️ PRODUCTION MODE)',
          enabled: false,
        });

      case 'clear':
        await sandboxManager.clearSandbox();
        return NextResponse.json({
          success: true,
          message: 'Sandbox cleared',
        });

      case 'init':
        await sandboxManager.initializeSandbox();
        return NextResponse.json({
          success: true,
          message: 'Sandbox initialized',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: enable, disable, clear, or init' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to execute sandbox action', details: String(error) },
      { status: 500 }
    );
  }
}
