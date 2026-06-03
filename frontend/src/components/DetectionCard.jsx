import React from 'react';

const DetectionCard = ({ detection, onClick }) => {
  const { cameraId, timestamp, confidenceScore, imageUrl, cameraLocation, detectionClass } = detection;
  const hasImg = imageUrl && imageUrl !== 'null';
  
  const formattedTime = timestamp 
    ? new Date(timestamp).toISOString().replace('T', ' ').substring(2, 16) 
    : '—';

  return (
    <div 
      onClick={onClick}
      className="border border-slate-200 bg-white hover:border-slate-800 transition-colors flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      <div className="bg-slate-100 aspect-video flex items-center justify-center border-b border-slate-100 overflow-hidden relative">
        {hasImg ? (
          <img 
            src={imageUrl} 
            alt="Camera trap capture" 
            className="object-cover w-full h-full" 
            loading="lazy" 
          />
        ) : (
          <div className="font-mono text-[10px] text-slate-400">NO IMAGE STORED</div>
        )}
        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-[9px] font-mono text-white px-1.5 py-0.5 rounded-xs tracking-wider uppercase">
          {cameraId}
        </div>
      </div>
      
      <div className="p-3 space-y-1.5 font-mono text-[10px]">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900">{formattedTime}</span>
          <span className="font-bold text-slate-950">{(confidenceScore * 100).toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between text-slate-400 uppercase text-[9px]">
          <span>{cameraLocation || 'Unknown'}</span>
          <span>{(detectionClass || 'leopard').toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

export default DetectionCard;
