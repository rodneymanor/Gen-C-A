# Hemingway Editor Visual Mockups & UI Wireframes

## Overview
This document provides visual mockups and wireframes for the Hemingway Editor interface, showing layout, component positioning, and user interaction flows.

---

## 1. Main Editor Layout (Standard Mode)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ [Title Editor Area]                                                     [×] Collapse    │
│ ┌─────────────────────────────────────────────────────────────────┐                    │
│ │ 📝 "Untitled Script" [✏️]                                       │                    │
│ └─────────────────────────────────────────────────────────────────┘                    │
├─────────────────────────────────────────────────────────┬───────────────────────────────┤
│                                                         │ ┌─────────────────────────┐   │
│                                                         │ │    📊 Analysis          │   │
│  ┌─────────────────────────────────────────────────┐   │ └─────────────────────────┘   │
│  │                                                 │   │                               │
│  │  Start writing your script...                  │   │ ┌─ Readability ─┐ ┌─ Writing ─┐ │
│  │                                                 │   │ │    Active     │ │  Inactive │ │
│  │  [Cursor here]                                  │   │ └───────────────┘ └───────────┘ │
│  │                                                 │   │                               │
│  │                                                 │   │ ┌─────────────────────────┐   │
│  │                                                 │   │ │  📍 Readability Score  │   │
│  │                                                 │   │ │                         │   │
│  │                                                 │   │ │        85.2            │   │
│  │                                                 │   │ │      [EASY]            │   │
│  │                                                 │   │ │   Grade Level: 6th     │   │
│  │                                                 │   │ └─────────────────────────┘   │
│  │                                                 │   │                               │
│  │                                                 │   │ ⚡ Quick Improvements        │
│  │                                                 │   │ • Shorten long sentences     │
│  │                                                 │   │ • Use simpler words          │
│  │                                                 │   │                               │
│  │                                                 │   │ [▼] Show 3 more suggestions  │
│  └─────────────────────────────────────────────────┘   │                               │
│                                                         │                               │
│                                                         │                               │
└─────────────────────────────────────────────────────────┴───────────────────────────────┘
│                                    Floating Toolbar                                     │
│ ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ [142 words] [1m 20s] │ [↶][↷] [✨AI▼] │ [⛶][💾][📥]                              │ │
│ └─────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## 2. Distraction-Free Mode

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                   [Exit Focus Mode]     │
│                                                                                         │
│                                                                                         │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                 │   │
│  │                                                                                 │   │
│  │                                                                                 │   │
│  │                                                                                 │   │
│  │                        Start writing your script...                           │   │
│  │                                                                                 │   │
│  │                               [Cursor here]                                    │   │
│  │                                                                                 │   │
│  │                                                                                 │   │
│  │                                                                                 │   │
│  │                                                                                 │   │
│  │                                                                                 │   │
│  │                                                                                 │   │
│  │                                                                                 │   │
│  │                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│                                                                                         │
│                                                                                         │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## 3. Sidebar Collapsed Mode

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ [Title Editor Area]                                            [📊 Stats] (Expand)      │
│ ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ 📝 "My Social Media Script" [✏️]                                                   │ │
│ └─────────────────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                 │   │
│  │  Did you know that 73% of people check their phones within one hour of         │   │
│  │  waking up? This isn't just a random statistic—it's a window into how         │   │
│  │  our modern world operates.                                                    │   │
│  │                                                                                 │   │
│  │  But here's the thing most people don't realize: your morning routine         │   │
│  │  sets the tone for your entire day. [Cursor here]                             │   │
│  │                                                                                 │   │
│  │                                                                                 │   │
│  │                                                                                 │   │
│  │                                                                                 │   │
│  │                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
│                                    Floating Toolbar                                     │
│ ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ [67 words] [25s] │ [↶][↷] [✨AI▼] │ [⛶][💾][📥]                                │ │
│ └─────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## 4. Floating Toolbar (Detailed View)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              📍 Floating Toolbar Components                             │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ ┌────────────┐ ┌─────────────────┐ ┌──────────────────┐ ┌──────────────────────┐   │ │
│ │ │  Stats     │ │   History       │ │   AI Actions     │ │   Utility Actions    │   │ │
│ │ │ ┌────────┐ │ │ ┌─────┐ ┌─────┐ │ │ ┌──────────────┐ │ │ ┌──┐┌──┐┌──┐        │   │ │
│ │ │ │67 words│ │ │ │ ↶   │ │  ↷  │ │ │ │   ✨ AI ▼   │ │ │ │⛶││💾││📥│        │   │ │
│ │ │ └────────┘ │ │ │Undo │ │Redo │ │ │ │              │ │ │ │  ││  ││  │        │   │ │
│ │ │  [25s]     │ │ └─────┘ └─────┘ │ │ └──────────────┘ │ │ └──┘└──┘└──┘        │   │ │
│ │ └────────────┘ └─────────────────┘ └──────────────────┘ └──────────────────────┘   │ │
│ └─────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

Action Tooltips:
⛶ = Focus Mode Toggle          💾 = Save Document
📥 = Export/Download            ↶↷ = Undo/Redo History
```

## 5. AI Actions Dropdown Menu

```
┌─────────────────────────────────────────┐
│           ✨ AI Quick Actions           │
├─────────────────────────────────────────┤
│                                         │
│ 📋 Copy                                 │
│    Copy text to clipboard               │
│                                         │
│ ✏️  Edit                                │
│    Open text in editor                  │
│                                         │
│ 👤 Humanize                            │
│    Make more conversational             │
│                                         │
│ ✂️  Shorten                             │
│    Reduce length, keep meaning          │
│                                         │
│ 🎭 Change Tone              ▶          │
│    Modify emotional tone                │
│    ┌─────────────────────────────────┐  │
│    │ Professional                    │  │
│    │ Formal business tone            │  │
│    ├─────────────────────────────────┤  │
│    │ Casual                          │  │
│    │ Relaxed informal tone           │  │
│    ├─────────────────────────────────┤  │
│    │ Friendly                        │  │
│    │ Warm approachable tone          │  │
│    ├─────────────────────────────────┤  │
│    │ Confident                       │  │
│    │ Assertive self-assured tone     │  │
│    ├─────────────────────────────────┤  │
│    │ Persuasive                      │  │
│    │ Compelling convincing tone      │  │
│    └─────────────────────────────────┘  │
│                                         │
│ 🔄 Remix                               │
│    Send to script workflow              │
│    (Context: Ideas/Notes only)          │
│                                         │
└─────────────────────────────────────────┘
```

## 6. Sidebar Analysis Panel (Detailed)

### Readability Tab Active
```
┌─────────────────────────────┐
│      📊 Analysis            │
│  [×] Collapse               │
├─────────────────────────────┤
│                             │
│ ┌─ Readability ─┐ ┌─Writing─┐│
│ │   [Active]    │ │ Inactive││
│ └───────────────┘ └─────────┘│
│                             │
│ ┌─────────────────────────┐ │
│ │  📍 Readability Score  │ │
│ │                         │ │
│ │        85.2            │ │
│ │      [EASY]            │ │
│ │   Grade Level: 6th     │ │
│ └─────────────────────────┘ │
│                             │
│ ⚡ Quick Improvements        │
│                             │
│ ┌─────────────────────────┐ │
│ │ • Break down this long  │ │
│ │   sentence for clarity  │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ • Replace "utilize" with│ │
│ │   "use" for simplicity  │ │
│ └─────────────────────────┘ │
│                             │
│ ┌───────────────────────┐   │
│ │ ▼ Show 3 more         │   │
│ │   suggestions         │   │
│ └───────────────────────┘   │
│                             │
│ [Expanded Suggestions:]     │
│ • Reduce passive voice      │
│ • Limit adverb usage        │
│ • Simplify technical terms  │
│                             │
└─────────────────────────────┘
```

### Writing Tab Active
```
┌─────────────────────────────┐
│      📊 Analysis            │
│  [×] Collapse               │
├─────────────────────────────┤
│                             │
│ ┌─Readability─┐ ┌─ Writing ─┐│
│ │  Inactive   │ │ [Active] ││
│ └─────────────┘ └───────────┘│
│                             │
│ ┌─────────────────────────┐ │
│ │      1m 42s            │ │
│ │   Reading Time          │ │
│ └─────────────────────────┘ │
│                             │
│ ┌───────────────────────┐   │
│ │ ▼ View detailed       │   │
│ │   statistics          │   │
│ └───────────────────────┘   │
│                             │
│ [Expanded Details:]         │
│                             │
│ ┌─────────────────────────┐ │
│ │        247             │ │
│ │       Words            │ │
│ └─────────────────────────┘ │
│                             │
│ ┌──────────┐ ┌──────────┐  │
│ │   1,432  │ │    18    │  │
│ │Characters│ │Sentences │  │
│ └──────────┘ └──────────┘  │
│                             │
│ ┌─────────────────────────┐ │
│ │         4              │ │
│ │     Paragraphs         │ │
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

## 7. Title Editing States

### View Mode
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ 📝 "5 Morning Habits That Changed My Life" ✏️ [← Hover shows edit icon]           │ │
│ └─────────────────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────────────┤
```

### Edit Mode
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ [5 Morning Habits That Changed My Life_______________] ✅ ❌                        │ │
│ │  ← Text Input Field                                   Save Cancel                   │ │
│ └─────────────────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                              📝 Press Enter to save, Esc to cancel                     │
```

## 8. Mobile/Responsive Layout

### Mobile View (Portrait)
```
┌─────────────────────────┐
│ "My Script" ✏️    [×]   │
├─────────────────────────┤
│                         │
│ ┌─────────────────────┐ │
│ │                     │ │
│ │ Start writing...    │ │
│ │                     │ │
│ │ [Cursor here]       │ │
│ │                     │ │
│ │                     │ │
│ │                     │ │
│ │                     │ │
│ │                     │ │
│ │                     │ │
│ │                     │ │
│ │                     │ │
│ │                     │ │
│ │                     │ │
│ └─────────────────────┘ │
│                         │
├─────────────────────────┤
│    Floating Toolbar     │
│ ┌─────────────────────┐ │
│ │[42w][30s]│[↶][↷][✨]│ │
│ │         │[⛶][💾][📥]│ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### Tablet View (Landscape)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ "Content Creation Script" ✏️                                      [×] Stats │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │ Creating engaging content isn't about having the perfect setup or       │ │
│ │ the most expensive equipment. It's about understanding your audience    │ │
│ │ and delivering value consistently.                                      │ │
│ │                                                                         │ │
│ │ [Cursor here]                                                          │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                           Floating Toolbar                                 │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [38 words] [14s] │ [↶][↷] [✨AI▼] │ [⛶][💾][📥]                      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 11. Error States & Feedback

### Content Validation Error
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ⚠️ Validation Error                                     │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│                            Please provide content for your note.                       │
│                                                                                         │
│                              [Try Again] [Dismiss]                                     │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### AI Action Loading
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ⟳ Processing with AI...                                │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                 │   │
│  │  Your content is being processed. This may take a few moments...              │   │
│  │                                                                                 │   │
│  │  [████████████████▒▒▒▒▒▒▒▒] 70%                                               │   │
│  │                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│                                  [Cancel Request]                                      │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Save Success Notification
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ✅ Content Saved Successfully!                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│                           Your script has been saved to Notes.                         │
│                             Redirecting in 3 seconds...                                │
│                                                                                         │
│                                  [Go to Notes Now]                                     │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy & Layout Structure

```
HemingwayEditor
├── Title Editor (conditional)
│   ├── Display Mode: Click-to-edit title
│   └── Edit Mode: Input field with save/cancel buttons
│
├── Main Content Area
│   └── HemingwayEditorWrapper
│       └── HemingwayEditorCore (lazy-loaded)
│           ├── Text Analysis Engine
│           ├── Syntax Highlighting
│           └── Real-time Feedback
│
├── Right Sidebar (collapsible)
│   ├── Tab Navigation
│   │   ├── Readability Tab
│   │   └── Writing Stats Tab
│   ├── Readability Analysis
│   │   ├── Score Display
│   │   ├── Level Badge
│   │   ├── Grade Level
│   │   └── Suggestions List
│   └── Writing Statistics
│       ├── Primary Metric (Reading Time)
│       └── Detailed Stats (expandable)
│
└── FloatingToolbar (bottom-positioned)
    ├── Statistics Section
    │   ├── Word Count Badge
    │   └── Reading Time Display
    ├── History Actions
    │   ├── Undo Button
    │   └── Redo Button
    ├── AI Actions Dropdown
    │   ├── Universal Actions
    │   └── Context-specific Actions
    └── Utility Actions
        ├── Focus Mode Toggle
        ├── Save Button
        └── Export Button
```

---

## Interaction Flows

### 1. AI Action Flow  
```
User clicks ✨AI → Dropdown menu opens → User selects action → 
API request with auth → Loading indicator → 
Text transformation → Replace content → Success toast
```

### 2. Title Editing Flow
```
User clicks title → Edit mode activated → Input field appears → 
User types → Press Enter/click ✅ → Save to state → 
Exit edit mode → Display updated title
```

### 3. Readability Analysis Flow
```
User types → Debounced text analysis → Calculate scores → 
Update sidebar → Generate suggestions → 
Highlight issues → Real-time feedback
```

This visual documentation provides a complete reference for implementing the Hemingway Editor interface in any application, showing exact layouts, component relationships, and user interaction patterns.