export type NoteRecord = Record<string, unknown> & {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
};
