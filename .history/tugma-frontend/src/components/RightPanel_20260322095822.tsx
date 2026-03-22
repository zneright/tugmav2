import { UserPlus, ArrowRight } from 'lucide-react';

export default function RightPanel() {
  return (
    <aside className="space-y-6 animate-in fade-in duration-500">
      
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="h-16 bg-gradient-to-r from-purple-600 to-purple-400"></div>
        
        <div className="px-5 pb-5">
          <div className="relative flex justify-center -mt-8 mb-3">
            <div className="w-16 h-16 rounded-full border-4 border-white dark:border-zinc-900 bg-purple-100 dark:bg-zinc-800 flex items-center justify-center text-2xl font-bold text-purple-700 dark:text-purple-400 shadow-sm">
              N
            </div>
          </div>
          
          <div className="text-center mb-4">
            <h3 className="font-bold text-zinc-900 dark:text-white text-lg leading-tight hover:text-purple-600 cursor-pointer transition-colors">
              Nishia Pinlac
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              IT Student at STI College Caloocan
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Malabon, Metro Manila
            </p>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800/50 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Profile Strength</span>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">75%</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mb-3">
              <div className="bg-purple-600 h-1.5 rounded-full transition-all duration-1000" style={{ width: '75%' }}></div>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center leading-tight">
              Add your 450-hour OJT requirement details to reach 100%
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
        <h3 className="font-semibold text-zinc-900 dark:text-white mb-4 text-sm">Recommended Employers</h3>
        
        <div className="space-y-4">
          {[
            { name: 'TechNova Solutions', role: 'Looking for Web Designers', initial: 'T' },
            { name: 'Creative Studio PH', role: 'Looking for Front-End Interns', initial: 'C' },
            { name: 'BuildRight Systems', role: 'Looking for UI/UX OJT', initial: 'B' }
          ].map((company, i) => (
            <div key={i} className="flex items-center gap-3 group cursor-pointer">
              
              <div className="w-10 h-10 rounded-md bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-300 group-hover:border-purple-500 dark:group-hover:border-purple-500 transition-colors shrink-0">
                {company.initial}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-zinc-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {company.name}
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{company.role}</p>
              </div>
              
              <button className="text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 p-1.5 rounded-full transition-colors" title="Follow Company">
                <UserPlus size={16} />
              </button>
            </div>
          ))}
        </div>

        <button className="w-full mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/50 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center justify-center gap-1 transition-colors">
          View all recommendations <ArrowRight size={14} />
        </button>
      </div>

      {/* Footer Links */}
      <div className="px-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-500 justify-center">
        <a href="#" className="hover:text-purple-600 hover:underline">About TUGMA</a>
        <a href="#" className="hover:text-purple-600 hover:underline">Accessibility</a>
        <a href="#" className="hover:text-purple-600 hover:underline">Help Center</a>
        <a href="#" className="hover:text-purple-600 hover:underline">Privacy & Terms</a>
        <span className="w-full text-center mt-2">TUGMA Corporation © 2026</span>
      </div>

    </aside>
  );
}