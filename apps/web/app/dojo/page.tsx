import { Kicker } from '@mentisix/ui';
import { Nav } from '../../components/Nav';
import { RunViewer } from '../../components/RunViewer';

export default function DojoPage() {
  return (
    <>
      <Nav />
      <main
        style={{
          minHeight: '100dvh',
          padding: 'clamp(112px, 14vh, 160px) clamp(20px, 5vw, 84px) 80px',
          maxWidth: 1240,
          margin: '0 auto',
        }}
      >
        <DojoHeader />
        <div style={{ marginTop: 56 }}>
          <RunViewer />
        </div>
      </main>
    </>
  );
}

function DojoHeader() {
  return (
    <div>
      <Kicker index="∞">Dojo</Kicker>
      <h1
        style={{
          fontSize: 'clamp(40px, 6vw, 64px)',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          margin: '14px 0 18px',
          color: 'var(--mx-bone)',
          lineHeight: 1.05,
        }}
      >
        Configure a run.
      </h1>
      <p
        style={{
          fontSize: 16.5,
          color: 'var(--mx-fog)',
          maxWidth: '60ch',
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        Pick a challenge, a runner, and an optional fine-tune. Hit start. The agent's reasoning
        streams live; the replay URL persists. No key required to watch the Solver.
      </p>
    </div>
  );
}

export const metadata = {
  title: 'Dojo · Mentisix',
  description: 'Drop an LLM agent into a cognition challenge. Configure, start, watch.',
};
