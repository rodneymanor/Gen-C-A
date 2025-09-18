import type { ReactNode } from 'react';

export type ContentType = 'all' | 'videos' | 'scripts' | 'notes' | 'ideas';

export type LibraryFilter = {
  key: ContentType;
  label: string;
  icon?: ReactNode;
};
