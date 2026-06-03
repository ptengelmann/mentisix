import type { SVGAttributes } from 'react';
import { color } from '../tokens.js';

export type IconProps = Omit<SVGAttributes<SVGSVGElement>, 'children'> & {
  size?: number | string;
  title?: string;
};

const VIEW = '0 0 42 42';

export function AgentIcon({ size = 24, title = 'agent', ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={VIEW}
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={title}
      {...rest}
    >
      <title>{title}</title>
      <circle cx={21} cy={21} r={10} fill="none" stroke={color.signal} strokeWidth={2} />
      <circle cx={21} cy={21} r={3.2} fill={color.signal} />
    </svg>
  );
}

export function KeyIcon({ size = 24, title = 'key', ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={VIEW}
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={title}
      {...rest}
    >
      <title>{title}</title>
      <circle cx={14} cy={21} r={6} fill="none" stroke="currentColor" strokeWidth={2} />
      <path
        d="M20 21h12M28 21v6M32 21v4"
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function DoorIcon({ size = 24, title = 'door', ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={VIEW}
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={title}
      {...rest}
    >
      <title>{title}</title>
      <rect x={11} y={9} width={20} height={24} fill="none" stroke="currentColor" strokeWidth={2} />
      <path d="M11 9h20v24" stroke={color.signal} strokeWidth={2} fill="none" />
      <circle cx={26} cy={21} r={1.6} fill="currentColor" />
    </svg>
  );
}

export function TreasureIcon({ size = 24, title = 'treasure', ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={VIEW}
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={title}
      {...rest}
    >
      <title>{title}</title>
      <rect x={9} y={17} width={24} height={16} fill="none" stroke="currentColor" strokeWidth={2} />
      <path
        d="M9 17l4-6h16l4 6"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="miter"
      />
      <path d="M21 22v6" stroke={color.signal} strokeWidth={2} />
      <path d="M17 24h8" stroke={color.signal} strokeWidth={2} />
    </svg>
  );
}

export function WallIcon({ size = 24, title = 'wall', ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={VIEW}
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={title}
      {...rest}
    >
      <title>{title}</title>
      <path
        d="M7 14h28M7 28h28M14 14v-6M28 14v-6M11 28v-14M25 28v-14M18 34v-6"
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function FogIcon({ size = 24, title = 'fog', ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={VIEW}
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={title}
      {...rest}
    >
      <title>{title}</title>
      <rect x={7} y={7} width={28} height={28} fill="none" stroke={color.line} strokeWidth={2} />
      <path d="M7 7l28 28M7 21l14 14M21 7l14 14M7 35L35 7" stroke="#2A3340" strokeWidth={1.4} />
    </svg>
  );
}

export function MoveIcon({ size = 24, title = 'move', ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={VIEW}
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={title}
      {...rest}
    >
      <title>{title}</title>
      <path
        d="M21 7v28M21 7l-5 5M21 7l5 5M21 35l-5-5M21 35l5-5M7 21h28M7 21l5-5M7 21l5 5M35 21l-5-5M35 21l-5 5"
        stroke={color.signal}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function SeedIcon({ size = 24, title = 'seed', ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={VIEW}
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={title}
      {...rest}
    >
      <title>{title}</title>
      <rect x={9} y={9} width={8} height={8} fill={color.signal} />
      <rect x={25} y={9} width={8} height={8} fill="none" stroke="currentColor" strokeWidth={2} />
      <rect x={9} y={25} width={8} height={8} fill="none" stroke="currentColor" strokeWidth={2} />
      <rect x={25} y={25} width={8} height={8} fill="currentColor" />
    </svg>
  );
}

export function RunIcon({ size = 24, title = 'run', ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={VIEW}
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={title}
      {...rest}
    >
      <title>{title}</title>
      <path
        d="M13 9l20 12-20 12z"
        fill="none"
        stroke={color.signal}
        strokeWidth={2}
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function ScoreIcon({ size = 24, title = 'score', ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={VIEW}
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={title}
      {...rest}
    >
      <title>{title}</title>
      <path
        d="M9 31l6-8 5 4 6-11 7 6"
        fill="none"
        stroke={color.signal}
        strokeWidth={2}
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
      <path d="M9 33h26" stroke={color.line} strokeWidth={2} />
    </svg>
  );
}

export function TokenIcon({ size = 24, title = 'token', ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={VIEW}
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={title}
      {...rest}
    >
      <title>{title}</title>
      <circle cx={21} cy={21} r={11} fill="none" stroke="currentColor" strokeWidth={2} />
      <path
        d="M21 15v12M17 18h6a2.5 2.5 0 010 5h-6h7"
        stroke={color.signal}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function ReplayIcon({ size = 24, title = 'replay', ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={VIEW}
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={title}
      {...rest}
    >
      <title>{title}</title>
      <path d="M31 21a10 10 0 11-3-7" fill="none" stroke="currentColor" strokeWidth={2} />
      <path
        d="M28 8v6h-6"
        stroke={color.signal}
        strokeWidth={2}
        fill="none"
        strokeLinecap="square"
      />
    </svg>
  );
}

export const Icons = {
  Agent: AgentIcon,
  Key: KeyIcon,
  Door: DoorIcon,
  Treasure: TreasureIcon,
  Wall: WallIcon,
  Fog: FogIcon,
  Move: MoveIcon,
  Seed: SeedIcon,
  Run: RunIcon,
  Score: ScoreIcon,
  Token: TokenIcon,
  Replay: ReplayIcon,
} as const;

export type IconName = keyof typeof Icons;
