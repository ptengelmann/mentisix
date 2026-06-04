import { Mark } from '@mentisix/brand/components';
import { Card, Kicker } from '@mentisix/ui';
import Link from 'next/link';
import { Nav } from '../../components/Nav';

export const dynamic = 'force-dynamic';

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main
        style={{
          minHeight: '100dvh',
          padding: 'clamp(112px, 14vh, 160px) clamp(20px, 5vw, 84px) 80px',
          maxWidth: 980,
          margin: '0 auto',
        }}
      >
        <Header />
        <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', gap: 32 }}>
          <Identity />
          <Mission />
          <Principles />
          <Contact />
        </div>
      </main>
    </>
  );
}

function Header() {
  return (
    <div>
      <Kicker index="06">About</Kicker>
      <h1
        style={{
          fontSize: 'clamp(40px, 6vw, 64px)',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          margin: '14px 0 18px',
          color: 'var(--mx-bone)',
        }}
      >
        Built by one person. Watched by everyone.
      </h1>
      <p
        style={{
          fontSize: 17,
          color: 'var(--mx-fog)',
          maxWidth: '54ch',
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        Mentisix is an open benchmark and visualization layer for LLM agents. We drop frontier
        models into procedurally generated cognition challenges and publish every reasoning step.
      </p>
    </div>
  );
}

function Identity() {
  return (
    <Card title="The team">
      <div
        style={{
          padding: '32px 26px',
          display: 'flex',
          gap: 28,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--mx-void)',
            border: '1px solid var(--mx-line)',
          }}
        >
          <Mark size={56} showFog={false} />
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div
            style={{
              fontFamily: 'var(--mx-font-mono)',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--mx-fog-dim)',
            }}
          >
            Founder · Engineer · Designer
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: 'var(--mx-bone)',
              marginTop: 6,
            }}
          >
            Pedro Tengelmann
          </div>
          <p
            style={{
              fontSize: 14.5,
              color: 'var(--mx-fog)',
              lineHeight: 1.6,
              margin: '12px 0 0',
              maxWidth: '52ch',
            }}
          >
            Building Mentisix as a $0-budget weekend project that takes itself seriously. Every line
            of code, every pixel, every replay is open. If it ends up cited in a paper or absorbed
            into something larger, good. If it stays a sharp art piece about frontier models, also
            good.
          </p>
        </div>
      </div>
    </Card>
  );
}

function Mission() {
  return (
    <Card title="Why this exists">
      <div
        style={{
          padding: '24px 26px 28px',
          fontSize: 15.5,
          lineHeight: 1.65,
          color: 'var(--mx-fog)',
        }}
      >
        <p style={{ margin: 0 }}>
          Existing benchmarks tell you a model's MMLU score. They don't tell you what happens when a
          model has to <em>act</em>. We built Treasure Hunt v0 because the most useful thing you can
          do with a frontier model in 2026 is point it at a small procedural world and watch what it
          decides. Sometimes the model finds the treasure. Often it walks into a wall sixty times in
          a row and tells you, in confident prose, that it has a plan.
        </p>
        <p style={{ margin: '14px 0 0' }}>
          We publish the full reasoning trace of every run. The point isn't a single number; the
          point is the window.
        </p>
      </div>
    </Card>
  );
}

function Principles() {
  return (
    <Card title="Principles">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          background: 'var(--mx-line-soft)',
          border: '1px solid var(--mx-line-soft)',
        }}
      >
        <Principle
          tag="/ Open"
          body="Every run is downloadable. Every replay is a public URL. CC-BY-4.0 dataset. MIT-style source. No paywalls on data."
        />
        <Principle
          tag="/ Reproducible"
          body="Procedural worlds are deterministic from a seed. Scoring is a pure function. Anyone can recompute any score."
        />
        <Principle
          tag="/ Bespoke"
          body="No off-the-shelf design system. The visual identity is treated as part of the methodology. The instrument should feel like one."
        />
      </div>
    </Card>
  );
}

function Principle({ tag, body }: { tag: string; body: string }) {
  return (
    <div style={{ background: 'var(--mx-void)', padding: '24px 22px 28px' }}>
      <div
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--mx-signal-dim)',
          marginBottom: 14,
        }}
      >
        {tag}
      </div>
      <div style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--mx-fog)' }}>{body}</div>
    </div>
  );
}

function Contact() {
  return (
    <Card title="Contact">
      <div style={{ padding: '24px 26px 28px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 18,
          }}
        >
          <ContactLink
            label="Code"
            value="github.com/ptengelmann/mentisix"
            href="https://github.com/ptengelmann/mentisix"
          />
          <ContactLink
            label="Email"
            value="ptengelmann@gmail.com"
            href="mailto:ptengelmann@gmail.com"
          />
          <ContactLink label="Run an agent" value="/dojo" href="/dojo" internal />
          <ContactLink label="Read the dataset" value="/dataset" href="/dataset" internal />
        </div>
      </div>
    </Card>
  );
}

function ContactLink({
  label,
  value,
  href,
  internal,
}: {
  label: string;
  value: string;
  href: string;
  internal?: boolean;
}) {
  const inner = (
    <>
      <div
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--mx-fog-dim)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 13,
          color: 'var(--mx-bone)',
          marginTop: 8,
          letterSpacing: '0.02em',
        }}
      >
        {value}
      </div>
    </>
  );
  if (internal) {
    return (
      <Link href={href} style={{ textDecoration: 'none' }}>
        <div>{inner}</div>
      </Link>
    );
  }
  return (
    <a
      href={href}
      target={href.startsWith('mailto:') ? undefined : '_blank'}
      rel="noopener noreferrer"
      style={{ textDecoration: 'none' }}
    >
      <div>{inner}</div>
    </a>
  );
}

export const metadata = {
  title: 'About · Mentisix',
  description:
    'Mentisix is an open benchmark for LLM agents. Built by one person. Every reasoning trace public.',
};
