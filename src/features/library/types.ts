import type { ReactNode } from 'react';

export type ContentType = 'all' | 'scripts' | 'notes';

export type LibraryFilter = {
  key: ContentType;
  label: string;
  icon?: ReactNode;
};
