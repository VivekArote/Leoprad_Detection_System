import React from 'react';
import StatusBadge from './StatusBadge';

const HealthCard = ({ title, status, provider, detailLabel, detailValue }) => {
  return (
    <div className="border border-slate-200 bg-white p-4 flex flex-col justify-between h-full">
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">{title}</span>
          <StatusBadge status={status} />
        </div>
        <div className="text-[10px] font-mono text-slate-500 space-y-1">
          <div>PROVIDER: {provider}</div>
          <div>{detailLabel}: {detailValue || '—'}</div>
        </div>
      </div>
    </div>
  );
};

export default HealthCard;
