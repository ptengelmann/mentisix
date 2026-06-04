import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'default' | 'signal' | 'ghost';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  dot?: boolean;
  children: ReactNode;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  default: '',
  signal: 'mx-btn--signal',
  ghost: 'mx-btn--ghost',
};

export function Button({
  variant = 'default',
  dot = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = ['mx-btn', VARIANT_CLASS[variant], className].filter(Boolean).join(' ');
  return (
    <button type={type} className={classes} {...rest}>
      {dot ? <span className="mx-btn__dot" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
