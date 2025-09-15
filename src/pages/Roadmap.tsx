import React from 'react';
import { css } from '@emotion/react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

const pageStyles = css`
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-6) var(--layout-gutter);

  h1 {
    font-size: var(--font-size-h2);
    margin: 0 0 var(--space-2) 0;
  }

  .subtitle {
    color: var(--color-neutral-600);
    margin-bottom: var(--space-6);
  }

  .section {
    margin-bottom: var(--space-8);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--space-4);
  }

  .card {
    border: 1px solid var(--color-neutral-200);
    border-radius: var(--radius-medium);
    padding: var(--space-4);
    background: var(--color-neutral-0);
  }

  ul {
    padding-left: var(--space-4);
    margin: 0;
  }
`;

export const Roadmap: React.FC = () => {
  return (
    <div css={pageStyles}>
      <h1>Project Roadmap</h1>
      <p className="subtitle">High-level milestones and near-term implementation plan.</p>

      <div className="section">
        <h2>Current Focus</h2>
        <div className="grid">
          <div className="card">
            <h3>Collections Migration</h3>
            <ul>
              <li>Vite + Express routes wired to Firestore Admin</li>
              <li>RBAC access (super_admin, coach, creator)</li>
              <li>Add-to-Collections modal with URL import</li>
              <li>Create Collection modal (title/description)</li>
            </ul>
          </div>
          <div className="card">
            <h3>Stability & Auth</h3>
            <ul>
              <li>Firebase Admin init fixed for ESM</li>
              <li>Client uses Firebase Auth for uid</li>
              <li>Compat route for legacy collections API</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="section">
        <h2>Next Up (1–2 weeks)</h2>
        <ul>
          <li>Wire Create Collection button to auto-open new collection detail</li>
          <li>Add “Add to Collections” button to collection detail header</li>
          <li>Video pagination (limit + cursor) on backend and UI</li>
          <li>Harden RBAC checks on write actions (move/copy/delete)</li>
          <li>Consistent error handling and toast notifications</li>
        </ul>
      </div>

      <div className="section">
        <h2>Near Term (2–4 weeks)</h2>
        <ul>
          <li>Integrate video processing pipeline for thumbnails/metadata</li>
          <li>Batch operations in VideoGrid (move/copy/delete)</li>
          <li>Unit and integration tests for collections routes/services</li>
          <li>Telemetry: basic route timing and error metrics</li>
        </ul>
      </div>

      <div className="section">
        <h2>Later (4–8 weeks)</h2>
        <ul>
          <li>Role-aware admin panels for managing users and collections</li>
          <li>Advanced search and filtering for videos</li>
          <li>Export/import collections</li>
          <li>Performance passes on large libraries</li>
        </ul>
      </div>

      <div className="section">
        <h2>Key References</h2>
        <div className="grid">
          <div className="card">
            <h3>Docs</h3>
            <ul>
              <li><a href="/roadmap">Roadmap (this page)</a></li>
              <li><a href="/docs/ROADMAP.md" target="_blank" rel="noreferrer">docs/ROADMAP.md</a></li>
              <li><a href="/docs/GEN_C_ALPHA_DOCUMENTATION.md" target="_blank" rel="noreferrer">GEN_C_ALPHA_DOCUMENTATION.md</a></li>
              <li><a href="/docs/DEVELOPMENT_GUIDE.md" target="_blank" rel="noreferrer">DEVELOPMENT_GUIDE.md</a></li>
            </ul>
          </div>
          <div className="card">
            <h3>Core Files</h3>
            <ul>
              <li><code>src/api-routes/collections.js</code> (Express routes)</li>
              <li><code>src/core/auth/rbac-client.ts</code> (client API)</li>
              <li><code>src/pages/Collections.tsx</code> (UI + modals)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roadmap;

