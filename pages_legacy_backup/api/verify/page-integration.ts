/**
 * Frontend Page Data Consumption Verification
 * Vérifie que les pages frontend consomment correctement les données des APIs
 */

import type { NextApiRequest, NextApiResponse } from 'next';

interface PageDataIntegration {
  page: string;
  apiEndpoints: string[];
  expectedFields: string[];
  lastVerified?: string;
  status: 'verified' | 'pending' | 'error';
}

interface VerificationResponse {
  pages: PageDataIntegration[];
  summary: {
    totalPages: number;
    verifiedPages: number;
    pendingPages: number;
    issues: string[];
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerificationResponse>
) {
  const getBaseUrl = (request: NextApiRequest): string => {
    const protoHeader = (request.headers['x-forwarded-proto'] || '').toString();
    const protocol = protoHeader ? protoHeader.split(',')[0] : 'http';
    const host = request.headers.host || 'localhost:3000';
    return `${protocol}://${host}`;
  };

  const pageIntegrations: PageDataIntegration[] = [
    {
      page: '/agents-dashboard',
      apiEndpoints: ['/api/agents/status', '/api/validation/metrics'],
      expectedFields: ['agents', 'totalAgents', 'productionReady'],
      status: 'pending'
    },
    {
      page: '/phase2',
      apiEndpoints: ['/api/agents/status', '/api/validation/metrics'],
      expectedFields: ['completeAgents', 'testsPassing', 'criticalIssues'],
      status: 'pending'
    },
    {
      page: '/firms',
      apiEndpoints: ['/api/firms'],
      expectedFields: ['firms', 'count', 'total'],
      status: 'pending'
    },
    {
      page: '/firm/[id]',
      apiEndpoints: ['/api/firm', '/api/firm-history', '/api/evidence'],
      expectedFields: ['name', 'score_0_100', 'pillar_scores'],
      status: 'pending'
    },
    {
      page: '/data',
      apiEndpoints: ['/api/firms', '/api/evidence', '/api/events'],
      expectedFields: ['firms', 'evidence', 'events'],
      status: 'pending'
    }
  ];

  const issues: string[] = [];
  const baseUrl = getBaseUrl(req);

  // Verify each endpoint
  for (const integration of pageIntegrations) {
    try {
      let allFieldsFound = true;
      let endpointResponsive = true;

      for (const endpoint of integration.apiEndpoints) {
        try {
          const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });

          if (!response.ok) {
            endpointResponsive = false;
            issues.push(`${integration.page}: ${endpoint} returned ${response.status}`);
            continue;
          }

          const data = await response.json();
          const target = data?.firm || data?.data || data;

          // Check for expected fields
          for (const field of integration.expectedFields) {
            if (!(field in data) && !(field in target)) {
              allFieldsFound = false;
              issues.push(
                `${integration.page}: Expected field "${field}" not found in ${endpoint}`
              );
            }
          }
        } catch (error) {
          endpointResponsive = false;
          issues.push(
            `${integration.page}: Cannot connect to ${endpoint} - ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      integration.status =
        endpointResponsive && allFieldsFound ? 'verified' : 'pending';
      integration.lastVerified = new Date().toISOString();
    } catch (error) {
      integration.status = 'error';
      issues.push(`Error verifying ${integration.page}: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  const verifiedCount = pageIntegrations.filter(p => p.status === 'verified').length;
  const pendingCount = pageIntegrations.filter(p => p.status === 'pending').length;

  res.status(200).json({
    pages: pageIntegrations,
    summary: {
      totalPages: pageIntegrations.length,
      verifiedPages: verifiedCount,
      pendingPages: pendingCount,
      issues
    }
  });
}
