import React from 'react';

interface MetricItem {
  label: string;
  value: string | number | null;
  status?: 'success' | 'warning' | 'neutral';
}

interface Props {
  metrics: Record<string, any>;
}

const STATUS_ICONS = {
  success: '✔',
  warning: '⚠',
  neutral: '○',
};

const STATUS_COLORS = {
  success: '#10b981',
  warning: '#f59e0b',
  neutral: '#9ca3af',
};

export default function MetricsDetailPanel({ metrics }: Props) {
  const hasValue = (value: unknown): boolean => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim() !== '' && value.trim() !== '—';
    return true;
  };
  const statusForValue = (value: unknown, warning = false): 'success' | 'warning' | 'neutral' => {
    if (!hasValue(value)) return 'neutral';
    if (warning) return 'warning';
    return 'success';
  };

  // Parse metrics data
  const metricsArray: MetricItem[] = [
    {
      label: 'Payout frequency',
      value: metrics?.payout_frequency || '—',
      status: statusForValue(metrics?.payout_frequency),
    },
    {
      label: 'Max drawdown rule',
      value: metrics?.max_drawdown_rule !== undefined && metrics?.max_drawdown_rule !== null
        ? `${metrics.max_drawdown_rule}%`
        : '—',
      status: statusForValue(metrics?.max_drawdown_rule),
    },
    {
      label: 'Daily drawdown rule',
      value: metrics?.daily_drawdown_rule !== undefined && metrics?.daily_drawdown_rule !== null
        ? `${metrics.daily_drawdown_rule}%`
        : '—',
      status: statusForValue(metrics?.daily_drawdown_rule),
    },
    {
      label: 'Rule changes frequency',
      value: metrics?.rule_changes_frequency || '—',
      status: statusForValue(metrics?.rule_changes_frequency),
    },
    {
      label: 'NA rate',
      value: metrics?.na_rate !== undefined && metrics?.na_rate !== null ? `${metrics.na_rate}%` : '—',
      status: statusForValue(metrics?.na_rate, metrics?.na_rate !== undefined && metrics?.na_rate !== null && metrics.na_rate >= 30),
    },
    {
      label: 'Jurisdiction tier',
      value: metrics?.jurisdiction_tier || '—',
      status: statusForValue(metrics?.jurisdiction_tier),
    },
    {
      label: 'Model type',
      value: metrics?.model_type || '—',
      status: statusForValue(metrics?.model_type),
    },
  ];

  return (
    <div className="metrics-detail-panel">
      <h2>Metrics Detail Panel</h2>
      <div className="metrics-table">
        <div className="table-header">
          <div className="col-metric">Metric</div>
          <div className="col-value">Value</div>
          <div className="col-status">Status</div>
        </div>
        {metricsArray.map((metric, idx) => (
          <div key={idx} className="table-row">
            <div className="col-metric">
              <span className="metric-label">{metric.label}</span>
            </div>
            <div className="col-value">
              <span className="metric-value">{metric.value}</span>
            </div>
            <div className="col-status">
              <span
                className={`status-icon status-${metric.status}`}
                style={{
                  color: STATUS_COLORS[metric.status || 'neutral'],
                }}
                title={metric.status}
              >
                {STATUS_ICONS[metric.status || 'neutral']}
              </span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .metrics-detail-panel {
          margin: 3rem 0;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          overflow: hidden;
        }

        .metrics-detail-panel h2 {
          margin: 0;
          padding: 1.5rem;
          background: #f9f9f9;
          border-bottom: 1px solid #e5e5e5;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .metrics-table {
          display: flex;
          flex-direction: column;
        }

        .table-header {
          display: grid;
          grid-template-columns: 1fr 1fr 100px;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background: #f0f7ff;
          border-bottom: 2px solid #ddd;
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: uppercase;
          color: #666;
        }

        .table-row {
          display: grid;
          grid-template-columns: 1fr 1fr 100px;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f0f0f0;
          align-items: center;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-row:hover {
          background: #fafafa;
        }

        .col-metric {
          display: flex;
          align-items: center;
        }

        .metric-label {
          font-size: 0.95rem;
          color: #333;
          font-weight: 500;
        }

        .col-value {
          display: flex;
          align-items: center;
        }

        .metric-value {
          font-size: 0.95rem;
          color: #666;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .col-status {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .status-icon {
          font-size: 1.25rem;
          font-weight: bold;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 30px;
          height: 30px;
        }

        .status-success {
          color: #10b981;
        }

        .status-warning {
          color: #f59e0b;
        }

        .status-neutral {
          color: #9ca3af;
        }

        @media (max-width: 768px) {
          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .col-status {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
