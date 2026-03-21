import { useState, useEffect, useMemo } from 'react';
import {
  Building2, Search, MessageSquare, ExternalLink,
  MapPin, Star, MoreVertical, Briefcase, Loader2, AlertCircle, ChevronRight
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import CompanyProfile from './CompanyProfile';

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

// 🔥 NEW: Grouped Interface
interface GroupedConnection {
  employer_uid: string;
  company_name: string;
  industry: string;
  location: string;
  avatar: string;
  color: string;
  rating: string;
  applications: {
    id: number;
    role: string;
    status: string;
  }[];
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
      const data = await res.json();

      if (!res.ok) throw new Error(data.messages?.error || "Server Error");

      setConnections(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to fetch connections", error);
      alert(`Failed to load applications: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  const handleOfferAction = async (applicationId: number, companyName: string, action: 'Hired' | 'Rejected') => {
    const confirmMsg = action === 'Hired'
      ? `Accept the offer from ${companyName}? This will officially start your OJT.`
      : `Are you sure you want to decline this offer?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`http://localhost:8080/api/applications/update-status/${applicationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      });

      if (res.ok) {
        // Refresh local data
        setConnections(prev => prev.map(conn => conn.id === applicationId ? { ...conn, status: action } : conn));
        alert(action === 'Hired' ? "Congratulations! You are now hired." : "Offer declined.");
      }
    } catch (error) {
      console.error("Action failed", error);
    }
  };
  const startChatWithEmployer = (emp: GroupedConnection) => {
    const newChatData = {
      id: emp.employer_uid,
      name: emp.company_name,
      role: 'Recruitment',
      avatar: emp.avatar,
      color: emp.color
    };
    localStorage.setItem('pending_new_chat_student', JSON.stringify(newChatData));
    window.location.href = '/student/messages';
  };

  // 👇 🔥 THE MAGIC: Filter and GROUP by Company Name 🔥 👇
  const groupedConnections = useMemo(() => {
    // 1. Filter first
    const filtered = connections.filter(conn => {
      const matchesSearch = `${conn.company_name} ${conn.role}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All Connections' || conn.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // 2. Group the filtered results
    const grouped = filtered.reduce((acc, curr) => {
      const existing = acc.find(item => item.company_name === curr.company_name);

      if (existing) {
        // If company exists, just push the new role/application to its list
        existing.applications.push({
          id: curr.id,
          role: curr.role,
          status: curr.status
        });

        // If the new status is "Hired" or "Shortlisted", bump up the visual priority of the whole card
        if (curr.status === 'Hired') existing.applications.unshift(existing.applications.pop()!);
      } else {
        // First time seeing this company, create a new group block
        acc.push({
          employer_uid: curr.employer_uid,
          company_name: curr.company_name,
          industry: curr.industry,
          location: curr.location,
          avatar: curr.avatar,
          color: curr.color,
          rating: curr.rating,
          applications: [{
            id: curr.id,
            role: curr.role,
            status: curr.status
          }]
        });
      }
      return acc;
    }, [] as GroupedConnection[]);

    return grouped;
  }, [connections, searchQuery, statusFilter]);

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
            <option value="All Connections">All Statuses</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-xs">▼</div>
        </div>
      </div>

      {/* Employers Grid */}
      {groupedConnections.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <AlertCircle className="mx-auto text-zinc-300 mb-3" size={40} />
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">No connections found</h3>
          <p className="text-sm text-zinc-500 mt-1">
            {connections.length === 0 ? "You haven't applied to any jobs yet." : "No companies match your current search filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {groupedConnections.map((employer) => {

            // Check if any of the roles inside this company have a "Hired" status to style the card header
            const isHired = employer.applications.some(app => app.status === 'Hired');

            return (
              <div key={employer.employer_uid} className={`bg-white dark:bg-zinc-900 border ${isHired ? 'border-emerald-200 dark:border-emerald-800/50 shadow-emerald-500/5' : 'border-zinc-200 dark:border-zinc-800'} rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all group flex flex-col relative overflow-hidden`}>

                {/* Highlight Bar at top if Hired */}
                {isHired && <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>}

                {/* Company Header Info */}
                <div className="flex items-start justify-between mb-4 mt-2">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md ${employer.color}`}>
                    {employer.avatar}
                  </div>
                  <button className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-1">
                    <MoreVertical size={20} />
                  </button>
                </div>

                <div className="mb-5">
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                    {employer.company_name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1"><Star size={12} className="text-amber-500 fill-amber-500" /> {employer.rating}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                    <span className="flex items-center gap-1 truncate"><MapPin size={12} className="text-blue-500" /> {employer.location}</span>
                  </div>
                </div>

                {/* Roles/Applications List */}
                <div className="space-y-2 mb-8 flex-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 ml-1">Your Applications</p>

                  {employer.applications.map((app) => (
                    <div key={app.id} className={`p-4 rounded-2xl border transition-all ${app.status === 'Offered'
                      ? 'border-purple-300 bg-purple-50/50 dark:bg-purple-900/10 animate-pulse'
                      : app.status === 'Hired'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-800/30'
                        : 'bg-zinc-50 dark:bg-zinc-800/30 border-zinc-100 dark:border-zinc-800'
                      }`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Briefcase size={14} className={app.status === 'Hired' ? 'text-emerald-600' : 'text-purple-500'} />
                          <span className="text-sm font-bold truncate text-zinc-900 dark:text-zinc-100">{app.role}</span>
                        </div>

                        {/* STATUS BADGE */}
                        <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${app.status === 'Offered' ? 'bg-purple-600 text-white' :
                          app.status === 'Hired' ? 'bg-emerald-200 text-emerald-800' :
                            app.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                          {app.status === 'Offered' ? 'Offer Received' : app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                

                {/* Footer Actions */}
                <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <button
                    onClick={() => { setSelectedEmployerUid(employer.employer_uid); setViewMode('company'); }}
                    className="text-xs font-bold text-zinc-500 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1 transition-colors"
                  >
                    View Profile <ChevronRight size={14} />
                  </button>

                  <button
                    onClick={() => startChatWithEmployer(employer)}
                    className="px-4 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-2"
                  >
                    <MessageSquare size={14} /> Message
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}