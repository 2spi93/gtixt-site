import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return list of available agents
    const agents = [
      {
        id: 'rvi',
        name: 'RVI Agent',
        description: 'Revenue & Financial Intelligence',
        status: 'active',
      },
      {
        id: 'rem',
        name: 'REM Agent',
        description: 'Regulatory & Enforcement Monitoring',
        status: 'active',
      },
      {
        id: 'sss',
        name: 'SSS Agent',
        description: 'Sanctions & Security Status',
        status: 'active',
      },
      {
        id: 'frp',
        name: 'FRP Agent',
        description: 'Firm Registration & Profile',
        status: 'active',
      },
      {
        id: 'irs',
        name: 'IRS Agent',
        description: 'Identity & Regulatory Status',
        status: 'active',
      },
      {
        id: 'mis',
        name: 'MIS Agent',
        description: 'Management & Industry Status',
        status: 'active',
      },
      {
        id: 'iip',
        name: 'IIP Agent',
        description: 'Insurance & Investment Products',
        status: 'active',
      },
    ];

    return NextResponse.json(
      { agents, total: agents.length },
      { status: 200 }
    );
  } catch (error) {
    console.error('Crawl agents error:', error);
    return NextResponse.json(
      { error: 'Failed to get crawl agents' },
      { status: 500 }
    );
  }
}
