export interface MailingList {
  category: string;
  label: string;
  email: string;
}

export const MAILING_LISTS: MailingList[] = [
  { category: 'カレッジコミュニティ', label: 'カレッジ生', email: 'scholars@hlab.college' },
  { category: 'カレッジコミュニティ', label: 'チューター', email: 'tutors‐shimokita@hlab.college' },
  { category: 'カレッジコミュニティ', label: 'コーディネーター', email: 'coordinators‐shimokita@hlab.college' },
  { category: 'カレッジコミュニティ', label: 'HLABスタッフ', email: 'staff@h-lab.co' },
  { category: 'ハウス', label: 'ハウスA', email: 'house-a-shimokita@hlab.college' },
  { category: 'ハウス', label: 'ハウスB', email: 'house-b-shimokita@hlab.college' },
  { category: 'ハウス', label: 'ハウスC', email: 'house-c-shimokita@hlab.college' },
  { category: 'ハウス', label: 'ハウスD', email: 'house-d-shimokita@hlab.college' },
  { category: 'ハウス', label: 'ハウスE', email: 'house-e-shimokita@hlab.college' },
  { category: 'ハウス', label: 'ハウスF', email: 'house-f-shimokita@hlab.college' },
  { category: 'ハウス', label: 'ハウスG', email: 'house-g-shimokita@hlab.college' },
  { category: 'カレッジ委員会', label: 'CIC', email: 'incubator-capital-shimokita@hlab.college' },
  { category: 'カレッジ委員会', label: 'シモキタ連携', email: 'shimokita-collab-shimokita@hlab.college' },
  { category: 'カレッジ委員会', label: 'シーズンイベント', email: 'event-shimokita@hlab.college' },
  { category: 'カレッジ委員会', label: 'アラムナイマネジメント', email: 'alumni‐management-shimokita@hlab.college' },
  { category: 'カレッジ委員会', label: 'ウェルカム', email: 'welcome-shimokita@hlab.college' },
  { category: 'カレッジ委員会', label: '図書', email: 'books-shimokita@hlab.college' },
  { category: 'カレッジ委員会', label: 'タレント省', email: 'talent-shimokita@hlab.college' },
  { category: 'カレッジ委員会', label: 'Archive?', email: 'archive-shimokita@hlab.college' },
];
