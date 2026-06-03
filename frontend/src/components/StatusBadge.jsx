import React from 'react';

const StatusBadge = ({ status }) => {
  const getStyles = () => {
    switch (String(status).toLowerCase()) {
      case 'online':
      case 'connected':
      case 'healthy':
      case 'ready':
      case 'active':
      case 'loaded':
      case 'true':
      case 'sent':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          text: 'ONLINE'
        };
      case 'warning':
      case 'configured':
      case 'pend':
      case 'pending':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          text: 'PENDING'
        };
      case 'offline':
      case 'disconnected':
      case 'critical':
      case 'error':
      case 'false':
      default:
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          text: 'OFFLINE'
        };
    }
  };

  const styles = getStyles();
  const label = typeof status === 'string' && ['sent', 'pend', 'pending'].includes(status.toLowerCase()) ? status.toUpperCase() : styles.text;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border font-mono text-[10px] font-bold uppercase rounded-sm ${styles.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`}></span>
      {label}
    </span>
  );
};

export default StatusBadge;
