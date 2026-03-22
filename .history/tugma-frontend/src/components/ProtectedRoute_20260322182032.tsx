import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    isAuthLoading: boolean;
    userRole: string | null;
    allowedRoles: string[];
}

export default function ProtectedRoute({ isAuthLoading, userRole, allowedRoles }: ProtectedRouteProps) {
    // 1. Show a loading spinner while Firebase/Backend is fetching the role
    if (isAuthLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="animate-spin text-purple-600" size={48} />
            </div>
        );
    }

    // 2. If no role/not logged in, kick them back to login
    if (!userRole) {
        return <Navigate to="/login" replace />;
    }

    // 3. If they are logged in but have the WRONG role, redirect them to their proper home
    if (!allowedRoles.includes(userRole)) {
        if (userRole === 'admin' || userRole === 'superadmin') return <Navigate to="/admin/dashboard" replace />;
        if (userRole === 'employer') return <Navigate to="/employer/dashboard" replace />;
        if (userRole === 'student') return <Navigate to="/dashboard" replace />;

        // Fallback safeguard
        return <Navigate to="/login" replace />;
    }

    // 4. If they pass all checks, render the nested routes!
    return <Outlet />;
}