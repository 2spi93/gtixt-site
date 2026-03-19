import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // TODO: Get current session from auth context
    return NextResponse.json(
      {
        session: null,
        authenticated: false,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}
