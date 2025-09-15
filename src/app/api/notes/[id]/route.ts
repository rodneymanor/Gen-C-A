import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Note = {
  id: string;
  title: string;
  content: string;
  type: string;
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

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const notes = readNotes();
  const note = notes.find((n) => n.id === id);
  if (!note) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, note });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const notes = readNotes();
    const idx = notes.findIndex((n) => n.id === id);
    if (idx === -1) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    const updated: Note = {
      ...notes[idx],
      ...body,
      tags: Array.isArray(body.tags) ? body.tags.map(String) : notes[idx].tags,
      starred: typeof body.starred === "boolean" ? body.starred : notes[idx].starred,
      updatedAt: new Date().toISOString(),
    };
    notes[idx] = updated;
    writeNotes(notes);
    return NextResponse.json({ success: true, note: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const notes = readNotes();
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  notes.splice(idx, 1);
  writeNotes(notes);
  return NextResponse.json({ success: true });
}

