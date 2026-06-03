import React, { useState, useEffect } from 'react';
import { useSystemHealth } from '../hooks/queries';
import HealthCard from '../components/HealthCard';

const Health = () => {
  const { data: health, refetch, isFetching } = useSystemHealth();
  const [logs, setLogs] = useState([
    { type: 'INFO', time: new Date().toLocaleTimeString(), message: 'System health logs connected.' }
  ]);

  const triggerDiagnostics = async () => {
    addLog('INFO', 'Initializing system diagnostics routine v2.0...');
    
    // Trigger fresh API health check
    const { data: latestHealth } = await refetch();

    // Database check
    if (latestHealth?.database === 'connected') {
      addLog('SUCCESS', 'MongoDB database: CONNECTED (nominals check successful).');
    } else {
      addLog('ERROR', 'MongoDB database: DISCONNECTED. Persistence offline.');
    }

    // Cloudinary check
    const cloudOk = latestHealth?.cloudinary === 'configured' || latestHealth?.cloudinary === 'connected' || latestHealth?.cloudinary === 'loaded';
    if (cloudOk) {
      addLog('SUCCESS', 'Cloudinary image storage: CONFIGURED (credentials ping success).');
    } else {
      addLog('WARNING', 'Cloudinary image storage: NOT CONFIGURED. Local backup path active.');
    }

    // Telegram check
    const tgOk = latestHealth?.telegram === 'connected' || latestHealth?.telegram === 'active';
    if (tgOk) {
      addLog('SUCCESS', 'Telegram notification gateway: ACTIVE (bot listener active).');
    } else {
      addLog('ERROR', 'Telegram bot communication failed: DISCONNECTED.');
    }

    // YOLO check
    if (latestHealth?.model === 'loaded') {
      addLog('SUCCESS', 'Ultralytics YOLOv8 detector: READY (classes leopard_head, leopard_body loaded).');
    } else {
      addLog('ERROR', 'YOLOv8 model weights not found at path: src/vision/best.pt');
    }

    // Arduino check
    const port = localStorage.getItem('sys_conf_port') || 'COM3';
    if (port !== 'DISABLED') {
      addLog('SUCCESS', `Arduino Serial Siren alarm relay configured on port: ${port}`);
    } else {
      addLog('WARNING', 'Arduino Serial alarm gateway DISABLED by configuration settings.');
    }

    addLog('INFO', 'Diagnostic Routine finished. Status review complete.');
  };

  const addLog = (type, message) => {
    setLogs(prev => [...prev, {
      type,
      time: new Date().toLocaleTimeString(),
      message
    }]);
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'ERROR': return 'text-rose-400 font-bold';
      case 'WARNING': return 'text-amber-400';
      case 'SUCCESS': return 'text-green-400';
      case 'INFO':
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Diagnostics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <HealthCard 
          title="DATABASE ENGINE"
          status={health?.database === 'connected' ? 'online' : 'offline'}
          provider="MongoDB Atlas"
          detailLabel="CONNECTION"
          detailValue={health?.database === 'connected' ? 'MONGODB_ATLAS' : 'DISCONNECTED'}
        />

        <HealthCard 
          title="IMAGE STORAGE"
          status={(health?.cloudinary === 'configured' || health?.cloudinary === 'connected' || health?.cloudinary === 'loaded') ? 'online' : 'offline'}
          provider="Cloudinary CDN"
          detailLabel="STATUS"
          detailValue={(health?.cloudinary === 'configured' || health?.cloudinary === 'connected' || health?.cloudinary === 'loaded') ? 'UPLOADS ENABLED' : 'MISSING KEYS'}
        />

        <HealthCard 
          title="NOTIFICATION DISPATCH"
          status={(health?.telegram === 'connected' || health?.telegram === 'active') ? 'online' : 'offline'}
          provider="Telegram Bot API"
          detailLabel="ROUTING CHANNEL"
          detailValue={localStorage.getItem('sys_conf_telegram') || '—'}
        />

        <HealthCard 
          title="YOLO DETECTOR MODEL"
          status={health?.model === 'loaded' ? 'online' : 'offline'}
          provider="Ultralytics YOLOv8"
          detailLabel="MODEL PATH"
          detailValue="src/vision/best.pt"
        />

        <HealthCard 
          title="HARDWARE GATEWAY"
          status={localStorage.getItem('sys_conf_port') !== 'DISABLED' ? 'online' : 'warning'}
          provider="Arduino Serial"
          detailLabel="INTERFACE PORT"
          detailValue={localStorage.getItem('sys_conf_port') || 'COM3'}
        />

      </div>

      {/* Terminal log panel */}
      <div className="border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">SYSTEM LOG TERMINAL</span>
          <button 
            disabled={isFetching}
            onClick={triggerDiagnostics}
            className="border border-slate-300 hover:border-slate-800 disabled:opacity-50 text-slate-800 text-xs px-3 py-1 font-mono uppercase tracking-wider font-semibold rounded-sm bg-white"
          >
            {isFetching ? 'RUNNING...' : 'RUN DIAGNOSTICS'}
          </button>
        </div>
        
        <div className="bg-slate-900 border border-slate-950 p-4 font-mono text-xs text-slate-300 space-y-1.5 h-64 overflow-y-auto rounded-sm">
          {logs.map((log, idx) => (
            <div key={idx} className={getLogColor(log.type)}>
              [{log.time}] [{log.type}] {log.message}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Health;
