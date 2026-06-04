import { type InputHTMLAttributes, forwardRef } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...rest },
  ref,
) {
  const classes = ['mx-input', className].filter(Boolean).join(' ');
  return <input ref={ref} className={classes} {...rest} />;
});
