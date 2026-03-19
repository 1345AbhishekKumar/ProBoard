export type Tag = {
  id: string;
  name: string;
  color: string;
};

export type Task = {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  dueDate?: string;
};

export type Note = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  content: string;
  color: string;
  z: number;
  updatedAt?: number;
  isPinned?: boolean;
  tags?: string[];
  summary?: string;
  tasks?: Task[];
  suggestions?: string[];
};

export type NoteTemplate = {
  id: string;
  name: string;
  content: string;
  color: string;
};

export type TrashItem = {
  data: Note;
  folder: string;
  date: string;
};

export const COLORS = {
  yellow: { bg: '#FEF3C7', border: '#FDE68A' },
  blue: { bg: '#DBEAFE', border: '#BFDBFE' },
  green: { bg: '#D1FAE5', border: '#A7F3D0' },
  red: { bg: '#FEE2E2', border: '#FECACA' },
  purple: { bg: '#F3E8FF', border: '#E9D5FF' },
  orange: { bg: '#FFEDD5', border: '#FED7AA' },
  pink: { bg: '#FCE7F3', border: '#FBCFE8' },
  slate: { bg: '#F1F5F9', border: '#E2E8F0' },
};

export type AppState = {
  folders: string[];
  currentFolder: string;
  notes: Record<string, Note[]>;
  templates: NoteTemplate[];
  trash: TrashItem[];
  selection: Set<string>;
  view: { x: number; y: number; zoom: number };
  tags: Tag[];
  viewMode: 'canvas' | 'grid';
  sortBy: 'manual' | 'recent' | 'oldest';
  activeFilters: {
    color: string;
    tags: string[];
    date: string;
  };
};
