import clsx from 'clsx';

export function cn(...inputs: Array<string | number | false | null | undefined>): string {
  return clsx(...inputs);
}
