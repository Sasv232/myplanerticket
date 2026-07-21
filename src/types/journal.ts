export interface JournalEntry {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  mood: string | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalInput {
  title?: string;
  content: string;
  mood?: string;
  pinned?: boolean;
}

export interface UpdateJournalInput {
  title?: string;
  content?: string;
  mood?: string;
  pinned?: boolean;
}
