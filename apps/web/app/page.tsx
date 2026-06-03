import { Mark, Pattern } from '@mentisix/brand/components';
import { Button, Card, Kicker, Tag } from '@mentisix/ui';

export default function HomePage() {
  return (
    <main style={{ position: 'relative', minHeight: '100dvh', overflow: 'hidden' }}>
      {/* low-contrast lattice texture, not noise */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.45,
          pointerEvents: 'none',
        }}
      >
        <Pattern kind="fog" />
      </div>

      {/* fade the canvas into void at the edges */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(120% 90% at 70% 30%, rgba(10,12,16,0) 30%, var(--mx-void) 78%)',
          pointerEvents: 'none',
        }}
      />

      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px clamp(20px, 5vw, 84px)',
          zIndex: 10,
          background: 'linear-gradient(var(--mx-void), rgba(10,12,16,0))',
          backdropFilter: 'blur(2px)',
        }}
      >
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 11 }}>
          <Mark size={24} showFog={false} />
          <span
            style={{
              fontWeight: 600,
              fontSize: 16,
              letterSpacing: '-0.01em',
            }}
          >
            Mentis<span style={{ color: 'var(--mx-signal)' }}>ix</span>
          </span>
        </a>
        <Button variant="signal" dot>
          Enter the dojo
        </Button>
      </nav>

      <section
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 1240,
          margin: '0 auto',
          padding: 'clamp(120px, 14vh, 180px) clamp(20px, 5vw, 84px) 0',
        }}
      >
        <div style={{ marginBottom: 34 }}>
          <Mark size={96} />
        </div>

        <h1
          style={{
            fontSize: 'clamp(58px, 12vw, 168px)',
            lineHeight: 0.86,
            letterSpacing: '-0.045em',
            fontWeight: 600,
            margin: 0,
            color: 'var(--mx-bone)',
          }}
        >
          MENTIS<span style={{ color: 'var(--mx-signal)' }}>IX</span>
        </h1>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '26px 56px',
            alignItems: 'flex-end',
            marginTop: 38,
            maxWidth: 980,
          }}
        >
          <p
            style={{
              fontSize: 'clamp(17px, 2vw, 22px)',
              maxWidth: '30ch',
              color: 'var(--mx-bone)',
              lineHeight: 1.35,
              margin: 0,
            }}
          >
            A proving ground for machine minds. We drop frontier models into{' '}
            <b style={{ color: 'var(--mx-signal)', fontWeight: 500 }}>
              grid-world cognition challenges
            </b>{' '}
            and rank how they think.
          </p>

          <div
            style={{
              fontFamily: 'var(--mx-font-mono)',
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--mx-fog)',
              lineHeight: 2,
            }}
          >
            Brand System v0.1
            <br />
            Issued 2026.06
            <br />
            Lattice / Signal / Fog
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 42, flexWrap: 'wrap' }}>
          <Button variant="signal" dot>
            Read the system
          </Button>
          <Button>See it applied</Button>
        </div>

        <div style={{ marginTop: 96, maxWidth: 720 }}>
          <Kicker index="07">In use</Kicker>
          <h2
            style={{
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              margin: '14px 0 28px',
            }}
          >
            The system, applied
          </h2>

          <Card title="Live run" meta={<Tag state="run">Streaming</Tag>}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 1,
                background: 'var(--mx-line-soft)',
              }}
            >
              <Stat label="Step / 200" value="047" highlight />
              <Stat label="Treasure" value="1·3" />
              <Stat label="Tokens" value="1.8k" />
              <Stat label="Wall-clock" value="512" suffix="ms" />
            </div>
          </Card>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 9,
              marginTop: 24,
              alignItems: 'center',
            }}
          >
            <Tag state="pass">Pass</Tag>
            <Tag state="run">Running</Tag>
            <Tag state="fail">Killed · cap</Tag>
            <Tag>Queued</Tag>
          </div>
        </div>
      </section>

      <footer
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '120px clamp(20px, 5vw, 84px) 56px',
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--mx-fog-dim)',
        }}
      >
        © 2026 Mentisix — General Sans · JetBrains Mono · #00E5B0
      </footer>
    </main>
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
          fontSize: 30,
          letterSpacing: '-0.01em',
          color: highlight ? 'var(--mx-signal)' : 'var(--mx-bone)',
        }}
      >
        {value}
        {suffix ? (
          <span style={{ fontSize: 14, color: 'var(--mx-fog)', marginLeft: 4 }}>{suffix}</span>
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
