import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UnifiedRole } from '../../app/trading/contexts/AuthContext';

interface RoleGuardProps {
  allowedRoles: UnifiedRole[];
  fallbackUrl?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, fallbackUrl }) => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0b]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    // If they have no role or the wrong role, send them to unauthorized or a specific fallback
    return <Navigate to={fallbackUrl || "/unauthorized"} replace />;
  }

  return <Outlet />;
};
