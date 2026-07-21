'use client';

import { AvailabilityView } from './AvailabilityView';

interface HimaViewProps {
  onToast: (msg: string) => void;
}

export function HimaView({ onToast }: HimaViewProps) {
  return (
    <div className="max-w-[720px] mx-auto px-4 pt-5 md:px-6">
      <h2 className="text-lg font-bold text-gray-900 mb-3">ひま</h2>
      <AvailabilityView onToast={onToast} />
    </div>
  );
}
