import { useState } from 'react';
import { 
  Building2, Search, MessageSquare, ExternalLink, 
  MapPin, Star, MoreVertical, Briefcase 
} from 'lucide-react';

export default function ConnectedEmployers() {
  // Mock Connected Employers Data
  const [employers] = useState([
    { 
      id: 1, name: 'TechFlow Inc.', industry: 'Enterprise Software', location: 'Makati City', 
      status: 'Active OJT', role: 'Frontend React Developer Intern', 
      logo: 'T', color: 'bg-blue-600', rating: '4.8' 
    },
    { 
      id: 2, name: 'Creative Studio PH', industry: 'Digital Agency', location: 'BGC, Taguig', 
      status: 'Interviewing', role: 'UI/UX Design OJT', 
      logo: 'C', color: 'bg-purple-600', rating: '4.5' 
    },
    { 
      id: 3, name: 'BuildRight Systems', industry: 'IT Consulting', location: 'Remote', 
      status: 'Offer Received', role: 'Web Designer', 
      logo: 'B', color: 'bg-emerald-600', rating: '4.9' 
    },
  ]);

  return (
    <div className="space-y-6 fade-in pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Building2 className="text-purple-600" /> Connected Employers
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Companies you are currently interviewing with or working for.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Search companies..." className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm" />
        </div>
        <select className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none text-sm dark:text-white font-medium appearance-none min-w-[150px]">
          <option>All Connections</option>
          <option>Active OJT</option>
          <option>Interviewing</option>
          <option>Offers</option>
        </select>
      </div>

      {/* Employers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {employers.map((employer) => (
          <div key={employer.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col relative overflow-hidden">
            
            {/* Top Color Bar indicating status */}
            <div className={`absolute top-0 left-0 w-full h-1 ${employer.status === 'Active OJT' ? 'bg-emerald-500' : employer.status === 'Interviewing' ? 'bg-amber-500' : 'bg-purple-500'}`}></div>

            <div className="flex items-start justify-between mb-4 mt-1">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-sm ${employer.color}`}>
                {employer.logo}
              </div>
              <button className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {employer.name}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1"><Star size={12} className="text-amber-500 fill-amber-500" /> {employer.rating}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                <span>{employer.industry}</span>
              </div>
            </div>

            <div className="space-y-2 mb-6 flex-1">
              <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Briefcase size={16} className="text-purple-500 shrink-0 mt-0.5" />
                <span className="font-medium">{employer.role}</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <MapPin size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <span>{employer.location}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                employer.status === 'Active OJT' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 
                employer.status === 'Interviewing' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 
                'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400'
              }`}>
                {employer.status}
              </span>
              <div className="flex gap-2">
                <button className="p-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg transition-colors" title="Message Employer">
                  <MessageSquare size={16} />
                </button>
                <button className="p-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg transition-colors" title="View Company Profile">
                  <ExternalLink size={16} />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}