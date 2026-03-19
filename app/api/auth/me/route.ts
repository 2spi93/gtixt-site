import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // TODO: Get current user from auth context
    return NextResponse.json(
      {
        user: null,
        authenticated: false,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
