import React from 'react';

const ProofLayer = ({ snapshotKey, createdAt, sha256, count, onVerify }) => {
  return (
    <div className="proof-layer">
      <div className="proof-item">
        <span className="proof-label">Snapshot Key:</span>
        <span className="proof-value font-mono">{snapshotKey}</span>
      </div>
      <div className="proof-item">
        <span className="proof-label">Created At:</span>
        <span className="proof-value">{createdAt}</span>
      </div>
      <div className="proof-item">
        <span className="proof-label">SHA256:</span>
        <span className="proof-value font-mono text-xs">{sha256}</span>
      </div>
      <div className="proof-item">
        <span className="proof-label">Count:</span>
        <span className="proof-value">{count} records</span>
      </div>
      <div className="proof-item">
        <button
          className="btn btn-secondary btn-sm"
          onClick={onVerify}
          style={{ marginLeft: 'auto' }}
        >
          Verify Integrity
        </button>
      </div>
    </div>
  );
};

export default ProofLayer;