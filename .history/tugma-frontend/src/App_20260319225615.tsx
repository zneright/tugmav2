import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- LAYOUTS ---
import DashboardLayout from './layouts/StudentLayout';
import EmployerLayout from './layouts/EmployerLayout';
import AdminLayout from './layouts/AdminLayout';

// --- CONTEXT ---
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
  return (
    <ThemeProvider>
      <Router>
        <Routes>

          {/* 🚀 PUBLIC ROUTE */}
          <Route path="/login" element={<Auth />} />

          {/* 🛡️ STUDENT PORTAL */}
          {/* 1. This redirects the base URL to the lowercase dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 2. Notice how the paths are clean, but they load your Student components! */}
          <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/jobs" element={<DashboardLayout><FindJobs /></DashboardLayout>} />
          <Route path="/messages" element={<DashboardLayout><Messages /></DashboardLayout>} />
          <Route path="/profile" element={<DashboardLayout><StudentProfile /></DashboardLayout>} />
          <Route path="/resume" element={<DashboardLayout><Resume /></DashboardLayout>} />
          <Route path="/notifications" element={<DashboardLayout><StudentNotification /></DashboardLayout>} />
          <Route path="/connected-employers" element={<DashboardLayout><ConnectedEmployers /></DashboardLayout>} />
          <Route path="/help" element={<DashboardLayout><StudentHelp /></DashboardLayout>} />
          <Route path="/ojttracker" element={D<Dashboard><OJTTrackerPage}


          {/* 🏢 EMPLOYER PORTAL */}
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


          {/* ⚡ ADMIN PORTAL */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
          <Route path="/admin/verification" element={<AdminLayout><AdminVerification /></AdminLayout>} />
          <Route path="/admin/reports" element={<AdminLayout><AdminReports /></AdminLayout>} />
          <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
          <Route path="/admin/notifications" element={<AdminLayout><AdminNotification /></AdminLayout>} />

          {/* Added the Customer Service route for the Admin */}
          <Route path="/admin/support" element={<AdminLayout><CustomerService /></AdminLayout>} />

        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;