import React from 'react';

interface TypeBadgeProps {
  type?: 'A' | 'B' | 'C' | 'INSTITUTIONAL' | null;
  confidence?: number;
  showConfidence?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: React.CSSProperties;
}

export const TypeBadge: React.FC<TypeBadgeProps> = ({ 
  type, 
  confidence, 
  showConfidence = false,
  size = 'medium',
  style: customStyle = {}
}) => {
  if (!type) return null;

  const getTypeInfo = (t: string) => {
    switch (t) {
      case 'A':
        return {
          label: 'Real Capital',
          icon: '/assets/generated-icons/type-a.png',
          bgColor: 'rgba(76, 175, 80, 0.12)',
          textColor: '#2e7d32',
          description: 'Real broker accounts',
        };
      case 'B':
        return {
          label: 'Hybrid',
          icon: '/assets/generated-icons/type-b.png',
          bgColor: 'rgba(255, 152, 0, 0.12)',
          textColor: '#e65100',
          description: 'Selective real capital',
        };
      case 'C':
        return {
          label: 'Simulation',
          icon: '/assets/generated-icons/type-c.png',
          bgColor: 'rgba(244, 67, 54, 0.12)',
          textColor: '#c62828',
          description: 'Demo accounts only',
        };
      case 'INSTITUTIONAL':
        return {
          label: 'Institutional',
          icon: '/assets/generated-icons/type-institutional.png',
          bgColor: 'rgba(156, 39, 176, 0.12)',
          textColor: '#6a1b9a',
          description: 'Market maker / HFT',
        };
      default:
        return {
          label: 'Unknown',
          icon: '/assets/generated-icons/type-unknown.png',
          bgColor: 'rgba(158, 158, 158, 0.12)',
          textColor: '#424242',
          description: 'Unknown type',
        };
    }
  };

  const info = getTypeInfo(type);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { padding: '0.25rem 0.5rem', fontSize: '0.7rem' };
      case 'large':
        return { padding: '0.5rem 1rem', fontSize: '0.9rem' };
      case 'medium':
      default:
        return { padding: '0.35rem 0.75rem', fontSize: '0.75rem' };
    }
  };

  const baseStyle: React.CSSProperties = {
    ...getSizeStyles(),
    borderRadius: '4px',
    fontWeight: 600,
    display: 'inline-block',
    backgroundColor: info.bgColor,
    color: info.textColor,
    whiteSpace: 'nowrap',
    ...customStyle,
  };

  const confidenceText = showConfidence && confidence ? ` (${confidence}%)` : '';

  return (
    <span style={{ ...baseStyle, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }} title={info.description}>
      <img
        src={info.icon}
        alt=""
        aria-hidden="true"
        style={{ width: '0.95em', height: '0.95em', objectFit: 'contain' }}
      />
      {info.label}{confidenceText}
    </span>
  );
};

export const TypeBadgeSimple: React.FC<{ type?: 'A' | 'B' | 'C' }> = ({ type }) => {
  if (!type) return <>—</>;
  return <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Type {type}</span>;
};
