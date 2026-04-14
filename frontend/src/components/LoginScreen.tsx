'use client';

import { useAuth } from '@/hooks/useAuth';

export function LoginScreen() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 gap-6">
      <div className="text-2xl font-bold text-gray-900">COLLEGE APP</div>
      <div className="text-sm text-gray-500 text-center">
        ゆる募やプロフィール機能を使うには<br />ログインが必要です
      </div>
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-full shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <GoogleIcon />
        <span className="text-sm font-semibold text-gray-700">Googleでログイン</span>
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 35.5 26.7 36.5 24 36.5c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.4 35.6 44 30.2 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
