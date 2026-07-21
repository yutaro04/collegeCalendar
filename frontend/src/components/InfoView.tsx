'use client';

import { useState, type ReactNode } from 'react';
import { INFO_SECTIONS } from '@/lib/collegeInfo';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

/** テキスト中のURLをリンクに変換（改行はwhitespace-pre-wrapで表示側に任せる） */
function linkify(text: string): ReactNode[] {
  return text.split(URL_REGEX).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--color-primary)] underline break-all"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function InfoView() {
  const [openTitle, setOpenTitle] = useState<string | null>(null);

  return (
    <div className="max-w-180 mx-auto px-4 pt-5 pb-4 md:px-6">
      <h2 className="text-lg font-bold text-gray-900 mb-3">各種情報</h2>
      <div className="flex flex-col gap-2">
        {INFO_SECTIONS.map(section => {
          const isOpen = openTitle === section.title;
          return (
            <div key={section.title} className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
              <button
                onClick={() => setOpenTitle(isOpen ? null : section.title)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3.5 bg-transparent border-none cursor-pointer text-left"
              >
                <span className="text-[13px] font-bold text-gray-800">{section.title}</span>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className={`shrink-0 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-4 pb-4 text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
                  {linkify(section.body)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
