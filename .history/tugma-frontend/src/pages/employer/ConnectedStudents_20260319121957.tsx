import { useState } from 'react';
import { 
  Users, Search, MessageSquare, FileText, 
  MoreVertical, GraduationCap, Clock, CheckCircle2 
} from 'lucide-react';

export default function ConnectedStudents() {
  // Mock Connected Students Data
  const [students] = useState([
    { 
      id: 1, name: 'Nishia Pinlac', role: 'Frontend React Developer Intern', 
      school: 'STI College Caloocan', status: 'Active Intern', 
      hoursLogged: 120, totalHours: 450, avatar: 'N', color: 'bg-purple-600' 
    },
    { 
      id: 2, name: 'James Carter', role: 'UI/UX Design OJT', 
      school: 'State University', status: 'Offer Extended', 
      hoursLogged: 0, totalHours: 300, avatar: 'J', color: 'bg-blue-600' 
    },
    { 
      id: 3, name: 'Maria Santos', role: 'Marketing Intern', 
      school: 'National College', status: 'Completed', 
      hoursLogged: 450, totalHours: 450, avatar: 'M', color: 'bg-emerald-600' 
    },
  ]);

  return (
    <div className="space-y-6 fade-in pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Users className="text-purple-600" /> Managed Interns
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track active OJTs, review pending offers, and monitor internship hours.
          </p>
        </div>
        <button className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shrink-0">
          Export Timesheets
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Search interns by name or role..." className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm" />
        </div>
        <select className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none text-sm dark:text-white font-medium appearance-none min-w-[160px]">
          <option>All Statuses</option>
          <option>Active Interns</option>
          <option>Offers Extended</option>
          <option>Completed</option>
        </select>
      </div>

      {/* Students List */}
      <div className="space-y-4">
        {students.map((student) => (
          <div key={student.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors group flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Student Info */}
            <div className="flex items-center gap-4 flex-1">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-sm shrink-0 ${student.color}`}>
                {student.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {student.name}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    student.status === 'Active Intern' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                    student.status === 'Completed' ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' :
                    'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                  }`}>
                    {student.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{student.role}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5">
                  <GraduationCap size={14} /> {student.school}
                </p>
              </div>
            </div>

            {/* OJT Hours Tracker (Only highly visible if active or completed) */}
            <div className="w-full lg:max-w-xs bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-zinc-100 dark:border-zinc-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                  <Clock size={12} /> Hours Logged
                </span>
                <span className="text-sm font-black text-zinc-900 dark:text-white">
                  {student.hoursLogged} <span className="text-xs font-medium text-zinc-500">/ {student.totalHours}</span>
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${student.status === 'Completed' ? 'bg-emerald-500' : 'bg-purple-600'}`} 
                  style={{ width: `${(student.hoursLogged / student.totalHours) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 lg:pt-0 border-t border-zinc-100 dark:border-zinc-800 lg:border-none shrink-0">
              <button className="p-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl transition-colors font-medium text-sm flex items-center gap-2">
                <MessageSquare size={16} /> <span className="hidden sm:block">Message</span>
              </button>
              <button className="p-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors" title="View Resume">
                <FileText size={18} />
              </button>
              <button className="p-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}