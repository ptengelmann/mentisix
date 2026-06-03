import { mentisixTheme } from '@mentisix/brand/tailwind';
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/brand/src/**/*.{ts,tsx}',
  ],
  theme: mentisixTheme as unknown as Config['theme'],
  plugins: [],
};

export default config;
