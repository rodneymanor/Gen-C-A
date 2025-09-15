import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Note = {
  id: string;
  title: string;
  content: string;
  type: string; // e.g., "text"
  tags: string[];
  starred: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

const NOTES_FILE = path.join(process.cwd(), "data", "notes.json");

function ensureStore() {
  const dir = path.dirname(NOTES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(NOTES_FILE)) fs.writeFileSync(NOTES_FILE, JSON.stringify({ notes: [] }, null, 2));
}

function readNotes(): Note[] {
  ensureStore();
  try {
    const raw = fs.readFileSync(NOTES_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : Array.isArray(parsed.notes) ? parsed.notes : [];
  } catch {
    return [];
  }
}

function writeNotes(notes: Note[]) {
  ensureStore();
  fs.writeFileSync(NOTES_FILE, JSON.stringify({ notes }, null, 2));
}

function genId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET() {
  const notes = readNotes();
  return NextResponse.json({ success: true, notes });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const userId = "local"; // Optionally decode Authorization for real UID

    const note: Note = {
      id: genId(),
      title: (body.title || "Untitled").toString(),
      content: (body.content || "").toString(),
      type: (body.type || "text").toString(),
      tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
      starred: Boolean(body.starred),
      createdAt: now,
      updatedAt: now,
      userId,
    };

    const notes = readNotes();
    notes.unshift(note);
    writeNotes(notes);

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Invalid request" }, { status: 400 });
  }
}

