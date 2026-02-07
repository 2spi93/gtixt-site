import React from 'react';
import Link from 'next/link';

interface Props {
  firmId?: string;
  snapshotId?: string;
  snapshotObject?: string;
  sha256?: string;
  oversightGateVerdict?: string;
  naPolicy?: string;
}

export default function IntegrityAuditTrail({
  firmId: _firmId = '—',
  snapshotId = '—',
  snapshotObject,
  sha256 = '—',
  oversightGateVerdict = '—',
  naPolicy = '—',
}: Props) {
  const minioRoot = (process.env.NEXT_PUBLIC_MINIO_PUBLIC_ROOT || "http://51.210.246.61:9000/gpti-snapshots/").replace(/\/+$/, "");
  const snapshotPath = snapshotObject || (snapshotId.includes("/") ? snapshotId : "");
  const snapshotUrl = snapshotPath ? `${minioRoot}/${snapshotPath.replace(/^\/+/, "")}` : "";

  const handleCopyHash = async () => {
    if (!sha256 || sha256 === '—') return;
    try {
      await navigator.clipboard.writeText(sha256);
    } catch (err) {
      console.error('Failed to copy hash', err);
    }
  };

  return (
    <div className="integrity-audit-trail">
      <h2>Integrity & Audit Trail</h2>

      <div className="audit-fields">
        <div className="audit-item">
          <div className="audit-label">Snapshot ID</div>
          <div className="audit-value">
            <code>{snapshotId}</code>
          </div>
        </div>

        <div className="audit-item">
          <div className="audit-label">SHA-256 Hash</div>
          <div className="audit-value">
            <code className={sha256 === '—' ? 'placeholder' : ''}>
              {sha256 === '—' ? sha256 : sha256.substring(0, 20) + '...'}
            </code>
            {sha256 !== '—' && (
              <button className="copy-btn" title="Copy hash" onClick={handleCopyHash}>
                📋
              </button>
            )}
          </div>
        </div>

        <div className="audit-item">
          <div className="audit-label">Oversight Gate verdict</div>
          <div className="audit-value">
            <span className={`verdict-badge verdict-${oversightGateVerdict?.toLowerCase()}`}>
              {oversightGateVerdict}
            </span>
          </div>
        </div>

        <div className="audit-item">
          <div className="audit-label">NA policy applied</div>
          <div className="audit-value">{naPolicy}</div>
        </div>
      </div>

      <div className="audit-actions">
        <a
          className="action-btn download-btn"
          href={snapshotUrl || "#"}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!snapshotUrl}
        >
          Download Raw JSON ↗
        </a>
        <Link href="/integrity" className="action-btn verify-btn">
          Verify Snapshot
        </Link>
        <Link href="/methodology" className="action-link">
          View Methodology
        </Link>
      </div>

      <style jsx>{`
        .integrity-audit-trail {
          margin: 3rem 0;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          overflow: hidden;
        }

        .integrity-audit-trail h2 {
          margin: 0;
          padding: 1.5rem;
          background: #f9f9f9;
          border-bottom: 1px solid #e5e5e5;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .audit-fields {
          padding: 1.5rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          border-bottom: 1px solid #e5e5e5;
        }

        .audit-item {
          display: flex;
          flex-direction: column;
        }

        .audit-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: #999;
          font-weight: 600;
          margin-bottom: 0.5rem;
          letter-spacing: 0.5px;
        }

        .audit-value {
          font-size: 0.9rem;
          color: #333;
          word-break: break-all;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        code {
          background: #f0f0f0;
          padding: 0.25rem 0.5rem;
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.85rem;
          word-break: break-all;
        }

        code.placeholder {
          color: #999;
        }

        .copy-btn {
          background: none;
          border: none;
          padding: 0.25rem;
          cursor: pointer;
          font-size: 1rem;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .copy-btn:hover {
          opacity: 1;
        }

        .verdict-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          width: fit-content;
        }

        .verdict-pass {
          background: #d1f4e0;
          color: #0f5132;
        }

        .verdict-review {
          background: #fff3cd;
          color: #856404;
        }

        .verdict-reject {
          background: #f8d7da;
          color: #721c24;
        }

        .audit-actions {
          padding: 1.5rem;
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 0.75rem 1.25rem;
          border: 1px solid #ddd;
          background: white;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          color: #333;
          text-decoration: none;
        }

        .action-btn[aria-disabled='true'] {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }

        .action-btn:hover {
          background: #f9f9f9;
          border-color: #0066cc;
          color: #0066cc;
        }

        .download-btn {
          background: #f0f7ff;
          border-color: #0066cc;
          color: #0066cc;
        }

        .download-btn:hover {
          background: #e0ecff;
        }

        .verify-btn {
          background: #fff8e1;
          border-color: #f59e0b;
          color: #856404;
        }

        .verify-btn:hover {
          background: #ffe8a1;
        }

        .action-link {
          padding: 0.75rem 1.25rem;
          color: #0066cc;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .action-link:hover {
          background: #f0f7ff;
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .audit-fields {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .audit-actions {
            flex-direction: column;
          }

          .action-btn,
          .action-link {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
