declare module '../../../../src/services/notes/notes-service' {
  import type { Firestore } from 'firebase-admin/firestore';

  export interface NoteRecord {
    id: string;
    [key: string]: unknown;
  }

  export class NotesService {
    constructor(db: Firestore);
    listNotes(uid: string): Promise<NoteRecord[]>;
    createNote(uid: string, payload: Record<string, unknown>): Promise<NoteRecord>;
    getNoteById(uid: string, noteId: string): Promise<NoteRecord | null>;
    updateNote(uid: string, noteId: string, payload: Record<string, unknown>): Promise<NoteRecord>;
    deleteNote(uid: string, noteId: string): Promise<void>;
  }

  export class NotesServiceError extends Error {
    statusCode: number;
  }

  export function getNotesService(db: Firestore): NotesService;
}
