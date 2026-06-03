import React, { useEffect, useRef } from 'react';

const Modal = ({ isOpen, onClose, detection, onDelete }) => {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !detection) return null;

  const {
    detectionId,
    timestamp,
    cameraId,
    cameraLocation,
    detectionClass,
    confidenceScore,
    alertSent,
    boundingBox,
    processingTimeMs,
    imageUrl
  } = detection;

  const hasImg = imageUrl && imageUrl !== 'null';

  const formatTime = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    const pad = (num) => String(num).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const getBBoxOverlayStyle = () => {
    if (!boundingBox || !boundingBox.width) return null;
    
    // Assumes native capture resolution 640x480 for mapping
    const nativeW = 640;
    const nativeH = 480;
    
    return {
      left: `${(boundingBox.x / nativeW) * 100}%`,
      top: `${(boundingBox.y / nativeH) * 100}%`,
      width: `${(boundingBox.width / nativeW) * 100}%`,
      height: `${(boundingBox.height / nativeH) * 100}%`,
    };
  };

  const bboxStyle = getBBoxOverlayStyle();

  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex justify-end"
      onClick={onClose}
      ref={overlayRef}
    >
      <div 
        className="bg-white w-full max-w-xl h-full border-l border-slate-200 flex flex-col justify-between p-6 overflow-y-auto space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">DETAILED CAPTURE INSPECTION</h2>
            <p className="text-[10px] text-slate-400 font-mono uppercase">ID: {detectionId}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-lg font-bold font-mono">✕</button>
        </div>

        {/* Image Frame Viewport */}
        <div className="border border-slate-200 bg-slate-50 relative overflow-hidden aspect-video flex items-center justify-center">
          {hasImg ? (
            <>
              <img 
                src={imageUrl} 
                alt="Capture frame" 
                className="max-w-full max-h-full object-contain" 
              />
              {bboxStyle && (
                <div 
                  className="absolute border-2 border-red-600 pointer-events-none"
                  style={bboxStyle}
                ></div>
              )}
            </>
          ) : (
            <div className="font-mono text-xs text-slate-400">NO IMAGE STORED</div>
          )}
        </div>

        {/* Spec Table */}
        <div className="space-y-4 flex-grow">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">INFERENCE DATA & METADATA</h3>
          <div className="border border-slate-200 overflow-hidden">
            <table className="w-full text-xs font-mono text-left">
              <tbody className="divide-y divide-slate-200 text-slate-700">
                <tr className="bg-slate-50">
                  <td className="px-4 py-2 font-semibold text-slate-500 w-1/3">TIMESTAMP</td>
                  <td className="px-4 py-2 text-slate-900">{formatTime(timestamp)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-slate-500">CAMERA ID</td>
                  <td className="px-4 py-2 text-slate-900">{cameraId}</td>
                </tr>
                <tr className="bg-slate-50">
                  <td class="px-4 py-2 font-semibold text-slate-500">CAMERA LOCATION</td>
                  <td className="px-4 py-2 text-slate-900">{cameraLocation || 'Unknown'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-slate-500">DETECTION CLASS</td>
                  <td className="px-4 py-2 text-slate-900 font-semibold uppercase">{String(detectionClass || 'leopard').replace('_', ' ')}</td>
                </tr>
                <tr class="bg-slate-50">
                  <td className="px-4 py-2 font-semibold text-slate-500">CONFIDENCE SCORE</td>
                  <td className="px-4 py-2 text-slate-900">{(confidenceScore * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-slate-500">ALERT TRANSMITTED</td>
                  <td className="px-4 py-2 text-slate-900">{alertSent ? 'DISPATCHED (TELEGRAM)' : 'PENDING'}</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="px-4 py-2 font-semibold text-slate-500">COORDINATES (XYWH)</td>
                  <td className="px-4 py-2 text-slate-900">
                    {boundingBox && boundingBox.width 
                      ? `X:${boundingBox.x} Y:${boundingBox.y} W:${boundingBox.width} H:${boundingBox.height}`
                      : 'FULL FRAME'
                    }
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold text-slate-500">INFERENCE SPEED</td>
                  <td className="px-4 py-2 text-slate-900">{processingTimeMs ? `${processingTimeMs} ms` : '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Panel */}
        <div className="border-t border-slate-200 pt-4 flex gap-4">
          <button 
            onClick={() => onDelete(detectionId)}
            className="flex-grow border border-rose-600 hover:bg-rose-50 text-rose-600 font-mono py-2 text-xs font-semibold uppercase tracking-wider"
          >
            DELETE CAPTURE RECORD
          </button>
          <button 
            onClick={onClose}
            className="flex-grow bg-slate-900 hover:bg-slate-800 text-white font-mono py-2 text-xs font-semibold uppercase tracking-wider"
          >
            CLOSE INSPECTION
          </button>
        </div>

      </div>
    </div>
  );
};

export default Modal;
