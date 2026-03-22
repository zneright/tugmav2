import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import ProtectedRoute from './components/ProtectedRoute'; // <-- Import the new guard

// --- LAYOUTS & CONTEXT ---
import DashboardLayout from './layouts/StudentLayout';
import EmployerLayout from './layouts/EmployerLayout';
import AdminLayout from './layouts/AdminLayout';
import { ThemeProvider } from './context/ThemeContext';

// --- SHARED / AUTH PAGES ---
import Auth from './pages/Auth';

// --- STUDENT PAGES ---
import Dashboard from './pages/student/StudentDashboard';
import FindJobs from './pages/student/StudentFindJobs';
import Messages from './pages/student/StudentMessages';
import StudentProfile from './pages/student/StudentProfile';
import Resume from './pages/student/StudentResume';
import StudentNotification from './pages/student/StudentNotifications';
import ConnectedEmployers from './pages/student/ConnectedEmployers';
import StudentHelp from './pages/student/StudentHelp';
import OJTTrackerPage from './pages/student/OJTTrackerPage';

// --- EMPLOYER PAGES ---
import EmployerDashboard from './pages/employer/EmployerDashboard';
import EmployerJobs from './pages/employer/EmployerJobs';
import EmployerApplicants from './pages/employer/EmployerApplicants';
import EmployerNotification from './pages/employer/EmployerNotifications';
import EmployerProfile from './pages/employer/EmployerProfile';
import EmployerSettings from './pages/employer/EmployerSettings';
import ConnectedStudents from './pages/employer/ConnectedStudents';
import EmployerHelp from './pages/employer/EmployerHelp';
import EmployerMessages from './pages/employer/EmployerMessages';

// --- ADMIN PAGES ---
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminVerification from './pages/admin/AdminVerification';
import AdminReports from './pages/admin/AdminReports';
import AdminNotification from './pages/admin/AdminNotifications';
import AdminSettings from './pages/admin/AdminSettings';
import CustomerService from './pages/admin/CustomerService';

function App() {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 1. First, check if the user is the SuperAdmin by email (Hardcoded bypass for security)
        const SUPERADMIN_EMAIL = "buday.313258@caloocan.sti.edu.ph";
        if (user.email === SUPERADMIN_EMAIL) {
          setUserRole('superadmin');
          setIsAuthLoading(false);
          return;
        }

        // 2. Fetch role with a simple retry logic for new Google users
        const getRole = async (attempts = 0): Promise<void> => {
          try {
            const response = await fetch(`http://localhost:8080/api/users/role/${user.uid}`);
            if (response.ok) {
              const data = await response.json();
              setUserRole(data.role);
              setIsAuthLoading(false);
            } else if (attempts < 3) {
              // If backend hasn't created the user yet (e.g., Google login in progress)
              // Wait 1.5 seconds and try again
              setTimeout(() => getRole(attempts + 1), 1500);
            } else {
              setUserRole(null);
              setIsAuthLoading(false);
            }
          } catch (error) {
            if (attempts < 3) {
              setTimeout(() => getRole(attempts + 1), 1500);
            } else {
              console.error("Failed to fetch user role after retries", error);
              setUserRole(null);
              setIsAuthLoading(false);
            }
          }
        };

        getRole();
      } else {
        setUserRole(null);
        setIsAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);
  return (
    <ThemeProvider>
      <Router>
        <Routes>

          {/* 🚀 PUBLIC ROUTE */}
          <Route path="/login" element={
            // If already logged in, push them to their respective dashboard instead of the login page
            userRole === 'student' ? <Navigate to="/dashboard" replace /> :
              userRole === 'employer' ? <Navigate to="/employer/dashboard" replace /> :
                (userRole === 'admin' || userRole === 'superadmin') ? <Navigate to="/admin/dashboard" replace /> :
                  <Auth />
          } />

          <Route path="/" element={
            userRole ? <Navigate to={userRole === 'employer' ? '/employer/dashboard' : userRole === 'admin' || userRole === 'superadmin' ? '/admin/dashboard' : '/dashboard'} replace />
              : <Navigate to="/login" replace />
          } />


          {/* 🛡️ STUDENT PORTAL (Only 'student' allowed) */}
          <Route element={<ProtectedRoute isAuthLoading={isAuthLoading} userRole={userRole} allowedRoles={['student']} />}>
            <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
            <Route path="/jobs" element={<DashboardLayout><FindJobs /></DashboardLayout>} />
            <Route path="/messages" element={<DashboardLayout><Messages /></DashboardLayout>} />
            <Route path="/profile" element={<DashboardLayout><StudentProfile /></DashboardLayout>} />
            <Route path="/resume" element={<DashboardLayout><Resume /></DashboardLayout>} />
            <Route path="/notifications" element={<DashboardLayout><StudentNotification /></DashboardLayout>} />
            <Route path="/connected-employers" element={<DashboardLayout><ConnectedEmployers /></DashboardLayout>} />
            <Route path="/help" element={<DashboardLayout><StudentHelp /></DashboardLayout>} />
            <Route path="/ojttracker" element={<DashboardLayout><OJTTrackerPage /></DashboardLayout>} />
          </Route>


          {/* 🏢 EMPLOYER PORTAL (Only 'employer' allowed) */}
          <Route element={<ProtectedRoute isAuthLoading={isAuthLoading} userRole={userRole} allowedRoles={['employer']} />}>
            <Route path="/employer" element={<Navigate to="/employer/dashboard" replace />} />
            <Route path="/employer/dashboard" element={<EmployerLayout><EmployerDashboard /></EmployerLayout>} />
            <Route path="/employer/jobs" element={<EmployerLayout><EmployerJobs /></EmployerLayout>} />
            <Route path="/employer/applicants" element={<EmployerLayout><EmployerApplicants /></EmployerLayout>} />
            <Route path="/employer/profile" element={<EmployerLayout><EmployerProfile /></EmployerLayout>} />
            <Route path="/employer/notifications" element={<EmployerLayout><EmployerNotification /></EmployerLayout>} />
            <Route path="/employer/settings" element={<EmployerLayout><EmployerSettings /></EmployerLayout>} />
            <Route path="/employer/interns" element={<EmployerLayout><ConnectedStudents /></EmployerLayout>} />
            <Route path="/employer/help" element={<EmployerLayout><EmployerHelp /></EmployerLayout>} />
            <Route path="/employer/messages" element={<EmployerLayout><EmployerMessages /></EmployerLayout>} />
          </Route>


          {/* ⚡ ADMIN & SUPERADMIN PORTAL (Allows both 'admin' AND 'superadmin') */}
          <Route element={<ProtectedRoute isAuthLoading={isAuthLoading} userRole={userRole} allowedRoles={['admin', 'superadmin']} />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
            <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
            <Route path="/admin/verification" element={<AdminLayout><AdminVerification /></AdminLayout>} />
            <Route path="/admin/reports" element={<AdminLayout><AdminReports /></AdminLayout>} />
            <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
            <Route path="/admin/notifications" element={<AdminLayout><AdminNotification /></AdminLayout>} />
            <Route path="/admin/support" element={<AdminLayout><CustomerService /></AdminLayout>} />
          </Route>

          {/* 🔒 404 CATCH-ALL */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;