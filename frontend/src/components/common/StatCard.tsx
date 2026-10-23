import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'var(--primary-600)'
}) => {
  return (
    <div
      className="card"
      style={{
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: accentColor
        }}
      />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
            {value}
          </h2>
        </div>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--primary-50)',
            color: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 0 1px rgba(37, 99, 235, 0.1)'
          }}
        >
          {icon}
        </div>
      </div>
      {(subtitle || trend) && (
        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
          {trend && (
            <span
              style={{
                color: trend.isPositive ? 'var(--success-600)' : 'var(--danger-600)',
                fontWeight: 700
              }}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span style={{ color: 'var(--slate-500)' }}>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
