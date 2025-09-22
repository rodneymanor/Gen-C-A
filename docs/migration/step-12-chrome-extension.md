# Migration Step 12 – Chrome Extension Integration

## Current Coverage
- **Notes CRUD**: Express router (`apps/backend/src/routes/extension/notes.ts`) and Next handler (`api/chrome-extension/notes/route.ts`) now rely on `ChromeExtensionNotesService`.
- **Collections list/create + add-video**: Backend router uses `CollectionsAdminService` and the new `ChromeExtensionCollectionsService`; Next handler (`api/chrome-extension/collections/route.ts`) forwards to `/api/collections` with existing auth wrappers.
- **Content & Idea Inbox**: Backend router and legacy handlers now delegate to `ChromeExtensionInboxService`; Next routes forward requests to the unified backend.
- **YouTube Transcript**: Backend router and legacy handlers use `ChromeExtensionYouTubeService`; Next route forwards to the backend endpoint.
- **Creator follow shortcut**: `api/chrome-extension/creators/add/route.ts` proxies straight to `/api/creators/follow` in the unified backend.

```mermaid
flowchart LR
    subgraph extension-host[Chrome Extension Client]
        notesBtn[Notes Actions]
        collectionsBtn[Collections Dropdown]
        contentBtn[Save Content]
        ideaBtn[Idea Inbox]
        ytBtn[YouTube Transcript]
    end

    subgraph next-routes[Next.js API Routes]
        notesRoute[/api/chrome-extension/notes]
        collectionsRoute[/api/chrome-extension/collections]
        contentRoute[/api/chrome-extension/content-inbox]
        ideaRoute[/api/chrome-extension/idea-inbox/*]
        youtubeRoute[/api/chrome-extension/youtube-transcript]
    end

    subgraph backend[Unified Backend (apps/backend)]
        direction TB
        notesCtrl[extension/notes.ts]
        collectionsCtrl[extension/collections.ts]
        inboxCtrl[extension/inbox.ts]
        youtubeCtrl[extension/youtube.ts]

        subgraph services[Shared Services]
            notesSvc[ChromeExtensionNotesService]
            collectionsSvc[ChromeExtensionCollectionsService]
            inboxSvc[ChromeExtensionInboxService]
            youtubeSvc[ChromeExtensionYouTubeService]
            coreCollectionsSvc[CollectionsAdminService]
        end
    end

    subgraph data[Persistence]
        firestore[(Firestore)]
        jsonFallback[(JSON fallback files)]
    end

    notesBtn --> notesRoute
    collectionsBtn --> collectionsRoute
    contentBtn --> contentRoute
    ideaBtn --> ideaRoute
    ytBtn --> youtubeRoute

    notesRoute --> notesCtrl
    collectionsRoute --> collectionsCtrl
    contentRoute --> inboxCtrl
    ideaRoute --> inboxCtrl
    youtubeRoute --> youtubeCtrl

    notesCtrl --> notesSvc
    collectionsCtrl --> collectionsSvc
    collectionsSvc --> coreCollectionsSvc
    inboxCtrl --> inboxSvc
    youtubeCtrl --> youtubeSvc

    notesSvc --> firestore
    collectionsSvc --> firestore
    coreCollectionsSvc --> firestore
    inboxSvc --> firestore
    youtubeSvc --> firestore

    notesSvc -. fallback .-> jsonFallback
    collectionsSvc -. fallback .-> jsonFallback
    inboxSvc -. fallback .-> jsonFallback
    youtubeSvc -. fallback .-> jsonFallback
```

## Remaining Legacy Paths
- `src/api-routes/chrome-extension.js` still imports the legacy helpers for content/idea/youtube but now calls the shared services; the file remains only to satisfy catch-all imports until `api/[...path].ts`, `server.js`, and `server-vite.js` stop referencing it.
- Express routes under `apps/backend/src/routes/extension` are now thin wrappers around the shared services, but we still rely on the module to expose those helpers for the legacy dev servers.
- `ChromeExtensionService` (`src/services/chrome-extension/chrome-extension-service.js`) is partially implemented but unused; auth/helpers are duplicated across routers.

## Next Actions
1. Update `api/[...path].ts` and the legacy dev servers to call the new backend/Next handlers directly, then delete `src/api-routes/chrome-extension.js` once nothing imports it.
2. Unify auth + request parsing in one helper to remove duplication between Express and Next routes.
3. Add regression tests covering inbox and transcript flows via the new services before retiring the legacy path.
