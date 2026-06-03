import React, { useState } from 'react';
import { useDetections, useDeleteDetection } from '../hooks/queries';
import { getRegisteredCameras } from '../utils/config';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

const Detections = () => {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedId, setSelectedId] = useState(null);
  
  // Filter states
  const [cameraFilter, setCameraFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minConf, setMinConf] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active filters passed to API query
  const [appliedFilters, setAppliedFilters] = useState({});

  const limit = 15;
  const cameras = getRegisteredCameras();

  // Fetch detections
  const { data: detectionsData, isLoading, isError } = useDetections({
    page,
    limit,
    sortBy,
    sortOrder,
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
    
    // Client-side text search simulation or matching if needed
    setAppliedFilters(params);
    setPage(1);
  };

  const handleResetFilters = () => {
    setCameraFilter('');
    setStartDate('');
    setEndDate('');
    setMinConf('');
    setSearchQuery('');
    setAppliedFilters({});
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm('CONFIRM DELETION: Delete this detection record from database?');
    if (ok) {
      await deleteMutation.mutateAsync(id);
      if (selectedId === id) setSelectedId(null);
    }
  };

  // Filter list on client-side search query (e.g. searching camera location or class)
  const filteredList = list.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const loc = (item.cameraLocation || '').toLowerCase();
    const cls = (item.detectionClass || '').toLowerCase();
    const cam = (item.cameraId || '').toLowerCase();
    return loc.includes(query) || cls.includes(query) || cam.includes(query);
  });

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'desc' ? ' ↓' : ' ↑';
  };

  const selectedObj = list.find(d => d.detectionId === selectedId);

  return (
    <div className="space-y-6">
      
      {/* Search & Filters Panel */}
      <div className="border border-slate-200 bg-white p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 font-mono">QUERY FILTERS</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          
          {/* Text search */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Search Text</label>
            <input 
              type="text" 
              placeholder="e.g. North, leopard" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

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

      {/* Main Table Card */}
      <div className="border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">DETECTION LOG ARCHIVE</h2>
          <div className="text-[10px] font-mono text-slate-400">Total Records: {meta.total}</div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 font-mono text-xs">Querying database records...</div>
        ) : isError ? (
          <div className="py-12 text-center text-rose-600 font-mono text-xs">Failed to download telemetry logs.</div>
        ) : filteredList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-mono text-xs">No records matching search query parameters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase">
                  <th className="px-4 py-2.5">Thumbnail</th>
                  <th 
                    className="px-4 py-2.5 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('timestamp')}
                  >
                    TIMESTAMP{getSortIcon('timestamp')}
                  </th>
                  <th 
                    className="px-4 py-2.5 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('cameraId')}
                  >
                    CAMERA ID{getSortIcon('cameraId')}
                  </th>
                  <th className="px-4 py-2.5">LOCATION</th>
                  <th className="px-4 py-2.5">CLASS</th>
                  <th 
                    className="px-4 py-2.5 cursor-pointer hover:bg-slate-100 text-right"
                    onClick={() => handleSort('confidenceScore')}
                  >
                    CONFIDENCE{getSortIcon('confidenceScore')}
                  </th>
                  <th className="px-4 py-2.5 text-center">ALERT SENT</th>
                  <th className="px-4 py-2.5 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredList.map((d) => {
                  const hasImg = d.imageUrl && d.imageUrl !== 'null';
                  
                  return (
                    <tr key={d.detectionId} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="px-4 py-2">
                        <div className="h-8 w-12 bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center">
                          {hasImg ? (
                            <img src={d.imageUrl} alt="" className="object-cover w-full h-full" />
                          ) : (
                            <span className="text-[8px] text-slate-400 font-mono">NO IMG</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(d.timestamp).toLocaleDateString()} {new Date(d.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{d.cameraId}</td>
                      <td className="px-4 py-3 text-slate-500">{d.cameraLocation || 'Unknown'}</td>
                      <td className="px-4 py-3 font-bold uppercase text-slate-700">
                        {String(d.detectionClass || 'leopard').replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {(d.confidenceScore * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={d.alertSent ? 'sent' : 'pend'} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button 
                            onClick={() => setSelectedId(d.detectionId)}
                            className="border border-slate-300 hover:border-slate-800 text-slate-800 px-2.5 py-1 text-[10px] uppercase font-bold bg-white"
                          >
                            VIEW
                          </button>
                          <button 
                            onClick={() => handleDelete(d.detectionId)}
                            className="border border-rose-200 hover:border-rose-600 text-rose-600 hover:bg-rose-50 px-2 py-1 text-[10px] uppercase font-bold bg-white"
                          >
                            DEL
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-4 text-xs font-mono text-slate-500">
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

      {/* Inspect drawer panel */}
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

export default Detections;
