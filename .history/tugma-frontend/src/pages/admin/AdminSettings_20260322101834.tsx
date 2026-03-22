import { useState } from 'react';
import { Settings, Globe, ShieldAlert, Database, Save, AlertTriangle } from 'lucide-react';

export default function AdminSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationsOpen, setRegistrationsOpen] = useState(true);

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in pb-10">
      
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
          <Settings className="text-red-600" /> Global Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Configure platform-wide rules, security, and maintenance features.</p>
      </div>

      <div className="space-y-6">
        
        {/* Danger Zone Controls */}
        <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <div className="flex items-center gap-2 mb-6 text-red-600 dark:text-red-500 font-bold">
            <AlertTriangle size={20} /> System Critical Controls
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white">Maintenance Mode</h4>
                <p className="text-sm text-zinc-500 mt-0.5">Locks out all non-admin users and displays a maintenance screen.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={maintenanceMode} onChange={() => setMaintenanceMode(!maintenanceMode)} />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-red-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white">Allow New Registrations</h4>
                <p className="text-sm text-zinc-500 mt-0.5">Toggle whether new students and employers can create accounts.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={registrationsOpen} onChange={() => setRegistrationsOpen(!registrationsOpen)} />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-zinc-900 dark:text-white font-bold">
            <Globe size={20} className="text-blue-500" /> Platform Defaults
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Platform Name</label>
              <input type="text" defaultValue="Tugma" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-red-500/20 outline-none transition-all dark:text-white text-sm font-medium" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Support Email</label>
              <input type="email" defaultValue="support@tugma.com" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-red-500/20 outline-none transition-all dark:text-white text-sm font-medium" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Default Job Expiration (Days)</label>
              <input type="number" defaultValue="30" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-red-500/20 outline-none transition-all dark:text-white text-sm font-medium" />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all">
            <Save size={18} /> Save All Configurations
          </button>
        </div>

      </div>
    </div>
  );
}