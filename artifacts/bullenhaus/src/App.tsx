import './app/trading/i18n/config';
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';

// Legal Pages
import { ContactCompliance } from './app/trading/pages/legal/ContactCompliance';
import { TermsOfService }    from './app/trading/pages/legal/TermsOfService';
import { PrivacyPolicy }     from './app/trading/pages/legal/PrivacyPolicy';
import { AMLPolicy }         from './app/trading/pages/legal/AMLPolicy';
import { CorporateData }     from './app/trading/pages/legal/CorporateData';

// Guards & Contexts
import { AuthProvider, useAuth } from './app/trading/contexts/AuthContext';
import { AuthGuard } from './components/guards/AuthGuard';
import { RoleGuard } from './components/guards/RoleGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GoldDefs } from './app/trading/components/common/LuxIcon';

// Global Auth Pages
import LoginPage from './app/login/LoginPage';
import { Register } from './app/trading/pages/auth/Register';
import { ForgotPassword } from './app/trading/pages/auth/ForgotPassword';
import { ResetPassword } from './app/trading/pages/auth/ResetPassword';
import { AuthLayout } from './app/trading/pages/auth/AuthLayout';
import PortalLanding from './app/portal/PortalLanding';
import { RecoveryLanding } from './app/recovery/RecoveryLanding';
import { RecoveryClientPortal } from './app/recovery/RecoveryClientPortal';

// Trade Hooks
import { useMarketEngine } from './app/trading/hooks/useMarketEngine';

// ==========================================
// TRADING COMPONENTS (Lazy)
// ==========================================
const TradeDashboard = React.lazy(() => import('./app/trading/components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const TradeMarkets = React.lazy(() => import('./app/trading/pages/dashboard/Markets').then(m => ({ default: m.Markets })));
const TradeTerminal = React.lazy(() => import('./app/trading/pages/dashboard/Trade').then(m => ({ default: m.Trade })));
const TradePreMarket = React.lazy(() => import('./app/trading/pages/dashboard/PreMarket').then(m => ({ default: m.PreMarket })));
const TradePortfolio = React.lazy(() => import('./app/trading/pages/dashboard/Portfolio').then(m => ({ default: m.Portfolio })));
const TradeTransactions = React.lazy(() => import('./app/trading/pages/dashboard/Transactions').then(m => ({ default: m.Transactions })));
const TradeDeposit = React.lazy(() => import('./app/trading/pages/dashboard/DepositPage').then(m => ({ default: m.DepositPage })));
const TradeDepositResult = React.lazy(() => import('./app/trading/pages/dashboard/DepositResult').then(m => ({ default: m.DepositResult })));
const TradeReferrals = React.lazy(() => import('./app/trading/pages/dashboard/Referrals').then(m => ({ default: m.Referrals })));
const TradeKYC = React.lazy(() => import('./app/trading/pages/dashboard/KYC').then(m => ({ default: m.KYC })));
const TradeNotifications = React.lazy(() => import('./app/trading/pages/dashboard/NotificationsPage').then(m => ({ default: m.Notifications })));
const TradeSupport = React.lazy(() => import('./app/trading/pages/dashboard/Support').then(m => ({ default: m.Support })));
const TradeProfileSettings = React.lazy(() => import('./app/trading/pages/dashboard/ProfileSettings').then(m => ({ default: m.ProfileSettings })));
const TradeGamification = React.lazy(() => import('./app/trading/pages/dashboard/Gamification').then(m => ({ default: m.Gamification })));
const TradeInstitutionalTools = React.lazy(() => import('./app/trading/pages/dashboard/InstitutionalTools').then(m => ({ default: m.InstitutionalTools })));
const TradeDocumentation = React.lazy(() => import('./app/trading/pages/dashboard/Documentation').then(m => ({ default: m.Documentation })));

// Trade Admin Components
const TradeAdminLayout = React.lazy(() => import('./app/trading/components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const TradeAdminOverview = React.lazy(() => import('./app/trading/pages/admin/AdminOverview').then(m => ({ default: m.AdminOverview })));
const TradeAdminUsers = React.lazy(() => import('./app/trading/pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const TradeAdminPreMarket = React.lazy(() => import('./app/trading/pages/admin/AdminPreMarket').then(m => ({ default: m.AdminPreMarket })));
const TradeAdminMarketControl = React.lazy(() => import('./app/trading/pages/admin/AdminMarketControl').then(m => ({ default: m.AdminMarketControl })));
const TradeAdminKYC = React.lazy(() => import('./app/trading/pages/admin/AdminKYC').then(m => ({ default: m.AdminKYC })));
const TradeAdminTransactions = React.lazy(() => import('./app/trading/pages/admin/AdminTransactions').then(m => ({ default: m.AdminTransactions })));
const TradeAdminSettings = React.lazy(() => import('./app/trading/pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const TradeAdminSupport = React.lazy(() => import('./app/trading/pages/admin/AdminSupport').then(m => ({ default: m.AdminSupport })));
const TradeCRMSyncPanel = React.lazy(() => import('./app/trading/pages/admin/CRMSyncPanel').then(m => ({ default: m.CRMSyncPanel })));
const TradeAdminDeposits = React.lazy(() => import('./app/trading/pages/admin/AdminDeposits').then(m => ({ default: m.AdminDeposits })));
const TradeAdminWithdrawals = React.lazy(() => import('./app/trading/pages/admin/AdminWithdrawals').then(m => ({ default: m.AdminWithdrawals })));
const TradeAdminPayments = React.lazy(() => import('./app/trading/pages/admin/AdminPayments').then(m => ({ default: m.AdminPayments })));

// Trade Protected Layout
const TradeProtectedLayout = React.lazy(() => import('./app/trading/components/layout/ProtectedRoute').then(m => ({ default: m.ProtectedRoute })));

// ==========================================
// CRM COMPONENTS (Lazy)
// ==========================================
const CRMLayout = React.lazy(() => import('./app/crm/components/Layout').then(m => ({ default: m.Layout })));
const CRMDashboard = React.lazy(() => import('./app/crm/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const CRMManagerDashboard = React.lazy(() => import('./app/crm/pages/ManagerDashboard').then(m => ({ default: m.ManagerDashboard })));
const CRMAgentWorkspace = React.lazy(() => import('./app/crm/pages/AgentWorkspace').then(m => ({ default: m.AgentWorkspace })));
const CRMAdminPanel = React.lazy(() => import('./app/crm/pages/AdminPanel').then(m => ({ default: m.AdminPanel })));
const CRMVIPClients = React.lazy(() => import('./app/crm/pages/VIPClients').then(m => ({ default: m.VIPClients })));
const CRMVIPOnly = React.lazy(() => import('./app/crm/pages/VIPClients').then(m => ({ default: m.VIPClientsPage })));
const CRMCallHistory = React.lazy(() => import('./app/crm/pages/CallHistory').then(m => ({ default: m.CallHistory })));
const CRMAgentClients = React.lazy(() => import('./app/crm/pages/AgentClients').then(m => ({ default: m.AgentClients })));
const CRMTelephonySettings = React.lazy(() => import('./app/crm/pages/TelephonySettings').then(m => ({ default: m.TelephonySettings })));
const CRMAIInsights = React.lazy(() => import('./app/crm/pages/AIInsights').then(m => ({ default: m.AIInsights })));
const CRMLeadKanban = React.lazy(() => import('./app/crm/pages/LeadKanban').then(m => ({ default: m.LeadKanban })));
const CRMTasks = React.lazy(() => import('./app/crm/pages/Tasks').then(m => ({ default: m.Tasks })));
const CRMTickets = React.lazy(() => import('./app/crm/pages/Tickets').then(m => ({ default: m.Tickets })));
const CRMMessages = React.lazy(() => import('./app/crm/pages/Messages').then(m => ({ default: m.Messages })));
const CRMSalesScripts = React.lazy(() => import('./app/crm/pages/SalesScripts').then(m => ({ default: m.SalesScripts })));
const CRMKycReview = React.lazy(() => import('./app/crm/pages/KYCReview').then(m => ({ default: m.KYCReview })));
const CRMWorkflowRules = React.lazy(() => import('./app/crm/pages/WorkflowRules').then(m => ({ default: m.WorkflowRules })));
const CRMRecoveryCaseWorkspace = React.lazy(() => import('./app/crm/pages/RecoveryCaseWorkspace').then(m => ({ default: m.RecoveryCaseWorkspace })));

const Fallback = () => (
  <div className="flex h-dvh w-full items-center justify-center bg-bg">
    <Loader2 className="w-8 h-8 text-gold animate-spin" />
  </div>
);

// Wrapper to initialize Market Engine for Trading zone
import { TradingProvider } from './app/trading/contexts/TradingContext';

const TradeAppWrapper = () => {
  useMarketEngine();
  // We use TradeProtectedLayout which renders the sidebar/topbar
  return (
    <Suspense fallback={<Fallback />}>
      <TradingProvider>
        <TradeProtectedLayout />
      </TradingProvider>
    </Suspense>
  );
};

// Wrapper for CRM to inject the role into the old Layout component.
import { PhoneDialerProvider } from './app/crm/contexts/PhoneDialerContext';

const CRMAppWrapper = () => {
  const { role, signOut } = useAuth();

  if (!role) return <Fallback />;

  return (
    <Suspense fallback={<Fallback />}>
      <PhoneDialerProvider role={role}>
        <CRMLayout role={role} onLogout={signOut}>
          <Outlet />
        </CRMLayout>
      </PhoneDialerProvider>
    </Suspense>
  );
};


// Smart redirect: каждая роль — в свой корневой раздел
const CRMRedirect = () => {
  const { role } = useAuth();
  if (role === 'admin' || role === 'crm_admin') return <Navigate to="/crm/admin" replace />;
  if (role === 'director') return <Navigate to="/crm/dashboard" replace />;
  if (role === 'manager') return <Navigate to="/crm/manager" replace />;
  return <Navigate to="/crm/workspace" replace />;
};

const NotFoundPage = () => (
  <div className="flex h-dvh w-full items-center justify-center bg-bg px-6">
    <div className="glass-card max-w-xl w-full p-10 text-center border border-accent-primary/20">
      <p className="text-xs uppercase tracking-[0.25em] text-accent-primary mb-3">Bullenhaus</p>
      <h1 className="font-serif text-6xl font-bold gold-gradient-text mb-3">404</h1>
      <h2 className="text-2xl font-bold text-white mb-3">Page not found</h2>
      <p className="text-slate-400 mb-8">The page you requested does not exist or is still being migrated.</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/trade/dashboard" className="btn-gold">Trading Dashboard</Link>
        <Link to="/crm/dashboard" className="px-5 py-2.5 rounded-xl border border-white/15 text-white hover:bg-white/5">CRM Dashboard</Link>
      </div>
    </div>
  </div>
);

const AppContent = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<Fallback />}>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/" element={<PortalLanding />} />
          <Route path="/recovery" element={<RecoveryLanding />} />
          {/* Путь /recovery/* на общем домене проксируется на Recovery-проект,
              поэтому внутренний портал переезжает на отдельный путь. */}
          <Route path="/recovery-portal" element={<RecoveryClientPortal />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AuthLayout />}>
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
          <Route path="/unauthorized" element={
            <div className="flex h-dvh w-full items-center justify-center bg-bg flex-col gap-5 p-6">
              <h1 className="font-serif text-7xl font-bold gold-gradient-text">403</h1>
              <p className="text-text-muted text-center max-w-sm">You do not have permission to access this area.</p>
              <Link to="/login" className="btn-gold">Return to Login</Link>
            </div>
          } />

          {/* ==========================================
              TRADING CLIENT ZONE
             ========================================== */}
          <Route element={<AuthGuard />}>
            <Route element={<RoleGuard allowedRoles={['client', 'admin', 'trade_admin']} />}>
              <Route path="/gamification" element={<Navigate to="/trade/gamification" replace />} />
              <Route path="/trade" element={<ErrorBoundary><TradeAppWrapper /></ErrorBoundary>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<TradeDashboard />} />
                <Route path="markets" element={<TradeMarkets />} />
                <Route path="terminal" element={<TradeTerminal />} />
                <Route path="pre-market" element={<TradePreMarket />} />
                <Route path="portfolio" element={<TradePortfolio />} />
                <Route path="deposit" element={<TradeDeposit />} />
                <Route path="deposit/success" element={<TradeDepositResult key="success" variant="success" />} />
                <Route path="deposit/pending" element={<TradeDepositResult key="pending" variant="pending" />} />
                <Route path="deposit/failed" element={<TradeDepositResult key="failed" variant="failed" />} />
                <Route path="transactions" element={<TradeTransactions />} />
                <Route path="referrals" element={<TradeReferrals />} />
                <Route path="kyc" element={<TradeKYC />} />
                <Route path="notifications" element={<TradeNotifications />} />
                <Route path="support" element={<TradeSupport />} />
                <Route path="gamification" element={<TradeGamification />} />
                <Route path="tools" element={<TradeInstitutionalTools />} />
                <Route path="docs" element={<TradeDocumentation />} />
                <Route path="settings" element={<TradeProfileSettings />} />
              </Route>
            </Route>
          </Route>

          {/* ==========================================
              CRM WORKER ZONE
             ========================================== */}
          <Route element={<AuthGuard />}>
            <Route element={<RoleGuard allowedRoles={['agent', 'manager', 'director', 'admin', 'crm_admin']} />}>
              <Route path="/crm" element={<ErrorBoundary><CRMAppWrapper /></ErrorBoundary>}>
                <Route index element={<CRMRedirect />} />
                <Route path="workspace" element={<CRMAgentWorkspace />} />
                <Route path="leads" element={<CRMAgentWorkspace />} />
                <Route path="my-clients" element={<CRMAgentClients />} />
                <Route path="kanban" element={<CRMLeadKanban />} />
                <Route path="tasks" element={<CRMTasks />} />
                <Route path="tickets" element={<CRMTickets />} />
                <Route path="messages" element={<CRMMessages />} />
                <Route path="scripts" element={<CRMSalesScripts />} />
                <Route path="recovery" element={<CRMRecoveryCaseWorkspace />} />
                {/* Менеджерские функции — только manager и выше (чужая роль ->
                    авто-возврат в свой раздел, см. RoleGuard) */}
                <Route element={<RoleGuard allowedRoles={['manager', 'director', 'admin', 'crm_admin']} />}>
                  <Route path="dashboard" element={<CRMDashboard />} />
                  <Route path="manager" element={<CRMManagerDashboard />} />
                  <Route path="clients" element={<CRMVIPClients />} />
                  <Route path="vip" element={<CRMVIPOnly />} />
                  <Route path="calls" element={<CRMCallHistory />} />
                  <Route path="telephony" element={<CRMTelephonySettings />} />
                  <Route path="ai-insights" element={<CRMAIInsights />} />
                  <Route path="sales-scripts" element={<CRMSalesScripts />} />
                  <Route path="kyc-review" element={<CRMKycReview />} />
                  <Route path="workflows" element={<CRMWorkflowRules />} />
                </Route>
                <Route element={<RoleGuard allowedRoles={['admin', 'crm_admin']} />}>
                  <Route path="admin" element={<CRMAdminPanel />} />
                </Route>
              </Route>
            </Route>
          </Route>

          {/* Recovery case data stays protected by Supabase RLS; staff triage remains in /crm/recovery. */}

          {/* ==========================================
              TRADE ADMIN ZONE
             ========================================== */}
          <Route element={<AuthGuard />}>
            <Route element={<RoleGuard allowedRoles={['admin', 'trade_admin']} />}>
              <Route path="/admin" element={<ErrorBoundary><TradeAdminLayout /></ErrorBoundary>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<TradeAdminOverview />} />
                <Route path="users" element={<TradeAdminUsers />} />
                <Route path="kyc" element={<TradeAdminKYC />} />
                <Route path="deposits" element={<TradeAdminDeposits />} />
                <Route path="withdrawals" element={<TradeAdminWithdrawals />} />
                <Route path="payments" element={<TradeAdminPayments />} />
                <Route path="premarket" element={<TradeAdminPreMarket />} />
                <Route path="market-control" element={<TradeAdminMarketControl />} />
                <Route path="transactions" element={<TradeAdminTransactions />} />
                <Route path="crm-sync" element={<div className="p-8"><TradeCRMSyncPanel /></div>} />
                <Route path="support" element={<TradeAdminSupport />} />
                <Route path="settings" element={<TradeAdminSettings />} />
              </Route>
            </Route>
          </Route>

          {/* ==========================================
              LEGAL PAGES (Public)
             ========================================== */}
          <Route path="/legal/contact"  element={<React.Suspense fallback={<Fallback />}><ContactCompliance /></React.Suspense>} />
          <Route path="/legal/terms"    element={<React.Suspense fallback={<Fallback />}><TermsOfService /></React.Suspense>} />
          <Route path="/legal/privacy"  element={<React.Suspense fallback={<Fallback />}><PrivacyPolicy /></React.Suspense>} />
          <Route path="/legal/aml"      element={<React.Suspense fallback={<Fallback />}><AMLPolicy /></React.Suspense>} />
          <Route path="/legal/corporate" element={<React.Suspense fallback={<Fallback />}><CorporateData /></React.Suspense>} />

          {/* Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <GoldDefs />
      <AuthProvider>
        <AppContent />
        <Toaster theme="dark" position="top-right" richColors />
      </AuthProvider>
    </ErrorBoundary>
  );
}
