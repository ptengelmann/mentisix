import type { HTMLAttributes, ReactNode } from 'react';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
};

export function Card({ title, meta, className, children, ...rest }: CardProps) {
  const classes = ['mx-card', className].filter(Boolean).join(' ');
  return (
    <div className={classes} {...rest}>
      {title || meta ? (
        <div className="mx-card__head">
          {title ? <span className="mx-card__title">{title}</span> : <span />}
          {meta ? <span className="mx-card__title">{meta}</span> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
