/**
 * Tiny SVG bar chart for findings posts. Horizontal bars, mono labels,
 * signal mint highlight on the leader. Server-renderable, no JS.
 */
export type BarChartDatum = {
  readonly label: string;
  /** Value in [0, max]. */
  readonly value: number;
  /** Optional sub-label rendered in mono after the value. */
  readonly suffix?: string;
};

export type BarChartProps = {
  readonly data: readonly BarChartDatum[];
  /** Domain cap. Bars are drawn at value / max. */
  readonly max?: number;
  /** Number suffix appended to each value. */
  readonly unit?: string;
  readonly caption?: string;
};

export function BarChart({ data, max, unit, caption }: BarChartProps) {
  const computedMax = max ?? Math.max(1, ...data.map((d) => d.value));
  const rowH = 36;
  const labelW = 180;
  const valueW = 76;
  const trackW = 520;
  const totalW = labelW + trackW + valueW + 20;
  const totalH = data.length * rowH + 20;

  return (
    <figure
      style={{
        margin: '28px 0',
        border: '1px solid var(--mx-line-soft)',
        background: 'var(--mx-void)',
        padding: '20px 22px 24px',
      }}
    >
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ maxWidth: totalW, display: 'block' }}
        role="img"
        aria-label={caption ?? 'Bar chart'}
      >
        {data.map((d, i) => {
          const y = i * rowH + 10;
          const w = (d.value / computedMax) * trackW;
          const isLeader = d.value === Math.max(...data.map((x) => x.value));
          return (
            <g key={d.label}>
              <text
                x={labelW - 12}
                y={y + rowH / 2 + 4}
                textAnchor="end"
                style={{
                  fontFamily: 'var(--mx-font-mono)',
                  fontSize: 12,
                  fill: 'var(--mx-fog)',
                  letterSpacing: '0.04em',
                }}
              >
                {d.label}
              </text>
              <rect
                x={labelW}
                y={y + 9}
                width={trackW}
                height={rowH - 18}
                fill="#11141A"
                stroke="var(--mx-line-soft)"
                strokeWidth={0.5}
              />
              <rect
                x={labelW}
                y={y + 9}
                width={w}
                height={rowH - 18}
                fill={isLeader ? 'var(--mx-signal)' : 'var(--mx-fog)'}
                opacity={isLeader ? 0.95 : 0.5}
              />
              <text
                x={labelW + trackW + 12}
                y={y + rowH / 2 + 4}
                style={{
                  fontFamily: 'var(--mx-font-mono)',
                  fontSize: 12,
                  fill: isLeader ? 'var(--mx-signal)' : 'var(--mx-bone)',
                  letterSpacing: '0.04em',
                }}
              >
                {d.value}
                {unit ?? ''}
                {d.suffix ? ` ${d.suffix}` : ''}
              </text>
            </g>
          );
        })}
      </svg>
      {caption ? (
        <figcaption
          style={{
            marginTop: 14,
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 10.5,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--mx-fog-dim)',
          }}
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
