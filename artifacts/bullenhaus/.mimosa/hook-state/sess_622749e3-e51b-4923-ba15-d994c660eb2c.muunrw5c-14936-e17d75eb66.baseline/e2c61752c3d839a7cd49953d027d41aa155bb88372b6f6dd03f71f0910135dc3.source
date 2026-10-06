import { create } from 'zustand';
import { getSupabaseBrowserClient } from '../../../lib/supabase/browserClient';

interface UserProfile {
  id: string;
  email: string;
  username?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  avatar_url: string | null;
  role?: string;
  kyc_status?: string;
}

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  fetchProfile: (userId: string, email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  loading: false,
  fetchProfile: async (userId: string, email: string) => {
    set({ loading: true });
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase not configured');
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (data) {
        set({ profile: { ...data, email } });
      } else {
        // Build a local fallback profile if the database row is missing.
        set({ profile: { id: userId, email, username: null, full_name: null, avatar_url: null } });
      }
    } catch (e) {
      set({ profile: { id: userId, email, username: null, full_name: null, avatar_url: null } });
    } finally {
      set({ loading: false });
    }
  },
  updateProfile: async (updates: Partial<UserProfile>) => {
    const profile = get().profile;
    if (!profile) return;
    
    // optimistically update local state
    set({ profile: { ...profile, ...updates } });
    
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      await supabase
        .from('users')
        .update(updates)
        .eq('id', profile.id);
    } catch (e) {
      console.error('Failed to sync profile updates to DB', e);
    }
  },
  clearProfile: () => set({ profile: null }),
}));
