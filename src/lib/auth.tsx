import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '../lib/supabase';
import type { NTRP, Hand, GamePreference } from '../types';
import { useIdleLogout } from './useIdleLogout';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  nickname: string;
  phone: string;
  profileImg: string;
  career: string;
  ntrp: NTRP;
  hand: Hand;
  gamePreference: GamePreference;
  bio: string;
}

interface AuthState {
  user: AuthUser | null;
  isGuest: boolean;
  session: Session | null;
  loading: boolean;
  configError: string | null;
  signInAsGuest: () => void;
  signUp: (input: {
    email: string;
    password: string;
    name: string;
    phone: string;
    marketingConsent: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (
    patch: Partial<Pick<AuthUser, 'name' | 'nickname' | 'phone' | 'career' | 'ntrp' | 'hand' | 'gamePreference' | 'bio' | 'profileImg'>>,
  ) => Promise<{ ok: boolean; error?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  uploadProfileImage: (
    file: File,
  ) => Promise<{ ok: boolean; error?: string; url?: string }>;
}

const Ctx = createContext<AuthState | null>(null);

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}

const DEFAULT_PROFILE_IMG = '/logo_png.png';

function mapProfile(row: Record<string, unknown>, email: string): AuthUser {
  return {
    id: row.id as string,
    email: (row.email as string) || email,
    name: (row.name as string) || '사용자',
    nickname: (row.nickname as string) || '',
    phone: (row.phone as string) || '',
    profileImg: (row.profile_img as string) || DEFAULT_PROFILE_IMG,
    career: (row.career as string) || '0년',
    ntrp: (row.ntrp as NTRP) || '2.0',
    hand: (row.hand as Hand) || 'right',
    gamePreference: (row.game_preference as GamePreference) || 'any',
    bio: (row.bio as string) || '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => sessionStorage.getItem('pth-guest') === '1');
  const [loading, setLoading] = useState(true);
  const configError = supabaseConfigured
    ? null
    : 'Supabase 환경변수가 설정되지 않았습니다. 관리자에게 문의하세요.';

  const fetchProfile = useCallback(async (su: SupabaseUser) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', su.id)
      .maybeSingle();
    if (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
    if (data) {
      return mapProfile(data as Record<string, unknown>, su.email || '');
    }
    return null;
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchProfile(data.session.user).then((p) => {
          if (p) setUser(p);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      if (event === 'SIGNED_OUT' || !sess) {
        setUser(null);
        setLoading(false);
        return;
      }
      if (sess?.user) {
        (async () => {
          const p = await fetchProfile(sess.user);
          if (p) setUser(p);
          setLoading(false);
        })();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = useCallback(
    async (input: { email: string; password: string; name: string; phone: string; marketingConsent: boolean }) => {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
      });
      if (error) return { ok: false, error: error.message };
      if (!data.user) return { ok: false, error: '회원가입에 실패했습니다.' };

      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: input.email,
        name: input.name,
        nickname: input.name,
        phone: input.phone,
        profile_img: DEFAULT_PROFILE_IMG,
        career: '0년',
        ntrp: '2.0',
        hand: 'right',
        game_preference: 'any',
        bio: '',
        marketing_consent: input.marketingConsent,
      });
      if (profileError) {
        return { ok: false, error: '프로필 생성에 실패했습니다: ' + profileError.message };
      }

      const p = await fetchProfile(data.user);
      if (p) setUser(p);
      return { ok: true };
    },
    [fetchProfile],
  );

  const signInAsGuest = useCallback(() => {
    sessionStorage.setItem('pth-guest', '1');
    setIsGuest(true);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { ok: false, error: error.message };
    if (!data.user) return { ok: false, error: '로그인에 실패했습니다.' };
    // Increment cumulative login count (await + log to diagnose failures)
    const { error: rpcError } = await supabase.rpc('increment_login_count', {
      user_id: data.user.id,
    });
    if (rpcError) console.error('login_count increment failed:', rpcError.message);
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    sessionStorage.removeItem('pth-guest');
    setIsGuest(false);
  }, []);

  useIdleLogout(() => { void signOut(); }, Boolean(session));

  const updateProfile = useCallback(
    async (
      patch: Partial<Pick<AuthUser, 'name' | 'nickname' | 'phone' | 'career' | 'ntrp' | 'hand' | 'gamePreference' | 'bio' | 'profileImg'>>,
    ) => {
      if (!user) return { ok: false, error: '로그인이 필요합니다.' };
      const row: Record<string, unknown> = {};
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.nickname !== undefined) row.nickname = patch.nickname;
      if (patch.phone !== undefined) row.phone = patch.phone;
      if (patch.career !== undefined) row.career = patch.career;
      if (patch.ntrp !== undefined) row.ntrp = patch.ntrp;
      if (patch.hand !== undefined) row.hand = patch.hand;
      if (patch.gamePreference !== undefined) row.game_preference = patch.gamePreference;
      if (patch.bio !== undefined) row.bio = patch.bio;
      if (patch.profileImg !== undefined) row.profile_img = patch.profileImg;

      const { error } = await supabase
        .from('profiles')
        .update(row)
        .eq('id', user.id);
      if (error) return { ok: false, error: error.message };
      setUser((prev) => (prev ? { ...prev, ...patch } : prev));
      return { ok: true };
    },
    [user],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!user) return { ok: false, error: '로그인이 필요합니다.' };
      // Verify current password by re-authenticating
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (reauthError) return { ok: false, error: '현재 비밀번호가 올바르지 않습니다.' };
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    [user],
  );

  const uploadProfileImage = useCallback(
    async (file: File) => {
      if (!user) return { ok: false, error: '로그인이 필요합니다.' };
      const MAX_SIZE = 512;
      const QUALITY = 0.85;
      const resized = await new Promise<File | null>((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          let { width, height } = img;
          if (width > height && width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => resolve(blob ? new File([blob], 'avatar.jpg', { type: 'image/jpeg' }) : null),
            'image/jpeg',
            QUALITY,
          );
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
        img.src = url;
      });
      const finalFile = resized || file;
      const ext = finalFile.name.split('.').pop() || 'jpg';
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('profile-images')
        .upload(path, finalFile, { cacheControl: '3600', upsert: true });
      if (upErr) return { ok: false, error: upErr.message };
      const { data } = supabase.storage.from('profile-images').getPublicUrl(path);
      return { ok: true, url: data.publicUrl };
    },
    [user],
  );

  const value: AuthState = { user, isGuest, session, loading, configError, signInAsGuest, signUp, signIn, signOut, updateProfile, changePassword, uploadProfileImage };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
