/**
 * GTIXT Snapshot Signing
 * 
 * ECDSA signing for immutable snapshots.
 * Uses secp256k1 with SHA-256.
 * 
 * Env vars:
 * - GTIXT_ECDSA_PRIVATE_KEY (PEM or base64-encoded PEM)
 * - GTIXT_ECDSA_PUBLIC_KEY (PEM or base64-encoded PEM)
 */

import crypto from 'crypto';
import { isValidHash } from './hashing-utils';

export interface SnapshotSignature {
  signature: string;
  signed_by: string;
  signed_at: string;
  algorithm: 'ecdsa-secp256k1-sha256';
  public_key_fingerprint: string;
}

const SIGN_ALGORITHM = 'sha256';
const SIGNING_SCHEME = 'ecdsa-secp256k1-sha256';

export function signSnapshotHash(
  snapshotHash: string,
  signedBy = 'gtixt-signing-service'
): SnapshotSignature {
  if (!isValidHash(snapshotHash)) {
    throw new Error('Invalid snapshot hash format (expected 64 hex chars)');
  }

  const privateKey = loadPrivateKey();
  const publicKey = loadPublicKey();

  const signer = crypto.createSign(SIGN_ALGORITHM);
  signer.update(snapshotHash, 'utf8');
  signer.end();

  const signature = signer.sign(privateKey, 'base64');

  return {
    signature,
    signed_by: signedBy,
    signed_at: new Date().toISOString(),
    algorithm: SIGNING_SCHEME,
    public_key_fingerprint: fingerprintPublicKey(publicKey),
  };
}

export function verifySnapshotSignature(
  snapshotHash: string,
  signature: string,
  publicKeyOverride?: string
): boolean {
  if (!isValidHash(snapshotHash)) {
    return false;
  }

  const publicKey = publicKeyOverride ? normalizeKey(publicKeyOverride) : loadPublicKey();

  const verifier = crypto.createVerify(SIGN_ALGORITHM);
  verifier.update(snapshotHash, 'utf8');
  verifier.end();

  return verifier.verify(publicKey, signature, 'base64');
}

export function getPublicKeyPem(): string {
  return loadPublicKey();
}

function loadPrivateKey(): string {
  const key = process.env.GTIXT_ECDSA_PRIVATE_KEY;
  if (!key) {
    throw new Error('Missing GTIXT_ECDSA_PRIVATE_KEY');
  }
  return normalizeKey(key);
}

function loadPublicKey(): string {
  const key = process.env.GTIXT_ECDSA_PUBLIC_KEY;
  if (!key) {
    throw new Error('Missing GTIXT_ECDSA_PUBLIC_KEY');
  }
  return normalizeKey(key);
}

function normalizeKey(key: string): string {
  if (key.includes('BEGIN')) {
    return key;
  }
  return Buffer.from(key, 'base64').toString('utf8');
}

function fingerprintPublicKey(publicKey: string): string {
  const keyObj = crypto.createPublicKey(publicKey);
  const der = keyObj.export({ type: 'spki', format: 'der' }) as Buffer;
  return crypto.createHash('sha256').update(der).digest('hex');
}
