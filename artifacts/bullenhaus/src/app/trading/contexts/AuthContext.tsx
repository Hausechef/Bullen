import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UnifiedRole = 'client' | 'agent' | 'manager' | 'director' | 'admin' | 'trade_admin' | 'crm_admin' | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UnifiedRole;
  kycStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInMockAdmin: (email?: string) => void;
  signInMockClient: (email?: string) => void;
  signInMockAgent: (email?: string) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  kycStatus: null,
  loading: true,
  signOut: async () => {},
  signInMockAdmin: () => {},
  signInMockClient: () => {},
  signInMockAgent: () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UnifiedRole>(null);
  const [kycStatus, setKycStatus] = useState<'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoleAndKyc = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('role, kyc_status')
        .eq('id', userId)
        .single();

      if (data?.role) {
        setRole((data.role as UnifiedRole));
        setKycStatus((data.kyc_status as any) || 'UNVERIFIED');
      } else {
        // No row in public.users yet — check auth user_metadata as fallback
        // (CRM workers may only exist in auth.users with metadata role)
        const { data: { user } } = await supabase.auth.getUser();
        const metaRole = user?.user_metadata?.role as UnifiedRole | undefined;
        if (metaRole && ['client','agent','manager','director','admin','trade_admin','crm_admin'].includes(metaRole)) {
          setRole(metaRole);
          setKycStatus('VERIFIED');
        } else {
          setRole('client');
          setKycStatus('UNVERIFIED');
        }
      }
    } catch {
      // On error also try metadata
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const metaRole = user?.user_metadata?.role as UnifiedRole | undefined;
        if (metaRole && ['client','agent','manager','director','admin','trade_admin','crm_admin'].includes(metaRole)) {
          setRole(metaRole);
          setKycStatus('VERIFIED');
          return;
        }
      } catch { /* ignore */ }
      setRole('client');
      setKycStatus('UNVERIFIED');
    }
  };

  const refreshProfile = async () => {
    const currentUser = user || session?.user;
    if (currentUser?.id) {
      await fetchRoleAndKyc(currentUser.id);
    }
  };

  const signInMockAdmin = (email?: string) => {
    if (!import.meta.env.DEV) return;
    const mockUser = { id: 'admin-mock', email: email || 'admin@bullenhaus.local' } as User;
    const mockSession = { user: mockUser, access_token: 'mock-token', refresh_token: 'mock', expires_in: 9999, token_type: 'bearer' } as Session;
    setSession(mockSession);
    setUser(mockUser);
    setRole('admin');
    setKycStatus('VERIFIED');
    setLoading(false);
  };

  const signInMockClient = (email?: string) => {
    if (!import.meta.env.DEV) return;
    const mockUser = { id: 'client-mock', email: email || 'client@bullenhaus.local' } as User;
    const mockSession = { user: mockUser, access_token: 'mock-token', refresh_token: 'mock', expires_in: 9999, token_type: 'bearer' } as Session;
    setSession(mockSession);
    setUser(mockUser);
    setRole('client');
    setKycStatus('VERIFIED');
    setLoading(false);
  };

  const signInMockAgent = (email?: string) => {
    if (!import.meta.env.DEV) return;
    const mockUser = { id: 'agent-mock', email: email || 'agent@bullenhaus.local' } as User;
    const mockSession = { user: mockUser, access_token: 'mock-token', refresh_token: 'mock', expires_in: 9999, token_type: 'bearer' } as Session;
    setSession(mockSession);
    setUser(mockUser);
    setRole('agent');
    setKycStatus('VERIFIED');
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoleAndKyc(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        setLoading(true);
        fetchRoleAndKyc(newUser.id);
      } else {
        setRole(null);
        setKycStatus(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && role) {
      setLoading(false);
    }
  }, [session, role]);

  // Real-time subscription to sync kyc_status when admin changes it
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel(`user-${user.id}-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const { kyc_status, role: newRole } = payload.new as any;
          if (kyc_status) {
            setKycStatus((kyc_status as any) || 'UNVERIFIED');
          }
          if (newRole) {
            setRole((newRole as UnifiedRole) || null);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const signOut = async () => {
    setSession(null);
    setUser(null);
    setRole(null);
    setKycStatus(null);
    setLoading(false);
    await supabase.auth.signOut({ scope: 'global' });
  };

  return (
    <AuthContext.Provider value={{ session, user, role, kycStatus, loading, signOut, signInMockAdmin, signInMockClient, signInMockAgent, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
