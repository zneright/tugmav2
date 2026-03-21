import { useState } from 'react';
import { 
  FileWarning, Download, Calendar, TrendingUp, 
  Users, Briefcase, ChevronDown, Filter 
} from 'lucide-react';

export default function AdminReports() {
  const [reports] = useState([
    { id: 'REP-102', name: 'Monthly User Growth', date: 'March 1, 2024', size: '2.4 MB', type: 'CSV' },
    { id: 'REP-101', name: 'Employer Job Postings Q1', date: 'Feb 28, 2024', size: '5.1 MB', type: 'PDF' },
    { id: 'REP-100', name: 'Platform Revenue & Billing', date: 'Feb 15, 2024', size: '1.2 MB', type: 'CSV' },
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <FileWarning className="text-red-600" /> Platform Reports
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Generate and download system analytics and audit logs.</p>
        </div>
        <button className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-2">
          <Calendar size={18} /> Generate Custom Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Insights (Left Column) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400"><Users size={20} /></div>
              <h3 className="font-bold text-zinc-900 dark:text-white">User Retention</h3>
            </div>
            <p className="text-3xl font-black text-zinc-900 dark:text-white mb-1">84.2%</p>
            <p className="text-sm font-bold text-emerald-600 flex items-center gap-1"><TrendingUp size={14} /> +2.4% this month</p>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400"><Briefcase size={20} /></div>
              <h3 className="font-bold text-zinc-900 dark:text-white">Job Fill Rate</h3>
            </div>
            <p className="text-3xl font-black text-zinc-900 dark:text-white mb-1">62.8%</p>
            <p className="text-sm font-bold text-emerald-600 flex items-center gap-1"><TrendingUp size={14} /> +5.1% this month</p>
          </div>

          {/* Report Generator Form */}
          <div className="sm:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Quick Export</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <select className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none text-sm dark:text-white appearance-none font-medium">
                <option>All Users Data</option>
                <option>Active Jobs Data</option>
                <option>System Error Logs</option>
              </select>
              <select className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none text-sm dark:text-white appearance-none font-medium">
                <option>Last 30 Days</option>
                <option>Last Quarter</option>
                <option>Year to Date</option>
              </select>
              <button className="flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90">
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Recent Reports List (Right Column) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Generated Reports</h3>
            <button className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"><Filter size={18} /></button>
          </div>
          
          <div className="space-y-3 flex-1">
            {reports.map((report) => (
              <div key={report.id} className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-red-200 dark:hover:border-red-500/30 transition-colors group">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{report.name}</h4>
                    <p className="text-xs text-zinc-500 mt-1">{report.date} • {report.size}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md uppercase">{report.type}</span>
                </div>
                <button className="w-full mt-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  <Download size={14} /> Download File
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}