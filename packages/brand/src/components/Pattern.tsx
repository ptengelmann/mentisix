'use client';

import { type HTMLAttributes, useEffect, useRef } from 'react';
import { type PatternKind, type PatternOptions, initPattern } from '../patterns.js';

export type PatternProps = Omit<HTMLAttributes<HTMLCanvasElement>, 'children'> & {
  kind: PatternKind;
  options?: PatternOptions;
};

/**
 * Mentisix generative pattern — React canvas wrapper.
 *
 * Mounts a `<canvas>` and runs `initPattern` against it. The canvas fills its
 * container, so wrap it in a positioned/sized element.
 */
export function Pattern({ kind, options, ...rest }: PatternProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stop = initPattern(canvas, kind, options);
    return stop;
  }, [kind, options]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      {...rest}
    />
  );
}
