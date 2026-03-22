import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- LAYOUTS ---
import DashboardLayout from './layouts/StudentLayout';
import EmployerLayout from './layouts/EmployerLayout';
import AdminLayout from './layouts/AdminLayout';

// --- CONTEXT & PROTECTED ROUTE ---
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute'; // <-- Import the wrapper

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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><FindJobs /></DashboardLayout></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><Messages /></DashboardLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><StudentProfile /></DashboardLayout></ProtectedRoute>} />
          <Route path="/resume" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><Resume /></DashboardLayout></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><StudentNotification /></DashboardLayout></ProtectedRoute>} />
          <Route path="/connected-employers" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><ConnectedEmployers /></DashboardLayout></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><StudentHelp /></DashboardLayout></ProtectedRoute>} />
          <Route path="/ojttracker" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><OJTTrackerPage /></DashboardLayout></ProtectedRoute>} />


          {/* 🏢 EMPLOYER PORTAL */}
          <Route path="/employer" element={<Navigate to="/employer/dashboard" replace />} />

          <Route path="/employer/dashboard" element={<ProtectedRoute allowedRoles={['employer']}><EmployerLayout><EmployerDashboard /></EmployerLayout></ProtectedRoute>} />
          <Route path="/employer/jobs" element={<ProtectedRoute allowedRoles={['employer']}><EmployerLayout><EmployerJobs /></EmployerLayout></ProtectedRoute>} />
          <Route path="/employer/applicants" element={<ProtectedRoute allowedRoles={['employer']}><EmployerLayout><EmployerApplicants /></EmployerLayout></ProtectedRoute>} />
          <Route path="/employer/profile" element={<ProtectedRoute allowedRoles={['employer']}><EmployerLayout><EmployerProfile /></EmployerLayout></ProtectedRoute>} />
          <Route path="/employer/notifications" element={<ProtectedRoute allowedRoles={['employer']}><EmployerLayout><EmployerNotification /></EmployerLayout></ProtectedRoute>} />
          <Route path="/employer/settings" element={<ProtectedRoute allowedRoles={['employer']}><EmployerLayout><EmployerSettings /></EmployerLayout></ProtectedRoute>} />
          <Route path="/employer/interns" element={<ProtectedRoute allowedRoles={['employer']}><EmployerLayout><ConnectedStudents /></EmployerLayout></ProtectedRoute>} />
          <Route path="/employer/help" element={<ProtectedRoute allowedRoles={['employer']}><EmployerLayout><EmployerHelp /></EmployerLayout></ProtectedRoute>} />
          <Route path="/employer/messages" element={<ProtectedRoute allowedRoles={['employer']}><EmployerLayout><EmployerMessages /></EmployerLayout></ProtectedRoute>} />


          {/* ⚡ ADMIN PORTAL */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/verification" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminLayout><AdminVerification /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminLayout><AdminReports /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminLayout><AdminNotification /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/support" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminLayout><CustomerService /></AdminLayout></ProtectedRoute>} />

        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;