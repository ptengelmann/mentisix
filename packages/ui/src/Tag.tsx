import type { HTMLAttributes, ReactNode } from 'react';

export type TagState = 'idle' | 'pass' | 'fail' | 'run';

export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  state?: TagState;
  children: ReactNode;
};

const STATE_CLASS: Record<TagState, string> = {
  idle: '',
  pass: 'mx-tag--pass',
  fail: 'mx-tag--fail',
  run: 'mx-tag--run',
};

export function Tag({ state = 'idle', className, children, ...rest }: TagProps) {
  const classes = ['mx-tag', STATE_CLASS[state], className].filter(Boolean).join(' ');
  return (
    <span className={classes} {...rest}>
      <span className="mx-tag__led" aria-hidden="true" />
      {children}
    </span>
  );
}
