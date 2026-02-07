/**
 * Verification API Client
 * Connects to Phase 3 Week 4 API for FCA and Sanctions verification
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_VERIFICATION_API_URL || 'http://localhost:3001';
const IS_DEV = process.env.NODE_ENV === 'development';

export interface FCAVerification {
  status: 'AUTHORIZED' | 'SUSPENDED' | 'REVOKED' | 'NOT_FOUND';
  confidence: number;
  firmName?: string;
  frn?: string;
  authorizationDate?: string;
  permissions?: string[];
}

export interface SanctionsScreening {
  status: 'CLEAR' | 'SANCTIONED' | 'POTENTIAL_MATCH' | 'REVIEW_REQUIRED';
  matches: number;
  entities?: Array<{
    name: string;
    matchType: string;
    score: number;
    list: string;
  }>;
}

export interface CombinedVerificationResult {
  firmName: string;
  fca: FCAVerification;
  sanctions: SanctionsScreening;
  overallStatus: 'CLEAR' | 'SANCTIONED' | 'SUSPENDED' | 'REVIEW_REQUIRED' | 'NOT_FOUND';
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  duration: number;
  timestamp: string;
}

export interface VerificationStatistics {
  fcaIntegration: {
    status: string;
    mockMode: boolean;
    totalFirms: number;
  };
  sanctionsDatabase: {
    totalEntities: number;
    ofacEntities: number;
    unEntities: number;
  };
  screening: {
    totalScreenings: number;
    matches: number;
    average_duration_ms: number;
  };
  performance: {
    avgVerificationTime: number;
    avgScreeningTime: number;
    p95ResponseTime: number;
  };
}

/**
 * Verify a firm against FCA registry and sanctions lists
 */
export async function verifyFirm(firmName: string, country?: string): Promise<CombinedVerificationResult | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firmName, country }),
    });

    if (!response.ok) {
      console.error('Verification API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.status === 'success' ? data.data : null;
  } catch (error) {
    console.error('Failed to verify firm:', error);
    return null;
  }
}

/**
 * Screen an entity against sanctions lists only
 */
export async function screenEntity(
  name: string,
  threshold?: number,
  matchTypes?: string[]
): Promise<SanctionsScreening | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/screen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, threshold, matchTypes }),
    });

    if (!response.ok) {
      console.error('Screening API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.status === 'success' ? data.data : null;
  } catch (error) {
    console.error('Failed to screen entity:', error);
    return null;
  }
}

/**
 * Get verification service statistics
 */
export async function getVerificationStatistics(): Promise<VerificationStatistics | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/statistics`);

    if (!response.ok) {
      console.error('Statistics API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.status === 'success' ? data.data : null;
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
    return null;
  }
}

/**
 * Check API health
 */
export async function checkAPIHealth(): Promise<boolean> {
  // In development, skip API check if not available
  if (IS_DEV && !process.env.NEXT_PUBLIC_VERIFICATION_API_URL) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      signal: AbortSignal.timeout(2000), // 2s timeout
    });
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    // Silently fail in dev mode
    if (!IS_DEV) {
      console.error('API health check failed:', error);
    }
    return false;
  }
}

/**
 * Format verification status for display
 */
export function formatVerificationStatus(status: string): { text: string; color: string; icon: string } {
  switch (status) {
    case 'CLEAR':
      return { text: 'Clear', color: '#00D1C1', icon: '✓' };
    case 'SANCTIONED':
      return { text: 'Sanctioned', color: '#FF6B6B', icon: '⚠' };
    case 'SUSPENDED':
      return { text: 'Suspended', color: '#FF9500', icon: '⚠' };
    case 'REVIEW_REQUIRED':
      return { text: 'Review Required', color: '#FFD700', icon: '!' };
    case 'NOT_FOUND':
      return { text: 'Not Found', color: '#666', icon: '?' };
    default:
      return { text: status, color: '#999', icon: '•' };
  }
}

/**
 * Format risk score for display
 */
export function formatRiskScore(score: string): { text: string; color: string } {
  switch (score) {
    case 'LOW':
      return { text: 'Low Risk', color: '#00D1C1' };
    case 'MEDIUM':
      return { text: 'Medium Risk', color: '#FFD700' };
    case 'HIGH':
      return { text: 'High Risk', color: '#FF6B6B' };
    default:
      return { text: score, color: '#999' };
  }
}
