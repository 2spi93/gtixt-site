import React from "react";

export default function IntegrityCard({ pointer, snapshotUrl, expectedSha, onVerify, result, error }) {
  return (
    <div className="integrity-card">
      <h3>Integrity Verification</h3>

      {error && <div className="error">{error}</div>}

      <div className="section">
        <h4>Latest Pointer</h4>
        <pre className="json">{pointer ? JSON.stringify(pointer, null, 2) : "Loading..."}</pre>
      </div>

      <div className="section">
        <h4>Raw Snapshot URL</h4>
        <div className="url">{snapshotUrl || "—"}</div>
      </div>

      <div className="actions">
        <button className="btn" onClick={onVerify} disabled={!snapshotUrl || !expectedSha}>
          Verify SHA256
        </button>
        {snapshotUrl && (
          <a className="btn secondary" href={snapshotUrl} target="_blank" rel="noopener noreferrer">
            Download Raw Snapshot
          </a>
        )}
      </div>

      {result && (
        <div className="section">
          <h4>Verification Result</h4>
          <pre className="json">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <style jsx>{`
        .integrity-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }
        h3 {
          margin: 0 0 20px 0;
          font-size: 1.5rem;
        }
        h4 {
          margin: 15px 0 10px 0;
          font-size: 1.1rem;
          opacity: 0.9;
        }
        .section {
          margin-bottom: 20px;
        }
        .json {
          background: rgba(0, 0, 0, 0.2);
          padding: 10px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 12px;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-x: auto;
        }
        .url {
          font-family: monospace;
          font-size: 14px;
          word-break: break-all;
          background: rgba(0, 0, 0, 0.1);
          padding: 8px;
          border-radius: 4px;
        }
        .actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin: 20px 0;
        }
        .btn {
          padding: 10px 16px;
          border-radius: 8px;
          border: 1px solid rgba(0, 209, 193, 0.3);
          background: rgba(0, 209, 193, 0.1);
          color: #00d1c1;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn:hover {
          background: rgba(0, 209, 193, 0.2);
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .secondary {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
          color: #fff;
        }
        .error {
          background: rgba(255, 0, 0, 0.1);
          border: 1px solid rgba(255, 0, 0, 0.3);
          color: #ff6b6b;
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 15px;
        }
      `}</style>
    </div>
  );
}