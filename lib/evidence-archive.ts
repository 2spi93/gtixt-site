/**
 * GTIXT Evidence Archive
 * 
 * Stores raw evidence artifacts and returns stable archive URLs.
 * Supports pluggable uploaders or local filesystem storage.
 * 
 * Env vars:
 * - EVIDENCE_ARCHIVE_BASE_URL (e.g., https://minio.example.com/bucket)
 * - EVIDENCE_ARCHIVE_BUCKET (default: gtixt-evidence-archive)
 * - EVIDENCE_ARCHIVE_PREFIX (optional path prefix)
 * - EVIDENCE_ARCHIVE_LOCAL_DIR (optional local storage dir)
 */

import crypto from 'crypto';
import path from 'path';
import { promises as fs } from 'fs';

export interface EvidenceArchiveInput {
  evidence_id: string;
  firm_id: string;
  snapshot_id?: string;
  source_url?: string;
  content: Buffer;
  content_type: string;
  file_extension?: string; // e.g. "pdf", "json"
}

export interface EvidenceArchiveResult {
  raw_data_hash: string;
  archive_url: string;
  object_key: string;
  bytes: number;
  stored: boolean;
  content_type: string;
}

export type EvidenceUploader = (params: {
  object_key: string;
  content: Buffer;
  content_type: string;
}) => Promise<void>;

const ARCHIVE_BASE_URL = process.env.EVIDENCE_ARCHIVE_BASE_URL || '';
const ARCHIVE_BUCKET = process.env.EVIDENCE_ARCHIVE_BUCKET || 'gtixt-evidence-archive';
const ARCHIVE_PREFIX = process.env.EVIDENCE_ARCHIVE_PREFIX || '';
const LOCAL_DIR = process.env.EVIDENCE_ARCHIVE_LOCAL_DIR || path.join(process.cwd(), 'public', 'evidence-archive');

export async function archiveEvidence(
  input: EvidenceArchiveInput,
  uploader?: EvidenceUploader
): Promise<EvidenceArchiveResult> {
  const rawHash = sha256Buffer(input.content);
  const objectKey = buildEvidenceArchiveKey(input);
  let stored = false;

  if (uploader) {
    await uploader({
      object_key: objectKey,
      content: input.content,
      content_type: input.content_type,
    });
    stored = true;
  } else if (LOCAL_DIR) {
    const fullPath = path.join(LOCAL_DIR, objectKey);
    await ensureDirectory(path.dirname(fullPath));
    await fs.writeFile(fullPath, input.content);
    stored = true;
  }

  return {
    raw_data_hash: rawHash,
    archive_url: buildArchiveUrl(objectKey),
    object_key: objectKey,
    bytes: input.content.length,
    stored,
    content_type: input.content_type,
  };
}

export function buildEvidenceArchiveKey(input: EvidenceArchiveInput): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const ext = input.file_extension ? `.${sanitizeExtension(input.file_extension)}` : '';
  const prefix = ARCHIVE_PREFIX ? `${ARCHIVE_PREFIX.replace(/\/+$/g, '')}/` : '';

  return `${prefix}${date}/${input.evidence_id}${ext}`;
}

export function buildArchiveUrl(objectKey: string): string {
  const baseUrl = ARCHIVE_BASE_URL
    ? ARCHIVE_BASE_URL.replace(/\/+$/g, '')
    : '/evidence-archive';

  return `${baseUrl}/${objectKey}`;
}

function sha256Buffer(content: Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function sanitizeExtension(ext: string): string {
  return ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

async function ensureDirectory(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}
