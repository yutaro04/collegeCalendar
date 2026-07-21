'use client';

import { createContext, useContext, useEffect, useState, useCallback, createElement, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// GASの ALLOWED_DOMAIN と揃える
const ALLOWED_DOMAIN = 'hlab.college';

function isAllowedEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', userId)
      .maybeSingle();
    if (data) setProfile(data as Profile);
  }, []);

  // 「プライベート」カレンダー投稿用: 本人のGoogleカレンダーを操作するrefresh_tokenをサーバーに保存
  const saveGoogleRefreshToken = useCallback(async (accessToken: string, refreshToken: string) => {
    try {
      await fetch('/api/auth/google-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // 保存に失敗してもログイン自体は継続する（プライベート投稿時にエラーになるだけ）
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      // リフレッシュトークンが失効している場合（Invalid Refresh Token など）は
      // 古いセッションをローカルからクリアして未ログイン状態にリセットする
      if (error) {
        supabase.auth.signOut({ scope: 'local' });
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      if (data.session?.user && !isAllowedEmail(data.session.user.email)) {
        supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setAuthError(`${ALLOWED_DOMAIN} のアカウントでログインしてください`);
        setLoading(false);
        return;
      }
      setSession(data.session);
      if (data.session?.user) fetchProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      // トークン更新に失敗すると SIGNED_OUT が飛んでくる。newSession は null になる
      if (newSession?.user && !isAllowedEmail(newSession.user.email)) {
        supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setAuthError(`${ALLOWED_DOMAIN} のアカウントでログインしてください`);
        setLoading(false);
        return;
      }
      setSession(newSession);
      if (newSession?.user) {
        fetchProfile(newSession.user.id);
        if (newSession.provider_refresh_token) {
          saveGoogleRefreshToken(newSession.access_token, newSession.provider_refresh_token);
        }
      } else {
        setProfile(null);
      }
      if (event === 'SIGNED_OUT') setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [fetchProfile, saveGoogleRefreshToken]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        // scopesを指定するとSupabaseの既定スコープが上書きされるため、基本スコープ(openid email profile)を明示しつつ
        // 「プライベート」カレンダー投稿で本人のGoogleカレンダーに書き込むためのスコープを追加する
        scopes: 'openid email profile https://www.googleapis.com/auth/calendar.events',
        queryParams: { hd: ALLOWED_DOMAIN, access_type: 'offline', prompt: 'consent' },
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateDisplayName = useCallback(async (name: string) => {
    if (!session?.user) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', session.user.id);
    if (error) throw error;
    setProfile(p => (p ? { ...p, display_name: trimmed } : p));
  }, [session]);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    authError,
    signInWithGoogle,
    signOut,
    updateDisplayName,
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
