import React, { useState } from 'react';
import { 
  getSystemSettings, 
  saveSystemSettings, 
  getRegisteredCameras, 
  saveRegisteredCameras 
} from '../utils/config';

const Settings = () => {
  // Load initial configurations from local storage
  const [settings, setSettings] = useState(getSystemSettings());
  const [cameras, setCameras] = useState(getRegisteredCameras());
  
  // Registration form state
  const [newCamId, setNewCamId] = useState('');
  const [newCamLoc, setNewCamLoc] = useState('');

  const handleSaveSettings = () => {
    saveSystemSettings(settings);
    alert('System configurations updated successfully.');
  };

  const handleAddCamera = () => {
    const id = newCamId.trim().toLowerCase();
    const loc = newCamLoc.trim();
    
    if (!id || !loc) {
      alert('Please fill out both Camera Station ID and Location.');
      return;
    }

    if (cameras.some(c => c.cameraId === id)) {
      alert('A station with this ID is already registered.');
      return;
    }

    const updated = [...cameras, { cameraId: id, location: loc }];
    setCameras(updated);
    saveRegisteredCameras(updated);
    
    setNewCamId('');
    setNewCamLoc('');
  };

  const handleRemoveCamera = (cameraId) => {
    const confirm = window.confirm(`Remove camera station [${cameraId}] from active registry?`);
    if (confirm) {
      const updated = cameras.filter(c => c.cameraId !== cameraId);
      setCameras(updated);
      saveRegisteredCameras(updated);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Configurations grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Parameter configurations */}
        <div className="border border-slate-200 bg-white p-4 space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 font-mono">SYSTEM CONFIGURATION</h2>
          
          <div className="space-y-4">
            
            {/* Confidence Slider */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">ALERT MINIMUM CONFIDENCE THRESHOLD</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="50" 
                  max="100" 
                  value={settings.confidence}
                  onChange={(e) => setSettings(prev => ({ ...prev, confidence: e.target.value }))}
                  className="flex-grow accent-slate-900" 
                />
                <span className="text-sm font-mono font-semibold w-12 text-right">{settings.confidence}%</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono uppercase">Inferences falling below this confidence will not trigger high-priority alerts.</p>
            </div>

            {/* Cooldown time */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700">ALERT TRANSMISSION COOLDOWN (SECONDS)</label>
              <input 
                type="number" 
                min="5" 
                max="300"
                value={settings.cooldown}
                onChange={(e) => setSettings(prev => ({ ...prev, cooldown: e.target.value }))}
              />
              <p className="text-[10px] text-slate-400 font-mono uppercase">Prevent alert spamming during multiple consecutive captures within this timeframe.</p>
            </div>

            {/* Serial port address */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700">ARDUINO SERIAL INTERFACE PORT</label>
              <select 
                value={settings.port}
                onChange={(e) => setSettings(prev => ({ ...prev, port: e.target.value }))}
              >
                <option value="COM1">COM1</option>
                <option value="COM2">COM2</option>
                <option value="COM3">COM3</option>
                <option value="COM4">COM4</option>
                <option value="/dev/ttyUSB0">/dev/ttyUSB0</option>
                <option value="DISABLED">Hardware Interface Off</option>
              </select>
              <p className="text-[10px] text-slate-400 font-mono uppercase">System port routing for trigger signals directed to the camera alarm relay hardware.</p>
            </div>

            {/* Telegram channel ids */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">TELEGRAM ALERTS ROUTING CHAT ID(S)</label>
              <input 
                type="text" 
                className="w-full"
                value={settings.telegram}
                onChange={(e) => setSettings(prev => ({ ...prev, telegram: e.target.value }))}
                placeholder="e.g. -100123456789" 
              />
              <p className="text-[10px] text-slate-400 font-mono uppercase">Comma-separated ID lists targeting forest ranger / wildlife official channels.</p>
            </div>

            <button 
              onClick={handleSaveSettings}
              className="bg-slate-900 text-white font-mono hover:bg-slate-800 py-2 px-4 text-xs tracking-wider uppercase font-semibold rounded-sm"
            >
              APPLY PARAMETER SETTINGS
            </button>

          </div>
        </div>

        {/* Right: Camera deployment registries */}
        <div className="border border-slate-200 bg-white p-4 space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 font-mono">DEPLOYED STATION REGISTRY</h2>

          {/* Add camera station */}
          <div className="border border-slate-200 p-3 bg-slate-50 space-y-3">
            <div className="text-xs font-mono font-bold text-slate-600">REGISTER NEW MONITOR STATION</div>
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="text" 
                placeholder="camera-05" 
                value={newCamId}
                onChange={(e) => setNewCamId(e.target.value)}
                className="text-xs" 
              />
              <input 
                type="text" 
                placeholder="Hilltop Lookout" 
                value={newCamLoc}
                onChange={(e) => setNewCamLoc(e.target.value)}
                className="text-xs" 
              />
            </div>
            <button 
              onClick={handleAddCamera}
              className="border border-slate-900 hover:bg-slate-900 hover:text-white text-slate-900 font-mono py-1 px-3 text-[10px] font-semibold uppercase tracking-wider rounded-sm bg-white"
            >
              ADD CAMERA STATION
            </button>
          </div>

          {/* Camera station list table */}
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-xs font-mono text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase">
                  <th className="px-3 py-2">STATION ID</th>
                  <th className="px-3 py-2">DEPLOYED LOCATION</th>
                  <th className="px-3 py-2 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cameras.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-3 py-4 text-center text-slate-400">No cameras registered.</td>
                  </tr>
                ) : (
                  cameras.map((c) => (
                    <tr key={c.cameraId} className="hover:bg-slate-50 text-slate-700">
                      <td className="px-3 py-2 font-semibold text-slate-900">{c.cameraId}</td>
                      <td className="px-3 py-2 text-slate-600">{c.location}</td>
                      <td className="px-3 py-2 text-center">
                        <button 
                          onClick={() => handleRemoveCamera(c.cameraId)}
                          className="text-rose-600 hover:underline uppercase tracking-wider text-[10px] font-bold"
                        >
                          REMOVE
                        </button>
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
  );
};

export default Settings;
