'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface DirectoryUser {
  id: string;
  display_name: string;
  email: string;
}

/** 招待先の予測変換用: 登録済みユーザー一覧（表示名・メールアドレス） */
export function useUserDirectory(enabled: boolean) {
  const [users, setUsers] = useState<DirectoryUser[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    supabase
      .from('profiles')
      .select('id, display_name, email')
      .not('email', 'is', null)
      .then(({ data }) => {
        if (cancelled || !data) return;
        setUsers(data as DirectoryUser[]);
      });
    return () => { cancelled = true; };
  }, [enabled]);

  return users;
}
