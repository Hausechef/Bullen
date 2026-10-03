import React, { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MainLayout } from './MainLayout';
import { Loader2 } from 'lucide-react';

const Fallback = () => (
  <div className="flex h-full w-full items-center justify-center min-h-[400px]">
    <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
  </div>
);

export const ProtectedRoute: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MainLayout>
      <Suspense fallback={<Fallback />}>
        <Outlet />
      </Suspense>
    </MainLayout>
  );
};


export const AdminProtectedRoute: React.FC = () => {
  const { session, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-danger border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'admin' && role !== 'trade_admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
