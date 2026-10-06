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
    // Аутентифицированный пользователь с чужой ролью не должен упираться
    // в тупиковый 403 — возвращаем его в его собственный раздел
    // (агент открыл /crm/dashboard -> Agent Workspace, агент открыл
    // /trade -> /crm/workspace, клиент открыл /crm -> трейдинг).
    // Явный fallbackUrl сохраняет страницу /unauthorized для внутренних
    // guards с повышением привилегий (agent -> kyc-review и т.п.).
    if (!fallbackUrl && role) {
      if (role === 'admin' || role === 'trade_admin') return <Navigate to="/admin/dashboard" replace />;
      if (role === 'director' || role === 'crm_admin') return <Navigate to="/crm/dashboard" replace />;
      if (role === 'manager') return <Navigate to="/crm/manager" replace />;
      if (role === 'agent') return <Navigate to="/crm/workspace" replace />;
      if (role === 'client') return <Navigate to="/trade/dashboard" replace />;
    }
    return <Navigate to={fallbackUrl || "/unauthorized"} replace />;
  }

  return <Outlet />;
};
