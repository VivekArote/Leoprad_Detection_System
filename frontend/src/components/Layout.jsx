import React from 'react';
import { NavLink } from 'react-router-dom';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col antialiased bg-white text-slate-900">
      {/* Header and text-based navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-sm font-semibold tracking-wider text-slate-900 uppercase font-mono">LEOPARD DETECTION SYSTEM</h1>
            <p className="text-xs text-slate-500 font-mono">WILDLIFE DEPLOYMENT MONITOR v2.0</p>
          </div>
          
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <NavLink 
              to="/" 
              end
              className={({ isActive }) => 
                `border-b-2 pb-1 transition-colors ${isActive ? 'text-slate-900 border-slate-900' : 'border-transparent hover:text-slate-900'}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="/detections" 
              className={({ isActive }) => 
                `border-b-2 pb-1 transition-colors ${isActive ? 'text-slate-900 border-slate-900' : 'border-transparent hover:text-slate-900'}`
              }
            >
              Detections
            </NavLink>
            <NavLink 
              to="/gallery" 
              className={({ isActive }) => 
                `border-b-2 pb-1 transition-colors ${isActive ? 'text-slate-900 border-slate-900' : 'border-transparent hover:text-slate-900'}`
              }
            >
              Gallery
            </NavLink>
            <NavLink 
              to="/analytics" 
              className={({ isActive }) => 
                `border-b-2 pb-1 transition-colors ${isActive ? 'text-slate-900 border-slate-900' : 'border-transparent hover:text-slate-900'}`
              }
            >
              Analytics
            </NavLink>
            <NavLink 
              to="/health" 
              className={({ isActive }) => 
                `border-b-2 pb-1 transition-colors ${isActive ? 'text-slate-900 border-slate-900' : 'border-transparent hover:text-slate-900'}`
              }
            >
              Health Monitoring
            </NavLink>
            <NavLink 
              to="/settings" 
              className={({ isActive }) => 
                `border-b-2 pb-1 transition-colors ${isActive ? 'text-slate-900 border-slate-900' : 'border-transparent hover:text-slate-900'}`
              }
            >
              Settings
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Main Workspace content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row sm:justify-between items-center gap-2">
          <div>LEOPARDWATCH MONITORING NETWORK</div>
          <div>SYSTEM SYNC STATUS: SECURE CONNECTION</div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
