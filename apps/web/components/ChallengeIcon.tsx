import type { ChallengeSlug } from '@mentisix/types';
import type { SVGAttributes } from 'react';

type IconProps = Omit<SVGAttributes<SVGSVGElement>, 'children'> & { size?: number };

/**
 * Bespoke icons for each challenge. Both built on the Mentisix lattice
 * grammar (the same 6x6 system that drives the logo, patterns, and
 * worlds). currentColor so they pick up fog or signal mint based on
 * selection state in the dojo.
 */
export function ChallengeIcon({
  challenge,
  size = 40,
  ...rest
}: { challenge: ChallengeSlug; size?: number } & IconProps) {
  if (challenge === 'memory-probe') return <MemoryProbeIcon size={size} {...rest} />;
  return <TreasureHuntIcon size={size} {...rest} />;
}

/**
 * Treasure Hunt: a small lattice with a traced agent path and a treasure
 * diamond at its end. Reads as "spatial planning on a grid."
 */
function TreasureHuntIcon({ size = 40, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="square"
      strokeLinejoin="miter"
      role="img"
      aria-label="Treasure Hunt"
      {...rest}
    >
      <title>Treasure Hunt</title>
      {/* lattice dots — subtle, scaled below current color */}
      <g opacity={0.18}>
        {[8, 16, 24, 32, 40].flatMap((y) =>
          [8, 16, 24, 32, 40].map((x) => (
            <circle key={`d-${x}-${y}`} cx={x} cy={y} r={0.7} fill="currentColor" stroke="none" />
          )),
        )}
      </g>
      {/* outer frame */}
      <rect x={4} y={4} width={40} height={40} stroke="currentColor" opacity={0.4} />
      {/* agent start dot */}
      <circle cx={8} cy={8} r={2.2} fill="currentColor" stroke="none" />
      {/* traced path */}
      <path
        d="M8 8 L8 24 L24 24 L24 40 L40 40"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
      {/* treasure diamond at the end */}
      <path d="M40 36 L44 40 L40 44 L36 40 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Memory Probe: six vertical bars representing turns; two bars lit
 * (the "tell" and the "ask") with a faint memory bridge between them.
 * Reads as "a sparse signal across a noisy timeline."
 */
function MemoryProbeIcon({ size = 40, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="square"
      strokeLinejoin="miter"
      role="img"
      aria-label="Memory Probe"
      {...rest}
    >
      <title>Memory Probe</title>
      {/* outer frame */}
      <rect x={4} y={4} width={40} height={40} stroke="currentColor" opacity={0.4} />
      {/* six turn bars, dim by default */}
      {[
        { x: 7, lit: false },
        { x: 13.8, lit: true },
        { x: 20.6, lit: false },
        { x: 27.4, lit: false },
        { x: 34.2, lit: true },
        { x: 41, lit: false },
      ].map(({ x, lit }) => (
        <line
          key={`bar-${x}`}
          x1={x}
          y1={11}
          x2={x}
          y2={37}
          stroke="currentColor"
          strokeWidth={lit ? 2.6 : 1.2}
          opacity={lit ? 1 : 0.32}
        />
      ))}
      {/* memory bridge: a faint dotted arc connecting the two lit bars */}
      <path
        d="M13.8 14 Q24 6, 34.2 14"
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="2 2.5"
        opacity={0.55}
      />
      {/* lit bar caps for emphasis */}
      <circle cx={13.8} cy={11} r={1.6} fill="currentColor" stroke="none" />
      <circle cx={34.2} cy={37} r={1.6} fill="currentColor" stroke="none" />
    </svg>
  );
}
