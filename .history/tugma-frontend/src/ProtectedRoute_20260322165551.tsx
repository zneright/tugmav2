// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

// TODO: Replace this with your actual Authentication Context or Hook
// It should return the current user, their role from your database, and a loading state.
const useAuth = () => {
    return {
        user: { uid: '123', role: 'student' }, // Example: 'student', 'employer', 'admin'
        isLoading: false
    };
};

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, isLoading } = useAuth();

    // 1. Wait for Firebase/Backend to finish checking the auth state
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    // 2. If the user is not logged in, kick them to the login page
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect them to their proper dashboard based on their actual role
        if (user.role === 'employer') return <Navigate to="/employer/dashboard" replace />;
        if (user.role === 'admin' || user.role === 'superadmin') return <Navigate to="/admin/dashboard" replace />;

        return <Navigate to="/dashboard" replace />;
    }

    return children;
}