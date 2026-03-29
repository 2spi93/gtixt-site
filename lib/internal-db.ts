import { Pool } from "pg";
import { readFileSync } from "node:fs";

let pool: Pool | null = null;

export const getDatabaseUrl = (): string | null => {
  const direct = process.env.DATABASE_URL?.trim();
  const filePath = process.env.DATABASE_URL_FILE?.trim();
  let url = direct || null;

  if (!url && filePath) {
    try {
      const fromFile = readFileSync(filePath, "utf8").trim();
      if (fromFile) {
        process.env.DATABASE_URL = fromFile;
        url = fromFile;
      }
    } catch {
      return null;
    }
  }

  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (!parsed.password) return null;
  } catch {
    return null;
  }
  return url;
};

export const getPool = (): Pool | null => {
  const url = getDatabaseUrl();
  if (!url) return null;
  if (!pool) {
    pool = new Pool({ connectionString: url });
  }
  return pool;
};
