import { useState, useEffect } from 'react';
import {
  Users, Search, MessageSquare, FileText,
  MoreVertical, GraduationCap, Clock, Loader2, Printer
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import PrintDTRModal from '../../components/PrintDtrModal';

interface Student {
  id: number;
  uid: string;
  name: string;
  role: string;
  school: string;
  status: string;
  hoursLogged: number;
  totalHours: number;
  avatar: string;
  color: string;
  resumeUrl: string | null;
  logs: any[];
  profile: any;
}

export default function ConnectedStudents() {
  const [uid, setUid] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Interns');

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedStudentForPrint, setSelectedStudentForPrint] = useState<Student | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        fetchEmployerStudents(user.uid);
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchEmployerStudents = async (employerUid: string) => {
    try {
      // Fetch 
      const response = await fetch(`http://localhost:8080/api/applications/employer/${employerUid}`);
      if (!response.ok) throw new Error("Failed to fetch applicants");

      const allApplications = await response.json();

      // Filter for hired students only
      const hiredApplications = allApplications.filter((app: any) => app.status === 'Hired');

      // Fetch DTR hours and profiles for hired students
      const processedStudents = await Promise.all(hiredApplications.map(async (app: any) => {
        let hoursLogged = 0;
        let totalHours = 450;
        let fetchedLogs: any[] = [];
        let fetchedProfile: any = null;

        try {
          const [logsRes, profRes] = await Promise.all([
            fetch(`http://localhost:8080/api/dtr/logs/${app.student_uid}`),
            fetch(`http://localhost:8080/api/users/profile/${app.student_uid}`)
          ]);

          if (logsRes.ok) {
            const logsData = await logsRes.json();
            fetchedLogs = Array.isArray(logsData) ? logsData : [];
            hoursLogged = fetchedLogs.reduce((sum, log) => sum + (Number(log.hoursCredited) || 0), 0);
          }

          if (profRes.ok) {
            fetchedProfile = await profRes.json();
            if (fetchedProfile.ojt) {
              const ojt = typeof fetchedProfile.ojt === 'string' ? JSON.parse(fetchedProfile.ojt) : fetchedProfile.ojt;
              totalHours = ojt.requiredHours || 450;
            }
          }
        } catch (err) {
          console.error("Error fetching student details:", err);
        }

        // Check if required hours are met
        const isCompleted = hoursLogged >= totalHours && totalHours > 0;
        const displayStatus = isCompleted ? 'Completed' : 'Active Intern';

        return {
          id: app.application_id,
          uid: app.student_uid,
          name: `${app.first_name || 'Unknown'} ${app.last_name || ''}`.trim(),
          role: app.job_title || 'Open Position',
          school: app.course || 'Unspecified Course',
          status: displayStatus,
          hoursLogged,
          totalHours,
          avatar: (app.first_name || 'U').charAt(0).toUpperCase(),
          color: isCompleted ? 'bg-blue-600' : 'bg-emerald-600',
          resumeUrl: app.resume_data || null,
          logs: fetchedLogs,
          profile: fetchedProfile
        };
      }));

      setStudents(processedStudents);
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Record system events
  const logSystemEvent = (action: string, details: string) => {
    if (!uid) return;
    fetch('http://localhost:8080/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, action, details })
    }).catch(err => console.error("Audit log failed (silent):", err));
  };

  const handleViewResume = (student: Student) => {
    if (!student.resumeUrl) {
      alert("This student has not uploaded a readable resume.");
      return;
    }
    // Log action
    logSystemEvent('Viewed Intern Resume', `Opened resume document for intern: ${student.name}`);
    window.open(student.resumeUrl, '_blank');
  };

  const handlePrintClick = (student: Student) => {
    setSelectedStudentForPrint(student);
    setIsPrintModalOpen(true);

    // Log action
    logSystemEvent('Generated DTR Review', `Opened DTR print preview for intern)`);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'All Interns' || student.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;
  }

  return (
    <div className="space-y-6 fade-in pb-10 relative">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Users className="text-purple-600" /> Managed Interns
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track active OJTs and monitor official internship hours.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search interns by name or role..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none text-sm dark:text-white font-medium appearance-none min-w-[160px] cursor-pointer"
        >
          <option>All Interns</option>
          <option>Active Intern</option>
          <option>Completed</option>
        </select>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm">
          <Users size={40} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No active interns found</h3>
          <p className="text-sm text-zinc-500 mt-1">Hire students from your Application Pipeline to see them here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors group flex flex-col lg:flex-row lg:items-center justify-between gap-6">

              <div className="flex items-center gap-4 flex-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-sm shrink-0 ${student.color}`}>
                  {student.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {student.name}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${student.status === 'Completed' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                      'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
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

              <div className="w-full lg:max-w-xs bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-zinc-100 dark:border-zinc-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Clock size={12} /> Hours Logged
                  </span>
                  <span className="text-sm font-black text-zinc-900 dark:text-white">
                    {student.hoursLogged} <span className="text-xs font-medium text-zinc-500">/ {student.totalHours}</span>
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${student.status === 'Completed' ? 'bg-blue-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (student.hoursLogged / (student.totalHours || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 lg:pt-0 border-t border-zinc-100 dark:border-zinc-800 lg:border-none shrink-0">
                <button
                  onClick={() => window.location.href = `/messages/${student.uid}`}
                  className="p-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl transition-colors font-medium text-sm flex items-center gap-2"
                  title="Message Intern"
                >
                  <MessageSquare size={16} /> <span className="hidden sm:block">Message</span>
                </button>

                <button
                  onClick={() => handlePrintClick(student)}
                  className="p-2.5 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-colors"
                  title="Print DTR Logs"
                >
                  <Printer size={18} />
                </button>

                <button
                  onClick={() => handleViewResume(student)}
                  className="p-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  title="View Resume"
                >
                  <FileText size={18} />
                </button>
                <button className="p-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {selectedStudentForPrint && (
        <PrintDTRModal
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false);
            setTimeout(() => setSelectedStudentForPrint(null), 300); // Clear after animation finishes
          }}
          logs={selectedStudentForPrint.logs}
          studentProfile={selectedStudentForPrint.profile}
          requiredHours={selectedStudentForPrint.totalHours}
          completedHours={selectedStudentForPrint.hoursLogged}
        />
      )}
    </div>
  );
}