import { createRequire } from 'module';
import type { Firestore } from 'firebase-admin/firestore';

const require = createRequire(import.meta.url);

interface NotesModule {
  NotesServiceError: {
    new (message: string, statusCode?: number): NotesServiceErrorInstance;
  };
  getNotesService: (db: Firestore) => NotesServiceInstance;
}

export interface NotesServiceInstance {
  listNotes(uid: string): Promise<unknown[]>;
  createNote(uid: string, payload: Record<string, unknown>): Promise<unknown>;
  getNoteById(uid: string, noteId: string): Promise<unknown>;
  updateNote(uid: string, noteId: string, payload: Record<string, unknown>): Promise<unknown>;
  deleteNote(uid: string, noteId: string): Promise<void>;
}

export interface NotesServiceErrorInstance extends Error {
  statusCode: number;
}

// Require the existing dashboard implementation. We cast to `NotesModule`
// to avoid TypeScript attempting to analyze the target file (it lives outside
// the backend package but is bundled at runtime via `includeFiles`).
const notesModule = require('../../../../src/services/notes/notes-service.js') as NotesModule;

export const NotesServiceError = notesModule.NotesServiceError;
export const getNotesService = notesModule.getNotesService;
