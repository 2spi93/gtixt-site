import { useEffect, useState } from 'react';

interface FirmTypeData {
  firm_id?: string;
  name: string;
  firm_type?: string | null;
  type_confidence?: number;
  classification_notes?: string;
}

interface UseTypesData {
  types: Record<string, FirmTypeData>;
  loading: boolean;
  error: string | null;
}

const typeCache: Record<string, FirmTypeData> = {};
let loadPromise: Promise<Record<string, FirmTypeData>> | null = null;

const fetchTypes = async (): Promise<Record<string, FirmTypeData>> => {
  if (Object.keys(typeCache).length > 0) {
    return typeCache;
  }

  if (!loadPromise) {
    loadPromise = fetch('/api/firm-types')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.success && data.data) {
          Object.assign(typeCache, data.data);
          return typeCache;
        }
        throw new Error('Invalid response format');
      })
      .finally(() => {
        loadPromise = null;
      });
  }

  return loadPromise;
};

export const useTypesData = (): UseTypesData => {
  const [types, setTypes] = useState<Record<string, FirmTypeData>>(() => typeCache);
  const [loading, setLoading] = useState(Object.keys(typeCache).length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Object.keys(typeCache).length > 0) {
      return;
    }

    fetchTypes()
      .then(data => {
        setTypes(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { types, loading, error };
};

export const getTypeForFirm = (
  firmName?: string,
  firmId?: string,
  typesData?: Record<string, FirmTypeData>
): FirmTypeData | null => {
  if (!typesData) return null;

  const normalizedName = (firmName || '').toLowerCase();
  const normalizedId = (firmId || '').toLowerCase();

  return typesData[normalizedName] || typesData[normalizedId] || null;
};
