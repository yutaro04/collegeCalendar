export type MachineType = 'washer-s' | 'washer-a' | 'dryer';
export type MachineStatus = 'available' | 'active' | 'finished' | 'error' | 'outOfOrder';

export interface Machine {
  id: string;
  type: MachineType;
  label: string;
  status: MachineStatus;
  remainingMin?: number;
  comment?: string;
  gender: 'male' | 'female';
}

export const STATUS_LABEL: Record<MachineStatus, string> = {
  available: '空き',
  active: '使用中',
  finished: '完了',
  error: 'エラー',
  outOfOrder: '使用不可',
};

/** GAS APIレスポンスの1行 */
export interface LaundryApiRow {
  id: string;
  status: string;
  finishedAt: string;
  comment: string;
}

/** IDからマシン情報を導出 */
function parseId(id: string): { gender: 'male' | 'female'; type: MachineType; label: string } {
  const gender = id.startsWith('women-') ? 'female' : 'male';
  if (id.includes('-washer-a')) return { gender, type: 'washer-a', label: '洗濯機 (A)' };
  if (id.includes('-washer-s')) return { gender, type: 'washer-s', label: '洗濯機 (S)' };
  return { gender, type: 'dryer', label: '乾燥機' };
}

/** APIレスポンスをMachine型に変換 */
export function parseApiRow(row: LaundryApiRow): Machine {
  const { gender, type, label } = parseId(row.id);

  let status: MachineStatus;
  const rawStatus = row.status?.toLowerCase?.() ?? 'available';

  if (rawStatus === 'active') {
    // finishedAtが過去なら finished に自動変換
    if (row.finishedAt && new Date(row.finishedAt).getTime() <= Date.now()) {
      status = 'finished';
    } else {
      status = 'active';
    }
  } else if (rawStatus === 'error') {
    status = 'error';
  } else if (rawStatus === 'outoforder') {
    status = 'outOfOrder';
  } else if (rawStatus === 'finished') {
    status = 'finished';
  } else {
    status = 'available';
  }

  let remainingMin: number | undefined;
  if (status === 'active' && row.finishedAt) {
    remainingMin = Math.max(0, Math.round((new Date(row.finishedAt).getTime() - Date.now()) / 60000));
  }

  return {
    id: row.id,
    type,
    label,
    status,
    remainingMin,
    comment: row.comment || undefined,
    gender,
  };
}

/** 洗濯機の稼働時間(分) */
export function getDurationMin(type: MachineType): number {
  return type === 'dryer' ? 90 : 60;
}

/** フロア配置 */
export interface FloorSlot {
  position: 'left' | 'right';
  machine: Machine;
}

const LEFT_WALL_ORDER: { prefix: string; position: 'left' | 'right' }[] = [
  { prefix: 'washer-s1', position: 'right' },
  { prefix: 'dryer-1',   position: 'left' },
  { prefix: 'washer-s2', position: 'right' },
  { prefix: 'dryer-2',   position: 'left' },
  { prefix: 'washer-s3', position: 'right' },
  { prefix: 'dryer-3',   position: 'left' },
  { prefix: 'washer-s4', position: 'right' },
  { prefix: 'dryer-4',   position: 'left' },
  { prefix: 'washer-s5', position: 'right' },
];

const RIGHT_WALL_ORDER: string[] = [
  'washer-a1', 'washer-a2', 'washer-a3', 'washer-a4',
  'washer-s6', 'washer-s7', 'washer-s8', 'washer-s9',
];

export function getLeftWall(machines: Machine[], gender: 'male' | 'female'): FloorSlot[] {
  const prefix = gender === 'female' ? 'women-' : 'men-';
  const map = new Map(machines.map(m => [m.id, m]));
  return LEFT_WALL_ORDER
    .map(slot => {
      const machine = map.get(prefix + slot.prefix);
      return machine ? { position: slot.position, machine } : null;
    })
    .filter((s): s is FloorSlot => s !== null);
}

export function getRightWall(machines: Machine[], gender: 'male' | 'female'): Machine[] {
  const prefix = gender === 'female' ? 'women-' : 'men-';
  const map = new Map(machines.map(m => [m.id, m]));
  return RIGHT_WALL_ORDER
    .map(id => map.get(prefix + id))
    .filter((m): m is Machine => m !== undefined);
}
