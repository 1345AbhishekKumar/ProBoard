export type Note = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  content: string;
  color: string;
  z: number;
};

export type TrashItem = {
  data: Note;
  folder: string;
  date: string;
};

export const COLORS = {
  yellow: { bg: '#fffbeb', border: '#fcd34d' },
  blue: { bg: '#eff6ff', border: '#bfdbfe' },
  green: { bg: '#f0fdf4', border: '#bbf7d0' },
  red: { bg: '#fef2f2', border: '#fecaca' },
  purple: { bg: '#faf5ff', border: '#e9d5ff' },
  orange: { bg: '#fff7ed', border: '#fed7aa' },
};

export type AppState = {
  folders: string[];
  currentFolder: string;
  notes: Record<string, Note[]>;
  trash: TrashItem[];
  selection: Set<string>;
  view: { x: number; y: number; zoom: number };
};
