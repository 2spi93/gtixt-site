import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5434'),
  database: process.env.DB_NAME || 'gpti',
  user: process.env.DB_USER || 'gpti',
  password: process.env.DB_PASSWORD || 'pNbl724vRljgeirj9IMe9LaOFRppfuQFmNPKjgj0',
});

interface FirmTypeData {
  firm_id?: string;
  name: string;
  firm_type?: string | null;
  type_confidence?: number;
  classification_notes?: string;
}

interface FirmTypeResponse {
  success: boolean;
  data?: Record<string, FirmTypeData>;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FirmTypeResponse>
) {
  try {
    // Get all firms with their type classification
    const query = `
      SELECT 
        firm_id,
        name,
        firm_type,
        type_confidence,
        classification_notes
      FROM firms
      WHERE firm_type IS NOT NULL
      ORDER BY name
    `;

    const result = await pool.query(query);
    
    // Convert to map for easy lookup by name or firm_id
    const typeMap: Record<string, FirmTypeData> = {};
    
    for (const row of result.rows) {
      // Index by both name (normalized) and firm_id
      const normalizedName = (row.name || '').toLowerCase();
      typeMap[normalizedName] = {
        firm_id: row.firm_id,
        name: row.name,
        firm_type: row.firm_type,
        type_confidence: row.type_confidence,
        classification_notes: row.classification_notes,
      };
      
      if (row.firm_id) {
        typeMap[row.firm_id.toLowerCase()] = typeMap[normalizedName];
      }
    }

    res.status(200).json({
      success: true,
      data: typeMap,
    });
  } catch (error) {
    console.error('Error fetching firm types:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch firm types',
    });
  }
}
