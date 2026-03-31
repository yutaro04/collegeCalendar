'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, visible, onHide }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onHide, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white
        px-5 py-2.5 rounded-xl text-[13px] z-[999] whitespace-nowrap
        transition-all duration-300
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}
      `}
    >
      {message}
    </div>
  );
}
