# Collections Modal Debugging and E2E Guide

This guide explains the debug logging added to the `/collections` page and how to run a Puppeteer test that verifies the “Create Collection” and “Add to Collections” modals open and close reliably.

## What’s instrumented

- Component logger: Uses `useDebugger('Collections')` at DEBUG level.
- Modal lifecycle logs:
  - Opening handlers: `handleCreateCollection`, `handleImportVideos`.
  - State transitions: `activeModal` changes logged.
  - Safe close: `safeCloseModal` logs the modal being closed.
  - Add action: Logs the collection id, URL, and inferred platform after a successful add.
- Focus management: Inputs are autofocused on open to avoid aria-hidden focus conflicts.

## Local auth bypass for E2E

Protected routes require authentication. For local E2E we enable a dev-only bypass:

- Env var: set `VITE_BYPASS_AUTH=1` (optional), or
- Local storage flag: `localStorage.setItem('bypassAuth', '1')`.

Our Puppeteer test uses the local storage flag and also sets `localStorage.userId` for the collections page to proceed with API calls.

Note: The bypass is respected only in the browser; it is gated so it does not impact production builds.

## Running the E2E test

1. Start the dev server in a terminal:
   - `npm run dev`
   - Confirm the app is serving on `http://localhost:3000`.

2. In another terminal, run the Puppeteer test:
   - `npm run test:e2e:collections`
   - Optional: run headed for visual inspection: `HEADLESS=false npm run test:e2e:collections`

What the test does:
- Navigates to `/collections` with the local auth bypass set.
- Opens the “Add to Collections” modal and asserts it stays open (no flicker).
- Closes via Cancel and confirms the dialog is gone.
- Opens the “Create Collection” modal.
- Double-clicks “Add to Collections” to ensure only one dialog is present and it’s the Add dialog.
- Types a sample URL and cancels.

## Expected console output

During interactions, you should see logs similar to:
- `Collections … handleImportVideos called …`
- `Collections … activeModal changed { activeModal: 'add' }`
- `Collections … Closing modal …`
- `Collections … Video added to collection …` (only after a successful add)

If anything fails, the test exits non‑zero and prints a diagnostic message.

## Troubleshooting

- If you see aria-hidden focus warnings, ensure the app is running in dev and you’re not blocking the `menuPortalTarget` for Select components.
- If the test times out on route navigation, confirm the dev server is running at `http://localhost:3000` and adjust `APP_URL` if needed (e.g., `APP_URL=http://127.0.0.1:3000`).
- To increase verbosity, set the debugger’s level to TRACE in code if deeper traces are required.

