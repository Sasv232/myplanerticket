export interface Note {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  title?: string;
  content: string;
  color?: string;
  pinned?: boolean;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  color?: string;
  pinned?: boolean;
}
