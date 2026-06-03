import React, { useState } from 'react';
import { useDetections, useDeleteDetection } from '../hooks/queries';
import { getRegisteredCameras } from '../utils/config';
import DetectionCard from '../components/DetectionCard';
import Modal from '../components/Modal';

const Gallery = () => {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  
  // Filter states
  const [cameraFilter, setCameraFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minConf, setMinConf] = useState('');
  
  // Active filters passed to API query
  const [appliedFilters, setAppliedFilters] = useState({});

  const limit = 12; // 4x3 grid ideal
  const cameras = getRegisteredCameras();

  // Fetch detections
  const { data: detectionsData, isLoading, isError } = useDetections({
    page,
    limit,
    sortBy: 'timestamp',
    sortOrder: 'desc',
    ...appliedFilters
  });

  const list = detectionsData?.data || [];
  const meta = detectionsData?.meta || { total: 0, page: 1, totalPages: 1 };
  const deleteMutation = useDeleteDetection();

  const handleApplyFilters = () => {
    const params = {};
    if (cameraFilter) params.cameraId = cameraFilter;
    if (startDate) params.startDate = startDate + 'T00:00:00.000Z';
    if (endDate) params.endDate = endDate + 'T23:59:59.999Z';
    if (minConf) params.minConfidence = parseFloat(minConf) / 100;
    
    setAppliedFilters(params);
    setPage(1);
  };

  const handleResetFilters = () => {
    setCameraFilter('');
    setStartDate('');
    setEndDate('');
    setMinConf('');
    setAppliedFilters({});
    setPage(1);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm('CONFIRM DELETION: Delete this detection record from database?');
    if (ok) {
      await deleteMutation.mutateAsync(id);
      if (selectedId === id) setSelectedId(null);
    }
  };

  const selectedObj = list.find(d => d.detectionId === selectedId);

  return (
    <div className="space-y-6">
      
      {/* Filters Panel */}
      <div className="border border-slate-200 bg-white p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 font-mono">ARCHIVE ARCHIVAL FILTERS</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Camera Station</label>
            <select value={cameraFilter} onChange={(e) => setCameraFilter(e.target.value)}>
              <option value="">All Stations</option>
              {cameras.map(c => (
                <option key={c.cameraId} value={c.cameraId}>{c.cameraId} ({c.location})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">End Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Min Conf. (%)</label>
            <input 
              type="number" 
              placeholder="e.g. 80" 
              value={minConf}
              onChange={(e) => setMinConf(e.target.value)}
              min="0" 
              max="100"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 justify-end items-end h-full">
            <button 
              onClick={handleApplyFilters} 
              className="flex-grow bg-slate-900 text-white font-mono hover:bg-slate-800 py-1.5 px-3 text-xs tracking-wider uppercase font-semibold rounded-sm"
            >
              APPLY
            </button>
            <button 
              onClick={handleResetFilters} 
              className="border border-slate-300 hover:border-slate-800 text-slate-800 font-mono py-1.5 px-3 text-xs tracking-wider uppercase font-semibold bg-white rounded-sm"
            >
              RESET
            </button>
          </div>

        </div>
      </div>

      {/* Gallery Grid */}
      <div className="border border-slate-200 bg-white p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 mb-4 font-mono">CAMERA TRAP FEED GALLERY</h2>
        
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 font-mono text-xs">Querying trap archive images...</div>
        ) : isError ? (
          <div className="py-12 text-center text-rose-600 font-mono text-xs">Failed to download imagery library.</div>
        ) : list.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-mono text-xs">No trap captures matching criteria found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {list.map((d) => (
              <DetectionCard 
                key={d.detectionId} 
                detection={d} 
                onClick={() => setSelectedId(d.detectionId)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-6 text-xs font-mono text-slate-500">
          <div>Showing page {meta.page} of {meta.totalPages || 1}</div>
          <div className="flex gap-2">
            <button 
              disabled={meta.page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="border border-slate-300 hover:border-slate-800 disabled:opacity-30 disabled:hover:border-slate-300 px-3 py-1 bg-white uppercase font-bold text-slate-800"
            >
              &larr; PREV
            </button>
            <button 
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="border border-slate-300 hover:border-slate-800 disabled:opacity-30 disabled:hover:border-slate-300 px-3 py-1 bg-white uppercase font-bold text-slate-800"
            >
              NEXT &rarr;
            </button>
          </div>
        </div>

      </div>

      {/* Inspector Detail drawer */}
      {selectedId && (
        <Modal 
          isOpen={true} 
          onClose={() => setSelectedId(null)} 
          detection={selectedObj} 
          onDelete={handleDelete} 
        />
      )}

    </div>
  );
};

export default Gallery;
