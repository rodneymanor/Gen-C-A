declare module '@/services/notes/notes-service.js' {
  export interface NoteRecord {
    id: string;
    title: string;
    content: string;
    type: string;
    tags: string[];
    starred?: boolean;
    userId?: string;
    createdAt: string;
    updatedAt: string;
    [key: string]: unknown;
  }

  export class NotesServiceError extends Error {
    constructor(message: string, statusCode?: number);
    statusCode: number;
  }

  export class NotesService {
    constructor(firestore: FirebaseFirestore.Firestore);
    listNotes(userId: string): Promise<NoteRecord[]>;
    createNote(userId: string, payload: Record<string, unknown>): Promise<NoteRecord>;
    getNoteById(userId: string, noteId: string): Promise<NoteRecord>;
    updateNote(userId: string, noteId: string, payload: Record<string, unknown>): Promise<NoteRecord>;
    deleteNote(userId: string, noteId: string): Promise<void>;
  }

  export function formatNoteDoc(doc: FirebaseFirestore.DocumentSnapshot): NoteRecord;
  export function fetchUserNotes(
    db: FirebaseFirestore.Firestore,
    uid: string
  ): Promise<NoteRecord[]>;
  export function persistNote(
    db: FirebaseFirestore.Firestore,
    uid: string,
    note: Record<string, unknown>
  ): Promise<NoteRecord>;
  export function resolveNoteDocRef(
    db: FirebaseFirestore.Firestore,
    uid: string,
    id: string
  ): Promise<FirebaseFirestore.DocumentReference | null>;
  export function findNoteById(
    db: FirebaseFirestore.Firestore,
    uid: string,
    id: string
  ): Promise<NoteRecord | null>;
  export function getNotesService(
    firestore: FirebaseFirestore.Firestore
  ): NotesService;
}
