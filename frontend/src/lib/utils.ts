/** yyyy-MM-dd 形式の日付キーを生成 */
export function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 分数を「X時間Y分」形式に変換 */
export function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}時間${m}分` : `${h}時間`;
  }
  return `${minutes}分`;
}

/** 残り時間を「X時間Y分後」形式に変換 */
export function formatCountdown(diffMs: number): string {
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hours > 0) return `${hours}時間${mins}分後`;
  return `${mins}分後`;
}

/** 残り時間を簡潔に表示（日/時間/分） */
export function formatTimeUntil(diffMs: number): string {
  if (diffMs <= 0) return '開催中';
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (days > 0) return `あと${days}日${hours > 0 ? `${hours}時間` : ''}`;
  if (hours > 0) return `あと${hours}時間${mins}分`;
  return `あと${mins}分`;
}

/** タイトルの【】内に指定キーワードが含まれるか */
export function isMandatoryEvent(title: string): boolean {
  const bracketMatch = title.match(/【([^】]+)】/g);
  if (!bracketMatch) return false;
  return bracketMatch.some(m => m.includes('全員') || m.includes('新入生'));
}

/** タイトルの【】内のテキストをすべて抽出して返す（なければnull） */
export function extractBracketLabels(title: string): string[] | null {
  const matches = title.match(/【([^】]+)】/g);
  if (!matches || matches.length === 0) return null;
  return matches.map(m => m.slice(1, -1));
}
