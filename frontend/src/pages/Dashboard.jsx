import React, { useState, useEffect } from 'react';
import { useDetections, useDailyTrends, useSystemHealth, useCameraAnalytics } from '../hooks/queries';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';

const Dashboard = () => {
  const [selectedDetectionId, setSelectedDetectionId] = useState(null);
  
  // Health fetch
  const { data: healthData, refetch: refetchHealth } = useSystemHealth({
    refetchInterval: 15000 // every 15s
  });

  // Recent detections fetch (limit: 5)
  const { data: detectionsData } = useDetections({
    limit: 5,
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
  
  const recentDetections = detectionsData?.data || [];
  
  // Daily trends for last 7 days chart
  const { data: dailyData } = useDailyTrends(7);
  
  // Camera statistics
  const { data: cameraStats } = useCameraAnalytics();

  // Bounding box mapping details
  const latestDetection = recentDetections[0];

  const formatTime = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toISOString().replace('T', ' ').substring(0, 19);
  };

  const getBBoxOverlayStyle = () => {
    if (!latestDetection?.boundingBox?.width) return null;
    const box = latestDetection.boundingBox;
    // Assumes native 640x480 resolution mapping
    const nativeW = 640;
    const nativeH = 480;
    return {
      left: `${(box.x / nativeW) * 100}%`,
      top: `${(box.y / nativeH) * 100}%`,
      width: `${(box.width / nativeW) * 100}%`,
      height: `${(box.height / nativeH) * 100}%`,
    };
  };

  // Build last 7 days chart data
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    const matched = dailyData?.find(item => item.date === dateStr);
    chartData.push({
      name: label,
      count: matched ? matched.count : 0
    });
  }

  return (
    <div className="space-y-6">
      
      {/* Telemetry status box bar */}
      <div className="border border-slate-200 bg-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
        <div className="font-semibold text-slate-700 uppercase tracking-wider">CURRENT DEPLOYMENT STATUS:</div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={healthData?.database === 'connected' ? 'online' : 'offline'} />
            <span className="text-slate-500">DATABASE</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={(healthData?.cloudinary === 'configured' || healthData?.cloudinary === 'connected' || healthData?.cloudinary === 'loaded') ? 'online' : 'offline'} />
            <span className="text-slate-500">CLOUD STORAGE</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={(healthData?.telegram === 'connected' || healthData?.telegram === 'active') ? 'online' : 'offline'} />
            <span className="text-slate-500">TG ALERTS</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={healthData?.model === 'loaded' ? 'online' : 'offline'} />
            <span className="text-slate-500">YOLO INFERENCE</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Camera capture & spec details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 mb-4 font-mono">LATEST CAMERATRAP CAPTURE</h2>
            
            {latestDetection ? (
              <div className="space-y-4">
                {/* Viewport Frame */}
                <div 
                  className="relative bg-slate-100 border border-slate-200 overflow-hidden aspect-video flex items-center justify-center cursor-pointer"
                  onClick={() => setSelectedDetectionId(latestDetection.detectionId)}
                >
                  {latestDetection.imageUrl && latestDetection.imageUrl !== 'null' ? (
                    <>
                      <img 
                        src={latestDetection.imageUrl} 
                        alt="Latest camera trap" 
                        className="max-h-full max-w-full object-contain" 
                      />
                      {getBBoxOverlayStyle() && (
                        <div 
                          className="absolute border-2 border-red-600 pointer-events-none animate-pulse"
                          style={getBBoxOverlayStyle()}
                        ></div>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 font-mono">NO IMAGE CAPTURED</span>
                  )}
                </div>

                {/* Specs parameters table */}
                <div className="border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs font-mono text-left">
                    <tbody className="divide-y divide-slate-200">
                      <tr className="bg-slate-50">
                        <td className="px-4 py-2 font-semibold text-slate-600 w-1/3">STATION ID</td>
                        <td className="px-4 py-2 text-slate-900 font-bold">{latestDetection.cameraId}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-semibold text-slate-600">CAP TIME (UTC)</td>
                        <td className="px-4 py-2 text-slate-900">{formatTime(latestDetection.timestamp)}</td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="px-4 py-2 font-semibold text-slate-600">DETECTION CLASS</td>
                        <td className="px-4 py-2 text-slate-900 font-bold uppercase">
                          {String(latestDetection.detectionClass || 'leopard').replace('_', ' ')}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-semibold text-slate-600">CONFIDENCE SCORE</td>
                        <td className="px-4 py-2 text-slate-900 font-bold">
                          {(latestDetection.confidenceScore * 100).toFixed(1)}%
                        </td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td class="px-4 py-2 font-semibold text-slate-600">BOUNDING BOX AREA</td>
                        <td className="px-4 py-2 text-slate-900">
                          {latestDetection.boundingBox && latestDetection.boundingBox.width
                            ? `X:${latestDetection.boundingBox.x} Y:${latestDetection.boundingBox.y} W:${latestDetection.boundingBox.width} H:${latestDetection.boundingBox.height}`
                            : 'FULL FRAME'
                          }
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 p-8 text-center text-slate-400 font-mono text-xs">
                NO CAPTURE INFERENCES STORED IN DATABASE
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column: charts and tables (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Recharts Bar chart */}
          <div className="border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 mb-4 font-mono">DETECTION ACTIVITY (LAST 7 DAYS)</h2>
            <div className="h-44 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                  <YAxis stroke="#6b7280" allowDecimals={false} tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                  <Bar dataKey="count" fill="#111827" barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent list table */}
          <div className="border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 mb-4 font-mono">RECENT LEOPARD DETECTIONS</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                    <th className="px-3 py-2">DATE/TIME</th>
                    <th className="px-3 py-2 text-right">STATION</th>
                    <th className="px-3 py-2 text-right">CONF.</th>
                    <th className="px-3 py-2 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {recentDetections.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-3 py-4 text-center text-slate-400">No events captured.</td>
                    </tr>
                  ) : (
                    recentDetections.map((d) => (
                      <tr key={d.detectionId} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          {new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(d.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">{d.cameraId}</td>
                        <td className="px-3 py-2 text-right text-slate-500">{(d.confidenceScore * 100).toFixed(0)}%</td>
                        <td className="px-3 py-2 text-center">
                          <button 
                            onClick={() => setSelectedDetectionId(d.detectionId)}
                            className="text-slate-900 border border-slate-300 hover:border-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase bg-white"
                          >
                            VIEW
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Camera deploy summary table */}
          <div className="border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 mb-4 font-mono">CAMERA DEPLOYMENTS SUMMARY</h2>
            <div className="overflow-x-auto">
              <table class="w-full text-xs font-mono text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                    <th className="px-3 py-2">CAMERA ID</th>
                    <th className="px-3 py-2 text-right">TOTAL EVENTS</th>
                    <th className="px-3 py-2 text-right">LAST ACTIVE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {!cameraStats || cameraStats.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-3 py-4 text-center text-slate-400">No active stations.</td>
                    </tr>
                  ) : (
                    cameraStats.map((c) => (
                      <tr key={c.cameraId} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-semibold text-slate-900">{c.cameraId}</td>
                        <td className="px-3 py-2 text-right">{c.count}</td>
                        <td className="px-3 py-2 text-right text-slate-500">
                          {c.lastDetection ? new Date(c.lastDetection).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Inspect drawer overlay */}
      {selectedDetectionId && (
        <InspectorDrawerWrapper 
          detectionId={selectedDetectionId} 
          onClose={() => setSelectedDetectionId(null)} 
        />
      )}
    </div>
  );
};

// Helper component that fetches the detail dynamically and connects to mutation
const InspectorDrawerWrapper = ({ detectionId, onClose }) => {
  const { data: detection } = useDetections({ limit: 100 });
  const selectedObj = detection?.data?.find(d => d.detectionId === detectionId);
  const deleteMutation = useDeleteDetection();

  const handleDelete = async (id) => {
    const ok = window.confirm('CONFIRM DELETION: Are you sure you want to delete this camera trap capture?');
    if (ok) {
      await deleteMutation.mutateAsync(id);
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      detection={selectedObj} 
      onDelete={handleDelete} 
    />
  );
};

export default Dashboard;
