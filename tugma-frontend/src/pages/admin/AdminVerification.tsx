import { useState } from 'react';
import { 
  ShieldCheck, Check, X, Building2, 
  FileText, ExternalLink, AlertCircle 
} from 'lucide-react';

export default function AdminVerification() {
  // Mock Verification Requests
  const [requests] = useState([
    { id: 'REQ-089', company: 'NextGen Solutions', email: 'hr@nextgen.co', type: 'Employer Registration', submitted: '2 hours ago', docs: 2 },
    { id: 'REQ-090', company: 'Global Logistics Corp', email: 'recruitment@globallogistics.com', type: 'Employer Registration', submitted: '5 hours ago', docs: 3 },
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
          <ShieldCheck className="text-red-600" /> Verifications
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Review and approve employer accounts and submitted business documents.
        </p>
      </div>

      {/* Alert Banner */}
      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 text-amber-800 dark:text-amber-400">
        <AlertCircle size={20} className="shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold">2 Pending Approvals</p>
          <p className="mt-0.5 opacity-90">Employers cannot post jobs until their business registration is verified.</p>
        </div>
      </div>

      {/* Requests Feed */}
      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
            
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              
              {/* Info Section */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
                  <Building2 size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{req.company}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 uppercase tracking-wider border border-blue-100 dark:border-blue-500/20">
                      {req.type}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{req.email}</p>
                  <p className="text-xs font-medium text-zinc-400 mt-2 flex items-center gap-1">
                    Submitted {req.submitted} • ID: {req.id}
                  </p>
                </div>
              </div>

              {/* Documents Section */}
              <div className="flex-1 lg:max-w-sm w-full bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-700/50">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Submitted Documents ({req.docs})</p>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-red-300 dark:hover:border-red-500/50 transition-colors group">
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      <FileText size={16} className="text-blue-500" /> Business_Permit_2024.pdf
                    </div>
                    <ExternalLink size={14} className="text-zinc-400 group-hover:text-red-500 transition-colors" />
                  </button>
                  <button className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-red-300 dark:hover:border-red-500/50 transition-colors group">
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      <FileText size={16} className="text-purple-500" /> Company_ID_Signatory.jpg
                    </div>
                    <ExternalLink size={14} className="text-zinc-400 group-hover:text-red-500 transition-colors" />
                  </button>
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button 
                onClick={() => alert(`Request ${req.id} Rejected`)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <X size={16} /> Reject Account
              </button>
              <button 
                onClick={() => alert(`Request ${req.id} Approved! Employer can now post jobs.`)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Check size={16} /> Approve Employer
              </button>
            </div>

          </div>
        ))}

        {requests.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} className="text-zinc-300" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">All caught up!</h3>
            <p className="text-zinc-500">No pending verification requests.</p>
          </div>
        )}
      </div>

    </div>
  );
}