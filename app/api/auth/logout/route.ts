import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    // TODO: Implement proper logout
    return NextResponse.json(
      { success: true, message: 'Logged out' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
