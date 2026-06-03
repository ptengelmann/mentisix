import type { HTMLAttributes, ReactNode } from 'react';

export type KickerProps = HTMLAttributes<HTMLSpanElement> & {
  /** Two-digit index, e.g. "00", "01". Optional. */
  index?: string;
  children: ReactNode;
};

export function Kicker({ index, className, children, ...rest }: KickerProps) {
  const classes = ['mx-kicker', className].filter(Boolean).join(' ');
  return (
    <span className={classes} {...rest}>
      {index ? <span className="mx-kicker__idx">{index}</span> : null}
      {children}
    </span>
  );
}
