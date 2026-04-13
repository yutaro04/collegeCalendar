export type BathroomType = 'shower' | 'bath';
export type BathroomStatus = 'available' | 'active' | 'outOfOrder';

export interface BathroomRoom {
  id: number;
  no: number;
  gender: 'men' | 'women';
  floor: number;
  type: BathroomType;
  status: BathroomStatus;
  comment: string;
}

export interface BathroomApiRow {
  id: number;
  no: number;
  gender: string;
  Floor: number;
  type: string;
  status: string;
  comment: string;
}

const STATUS_MAP: Record<string, BathroomStatus> = {
  available: 'available',
  active: 'active',
  outoforder: 'outOfOrder',
};

export function parseApiRow(row: BathroomApiRow): BathroomRoom {
  const rawStatus = String(row.status ?? 'available').toLowerCase();
  return {
    id: Number(row.id),
    no: Number(row.no),
    gender: row.gender === 'women' ? 'women' : 'men',
    floor: Number(row.Floor),
    type: row.type === 'bath' ? 'bath' : 'shower',
    status: STATUS_MAP[rawStatus] ?? 'available',
    comment: row.comment ?? '',
  };
}

export const STATUS_LABEL: Record<BathroomStatus, string> = {
  available: '空き',
  active: '使用中',
  outOfOrder: '使用不可',
};

export const TYPE_LABEL: Record<BathroomType, string> = {
  shower: 'シャワー',
  bath: 'バス',
};

export interface FloorGroup {
  floor: number;
  rooms: BathroomRoom[];
}

export function groupByFloor(rooms: BathroomRoom[], gender: 'men' | 'women'): FloorGroup[] {
  const filtered = rooms.filter(r => r.gender === gender);
  const map = new Map<number, BathroomRoom[]>();
  for (const r of filtered) {
    const arr = map.get(r.floor) ?? [];
    arr.push(r);
    map.set(r.floor, arr);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([floor, rooms]) => ({ floor, rooms }));
}
