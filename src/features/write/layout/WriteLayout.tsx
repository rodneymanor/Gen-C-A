import { css } from '@emotion/react'
import type { ReactNode } from 'react'

const layoutStyles = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
`

const headerStyles = css`
  text-align: center;
  margin-bottom: var(--space-8);

  h1 {
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-semibold);
    color: var(--color-neutral-800);
    margin: 0 0 var(--space-3) 0;
  }

  .header-subtitle {
    font-size: var(--font-size-body-large);
    color: var(--color-neutral-600);
    line-height: var(--line-height-relaxed);
    margin: 0;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
`

interface WriteLayoutProps {
  header?: ReactNode
  children: ReactNode
}

export const WriteLayout = ({ header, children }: WriteLayoutProps) => (
  <div css={layoutStyles}>
    {header ? <header css={headerStyles}>{header}</header> : null}
    {children}
  </div>
)

export const writeContentStyles = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
`
