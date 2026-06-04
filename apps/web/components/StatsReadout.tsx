'use client';

export type StatsReadoutProps = {
  step: number;
  maxSteps: number;
  treasuresCollected: number;
  treasuresTotal: number;
  tokensUsed: number;
  msUsed: number;
};

export function StatsReadout({
  step,
  maxSteps,
  treasuresCollected,
  treasuresTotal,
  tokensUsed,
  msUsed,
}: StatsReadoutProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1,
        background: 'var(--mx-line-soft)',
        border: '1px solid var(--mx-line)',
        borderRadius: 2,
      }}
    >
      <Stat label={`Step / ${maxSteps}`} value={String(step).padStart(3, '0')} highlight />
      <Stat label="Treasure" value={`${treasuresCollected}·${treasuresTotal}`} />
      <Stat label="Tokens" value={formatTokens(tokensUsed)} />
      <Stat label="Wall-clock" value={Math.round(msUsed).toString()} suffix="ms" />
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div style={{ background: 'var(--mx-void)', padding: '18px 16px' }}>
      <div
        className="mx-tabular"
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 28,
          letterSpacing: '-0.01em',
          color: highlight ? 'var(--mx-signal)' : 'var(--mx-bone)',
        }}
      >
        {value}
        {suffix ? (
          <span style={{ fontSize: 13, color: 'var(--mx-fog)', marginLeft: 4 }}>{suffix}</span>
        ) : null}
      </div>
      <div
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--mx-fog)',
          marginTop: 8,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function formatTokens(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(2)}M`;
}
