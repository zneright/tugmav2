import { useState, useEffect, useMemo } from 'react';
import {
  Building2, Search, MessageSquare, ExternalLink,
  MapPin, Star, MoreVertical, Briefcase, Loader2, AlertCircle
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import CompanyProfile from './CompanyProfile'; // Assuming this exists in your project

interface Connection {
  id: number;
  employer_uid: string;
  company_name: string;
  industry: string;
  location: string;
  status: string;
  role: string;
  avatar: string;
  color: string;
  rating: string;
}

export default function ConnectedEmployers() {
  const [uid, setUid] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Connections');

  // View Mode State
  const [viewMode, setViewMode] = useState<'list' | 'company'>('list');
  const [selectedEmployerUid, setSelectedEmployerUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        fetchConnections(user.uid);
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchConnections = async (studentUid: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/applications/student/${studentUid}`);
      if (res.ok) {
        const data = await res.json();
        setConnections(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch connections", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 👇 BRIDGE TO MESSAGES 👇
  const startChatWithEmployer = (conn: Connection) => {
    const newChatData = {
      id: conn.employer_uid,
      name: conn.company_name,
      role: 'Recruitment',
      avatar: conn.avatar
    };

    localStorage.setItem('pending_new_chat_student', JSON.stringify(newChatData));
    window.location.href = '/student/messages'; // Adjust path if needed
  };

  // Dynamic Filtering
  const filteredConnections = useMemo(() => {
    return connections.filter(conn => {
      const matchesSearch = `${conn.company_name} ${conn.role}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All Connections' || conn.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [connections, searchQuery, statusFilter]);

  // Extract unique statuses for the dropdown
  const uniqueStatuses = Array.from(new Set(connections.map(c => c.status))).filter(Boolean);

  if (viewMode === 'company' && selectedEmployerUid) {
    return <CompanyProfile employerUid={selectedEmployerUid} onBack={() => { setViewMode('list'); setSelectedEmployerUid(null); }} />;
  }

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

  return (
    <div className="space-y-6 fade-in pb-10 max-w-6xl mx-auto relative">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-500/20 rounded-xl">
              <Building2 className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            Connected Employers
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
            Companies you have applied to, are interviewing with, or have been hired by.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company or role..."
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm font-medium"
          />
        </div>
        <div className="relative min-w-[200px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none text-sm dark:text-white font-medium appearance-none focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer"
          >
            <option value="All Connections">All Connections ({connections.length})</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-xs">▼</div>
        </div>
      </div>

      {/* Employers Grid */}
      {filteredConnections.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <AlertCircle className="mx-auto text-zinc-300 mb-3" size={40} />
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">No connections found</h3>
          <p className="text-sm text-zinc-500 mt-1">
            {connections.length === 0 ? "You haven't applied to any jobs yet." : "No companies match your current search filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredConnections.map((employer) => (
            <div key={employer.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-900/50 transition-all group flex flex-col relative overflow-hidden hover:-translate-y-1">

              {/* Top Color Bar indicating status */}
              <div className={`absolute top-0 left-0 w-full h-1.5 ${employer.status === 'Hired' ? 'bg-emerald-500' :
                employer.status === 'Shortlisted' ? 'bg-amber-500' :
                  employer.status === 'Rejected' ? 'bg-red-500' :
                    'bg-purple-500'
                }`}></div>

              <div className="flex items-start justify-between mb-4 mt-2">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md ${employer.color}`}>
                  {employer.avatar}
                </div>
                <button className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-1">
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="mb-5">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                  {employer.company_name}
                </h3>
                <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1"><Star size={12} className="text-amber-500 fill-amber-500" /> {employer.rating}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                  <span className="truncate">{employer.industry}</span>
                </div>
              </div>

              <div className="space-y-3 mb-8 flex-1 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                  <Briefcase size={16} className="text-purple-500 shrink-0 mt-0.5" />
                  <span className="font-bold truncate">{employer.role}</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-zinc-600 dark:text-zinc-400">
                  <MapPin size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <span className="truncate font-medium">{employer.location}</span>
                </div>
              </div>

              <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm ${employer.status === 'Hired' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50' :
                  employer.status === 'Shortlisted' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50' :
                    employer.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-200 dark:border-red-800/50' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50'
                  }`}>
                  {employer.status}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => startChatWithEmployer(employer)}
                    className="p-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl transition-colors shadow-sm border border-purple-100 dark:border-purple-800/30"
                    title="Message Employer"
                  >
                    <MessageSquare size={16} />
                  </button>
                  <button
                    onClick={() => { setSelectedEmployerUid(employer.employer_uid); setViewMode('company'); }}
                    className="p-2.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl transition-colors shadow-sm border border-zinc-200 dark:border-zinc-700"
                    title="View Company Profile"
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}