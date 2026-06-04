'use client';

import {
  type ChallengeSlug,
  type Difficulty,
  HANDLE_PATTERN,
  type ProviderId,
  type RunStartRequest,
} from '@mentisix/types';
import { Button, Input } from '@mentisix/ui';
import { useEffect, useState } from 'react';
import { ChallengeIcon } from './ChallengeIcon';
import { ProviderLogo } from './ProviderLogo';

const HANDLE_STORAGE_KEY = 'mx.handle';

const CHALLENGE_OPTIONS: {
  id: ChallengeSlug;
  label: string;
  tagline: string;
  blurb: string;
}[] = [
  {
    id: 'treasure-hunt',
    label: 'Treasure Hunt',
    tagline: 'Spatial reasoning · fog of war',
    blurb:
      'Drop into a procedurally generated grid world. Collect treasures, dodge walls, use keys.',
  },
  {
    id: 'memory-probe',
    label: 'Memory Probe',
    tagline: 'In-context recall under noise',
    blurb:
      'Receive a fact early. After a stretch of distractor turns, recall the value. One wrong answer ends the run.',
  },
];

const DIFFICULTY_BY_CHALLENGE: Record<
  ChallengeSlug,
  { id: Difficulty; label: string; description: string }[]
> = {
  'treasure-hunt': [
    { id: 'easy', label: 'Easy', description: '10×10 · 1 treasure' },
    { id: 'medium', label: 'Medium', description: '12×12 · 3 treasures · keys' },
    { id: 'hard', label: 'Hard', description: '16×16 · 5 treasures · 300 steps' },
  ],
  'memory-probe': [
    { id: 'easy', label: 'Easy', description: '1 fact · 20 turns' },
    { id: 'medium', label: 'Medium', description: '2 facts · 40 turns' },
    { id: 'hard', label: 'Hard', description: '3 facts · 80 turns' },
  ],
};

const PROVIDERS: { id: ProviderId; label: string; defaultModel: string; defaultDelay: number }[] = [
  { id: 'solver', label: 'Solver', defaultModel: 'solver-1', defaultDelay: 220 },
  { id: 'anthropic', label: 'Claude', defaultModel: 'claude-sonnet-4-6', defaultDelay: 0 },
  { id: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o', defaultDelay: 0 },
  { id: 'gemini', label: 'Gemini', defaultModel: 'gemini-2.5-flash', defaultDelay: 0 },
  { id: 'groq', label: 'Groq', defaultModel: 'llama-3.3-70b-versatile', defaultDelay: 0 },
  { id: 'openrouter', label: 'OpenRouter', defaultModel: 'x-ai/grok-3', defaultDelay: 0 },
  { id: 'mock', label: 'Mock', defaultModel: 'mock-1', defaultDelay: 100 },
];

const SPEEDS: { label: string; ms: number }[] = [
  { label: 'Real-time', ms: 0 },
  { label: 'Fast', ms: 80 },
  { label: 'Normal', ms: 220 },
  { label: 'Slow', ms: 500 },
];

export type RunSetupProps = {
  onStart: (req: RunStartRequest) => void;
  disabled?: boolean;
};

export function RunSetup({ onStart, disabled }: RunSetupProps) {
  const [challenge, setChallenge] = useState<ChallengeSlug>('treasure-hunt');
  const [provider, setProvider] = useState<ProviderId>('solver');
  const [model, setModel] = useState('solver-1');
  const [apiKey, setApiKey] = useState('');
  const [seed, setSeed] = useState('');
  const [stepDelayMs, setStepDelayMs] = useState(220);
  const [handle, setHandle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(HANDLE_STORAGE_KEY);
      if (saved && HANDLE_PATTERN.test(saved)) setHandle(saved);
    } catch {
      // localStorage blocked (private mode, etc.). Silently skip.
    }
  }, []);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedHandle = handle.trim().toLowerCase();
    const validHandle = HANDLE_PATTERN.test(trimmedHandle) ? trimmedHandle : '';
    if (validHandle) {
      try {
        window.localStorage.setItem(HANDLE_STORAGE_KEY, validHandle);
      } catch {
        // ignore
      }
    }
    const req: RunStartRequest = {
      challenge,
      difficulty,
      model: { provider, model: model.trim() || defaultFor(provider) },
      apiKey: apiKey.trim() || 'mock-key',
      options: { stepDelayMs },
      ...(seed.trim() ? { seed: Number.parseInt(seed.trim(), 10) } : {}),
      ...(validHandle ? { handle: validHandle } : {}),
    };
    onStart(req);
  };

  return (
    <form
      onSubmit={submit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 40,
        maxWidth: 920,
        width: '100%',
      }}
    >
      <SectionHeader
        index="01"
        title="Pick a challenge"
        sub="Two cognition tests. Same instrument."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {CHALLENGE_OPTIONS.map((c) => {
          const selected = challenge === c.id;
          return (
            <ChallengeCard
              key={c.id}
              option={c}
              selected={selected}
              difficulty={difficulty}
              difficulties={DIFFICULTY_BY_CHALLENGE[c.id]}
              onSelect={() => {
                setChallenge(c.id);
                if (c.id !== 'treasure-hunt' && provider === 'solver') {
                  setProvider('mock');
                  setModel('mock-1');
                  setStepDelayMs(100);
                }
              }}
              onPickDifficulty={(d) => {
                setChallenge(c.id);
                setDifficulty(d);
              }}
            />
          );
        })}
      </div>

      <SectionHeader
        index="02"
        title="Pick a runner"
        sub="One of seven providers. Your key stays in memory."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ProviderRow
          challenge={challenge}
          selected={provider}
          onSelect={(p) => {
            setProvider(p.id);
            setModel(p.defaultModel);
            setStepDelayMs(p.defaultDelay);
          }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          <LabeledField label="Model" hint="Provider-specific identifier">
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={defaultFor(provider)}
              autoComplete="off"
              spellCheck={false}
            />
          </LabeledField>

          <LabeledField label="API key" hint="Held in memory only · never persisted">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                provider === 'mock' || provider === 'solver'
                  ? 'not required'
                  : 'paste · never stored'
              }
              autoComplete="off"
              spellCheck={false}
            />
          </LabeledField>
        </div>
      </div>

      <SectionHeader
        index="03"
        title="Fine-tune"
        sub={advancedOpen ? 'Seed, handle, speed.' : 'Optional. Tap to expand.'}
        onClick={() => setAdvancedOpen((v) => !v)}
        toggle={advancedOpen ? 'open' : 'closed'}
      />

      {advancedOpen ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            <LabeledField label="Seed" hint="Random unless set · or roll one">
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <Input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="random"
                    autoComplete="off"
                  />
                </div>
                <DiceButton
                  onClick={() => setSeed(String(Math.floor(Math.random() * 2_147_483_647)))}
                />
              </div>
            </LabeledField>

            <LabeledField label="Handle" hint="Optional · a-z, 0-9, _ · 16 chars max">
              <Input
                value={handle}
                onChange={(e) =>
                  setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16))
                }
                placeholder="anonymous"
                autoComplete="off"
                spellCheck={false}
              />
            </LabeledField>
          </div>

          <LabeledField label="Speed" hint="Slows fast providers so the canvas can animate">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${SPEEDS.length}, 1fr)`,
                gap: 1,
                background: 'var(--mx-line-soft)',
                border: '1px solid var(--mx-line-soft)',
              }}
            >
              {SPEEDS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setStepDelayMs(s.ms)}
                  style={{
                    background: stepDelayMs === s.ms ? 'var(--mx-slate)' : 'var(--mx-void)',
                    border: 'none',
                    padding: '12px 8px',
                    color: stepDelayMs === s.ms ? 'var(--mx-signal)' : 'var(--mx-fog)',
                    fontFamily: 'var(--mx-font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition:
                      'color var(--mx-dur) var(--mx-ease), background var(--mx-dur) var(--mx-ease)',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </LabeledField>
        </div>
      ) : null}

      <RunSummary
        challenge={challenge}
        difficulty={difficulty}
        provider={provider}
        model={model}
        seed={seed}
        handle={handle}
        disabled={disabled}
      />
    </form>
  );
}

function SectionHeader({
  index,
  title,
  sub,
  onClick,
  toggle,
}: {
  index: string;
  title: string;
  sub?: string;
  onClick?: () => void;
  toggle?: 'open' | 'closed';
}) {
  const interactive = !!onClick;
  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 14,
        borderTop: '1px solid var(--mx-line-soft)',
        paddingTop: 22,
        cursor: interactive ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 11,
          color: 'var(--mx-signal-dim)',
          letterSpacing: '0.18em',
          width: 28,
        }}
      >
        / {index}
      </span>
      <span
        style={{
          fontSize: 20,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          color: 'var(--mx-bone)',
        }}
      >
        {title}
      </span>
      {sub ? (
        <span
          style={{
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: interactive ? 'var(--mx-signal)' : 'var(--mx-fog-dim)',
            marginLeft: 'auto',
          }}
        >
          {sub}
        </span>
      ) : null}
      {toggle ? (
        <span
          aria-hidden="true"
          style={{
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 14,
            color: 'var(--mx-signal)',
            marginLeft: 8,
            transition: 'transform var(--mx-dur) var(--mx-ease)',
            display: 'inline-block',
            transform: toggle === 'open' ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          ›
        </span>
      ) : null}
    </div>
  );
}

function ChallengeCard({
  option,
  selected,
  difficulty,
  difficulties,
  onSelect,
  onPickDifficulty,
}: {
  option: { id: ChallengeSlug; label: string; tagline: string; blurb: string };
  selected: boolean;
  difficulty: Difficulty;
  difficulties: { id: Difficulty; label: string; description: string }[];
  onSelect: () => void;
  onPickDifficulty: (d: Difficulty) => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        background: selected
          ? 'linear-gradient(var(--mx-slate), var(--mx-void))'
          : 'var(--mx-void)',
        border: `1px solid ${selected ? 'var(--mx-signal-dim)' : 'var(--mx-line)'}`,
        padding: '24px 22px 22px',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        position: 'relative',
        transition:
          'border-color var(--mx-dur) var(--mx-ease), background var(--mx-dur) var(--mx-ease)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <span style={{ color: selected ? 'var(--mx-signal)' : 'var(--mx-bone)' }}>
          <ChallengeIcon challenge={option.id} size={44} />
        </span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: selected ? 'var(--mx-signal)' : 'var(--mx-bone)',
            }}
          >
            {option.label}
          </div>
          <div
            style={{
              fontFamily: 'var(--mx-font-mono)',
              fontSize: 10.5,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--mx-fog-dim)',
              marginTop: 6,
            }}
          >
            {option.tagline}
          </div>
        </div>
        {selected ? (
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--mx-signal)',
              boxShadow: '0 0 12px var(--mx-signal)',
              marginTop: 4,
            }}
          />
        ) : null}
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.55,
          color: 'var(--mx-fog)',
        }}
      >
        {option.blurb}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${difficulties.length}, 1fr)`,
          gap: 1,
          background: 'var(--mx-line-soft)',
          border: '1px solid var(--mx-line-soft)',
        }}
        // Stop bubbling so picking a difficulty doesn't re-fire onSelect.
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {difficulties.map((d) => {
          const active = selected && difficulty === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onPickDifficulty(d.id)}
              style={{
                background: active ? 'var(--mx-slate)' : 'var(--mx-void)',
                border: 'none',
                padding: '10px 8px 12px',
                color: active ? 'var(--mx-signal)' : 'var(--mx-fog)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition:
                  'color var(--mx-dur) var(--mx-ease), background var(--mx-dur) var(--mx-ease)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--mx-font-mono)',
                  fontSize: 10.5,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                }}
              >
                {d.label}
              </span>
              <span
                style={{
                  fontFamily: 'var(--mx-font-mono)',
                  fontSize: 9.5,
                  letterSpacing: '0.04em',
                  color: 'var(--mx-fog-dim)',
                  textAlign: 'center',
                  lineHeight: 1.35,
                }}
              >
                {d.description}
              </span>
            </button>
          );
        })}
      </div>
    </button>
  );
}

function ProviderRow({
  challenge,
  selected,
  onSelect,
}: {
  challenge: ChallengeSlug;
  selected: ProviderId;
  onSelect: (p: (typeof PROVIDERS)[number]) => void;
}) {
  const available = availableProviders(challenge);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${available.length}, 1fr)`,
        gap: 1,
        background: 'var(--mx-line-soft)',
        border: '1px solid var(--mx-line-soft)',
      }}
    >
      {available.map((p) => {
        const active = selected === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p)}
            style={{
              background: active ? 'var(--mx-slate)' : 'var(--mx-void)',
              border: 'none',
              padding: '18px 8px 16px',
              color: active ? 'var(--mx-signal)' : 'var(--mx-fog)',
              fontFamily: 'var(--mx-font-mono)',
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              transition:
                'color var(--mx-dur) var(--mx-ease), background var(--mx-dur) var(--mx-ease)',
            }}
          >
            <ProviderLogo provider={p.id} size={24} />
            <span style={{ lineHeight: 1.2 }}>{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function RunSummary({
  challenge,
  difficulty,
  provider,
  model,
  seed,
  handle,
  disabled,
}: {
  challenge: ChallengeSlug;
  difficulty: Difficulty;
  provider: ProviderId;
  model: string;
  seed: string;
  handle: string;
  disabled?: boolean;
}) {
  const challengeLabel = CHALLENGE_OPTIONS.find((c) => c.id === challenge)?.label ?? challenge;
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 16,
        marginTop: 16,
        background: 'linear-gradient(to top, var(--mx-void), rgba(10,12,16,0.92))',
        border: '1px solid var(--mx-line)',
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 18,
        flexWrap: 'wrap',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 10.5,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--mx-fog-dim)',
          }}
        >
          / ready
        </div>
        <div
          style={{
            fontSize: 14,
            color: 'var(--mx-bone)',
            letterSpacing: '-0.01em',
          }}
        >
          <span style={{ color: 'var(--mx-signal)' }}>{challengeLabel}</span>{' '}
          <span style={{ color: 'var(--mx-fog)' }}>· {difficulty}</span>{' '}
          <span style={{ color: 'var(--mx-fog)' }}>· {model || provider}</span>
          {handle ? <span style={{ color: 'var(--mx-fog)' }}> · @{handle}</span> : null}
          {seed ? <span style={{ color: 'var(--mx-fog)' }}> · seed {seed}</span> : null}
        </div>
      </div>
      <Button type="submit" variant="signal" dot disabled={disabled}>
        {disabled ? 'Starting' : 'Start run'}
      </Button>
    </div>
  );
}

function LabeledField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--mx-fog)',
        }}
      >
        {label}
      </span>
      {children}
      {hint ? (
        <span
          style={{
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 10,
            letterSpacing: '0.06em',
            color: 'var(--mx-fog-dim)',
          }}
        >
          {hint}
        </span>
      ) : null}
    </div>
  );
}

function DiceButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Roll random seed"
      style={{
        width: 44,
        background: 'var(--mx-void)',
        border: '1px solid var(--mx-line)',
        color: 'var(--mx-fog)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'color var(--mx-dur) var(--mx-ease), border-color var(--mx-dur) var(--mx-ease)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--mx-signal)';
        e.currentTarget.style.borderColor = 'var(--mx-signal-dim)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--mx-fog)';
        e.currentTarget.style.borderColor = 'var(--mx-line)';
      }}
    >
      <DiceIcon />
    </button>
  );
}

function defaultFor(p: ProviderId): string {
  return PROVIDERS.find((x) => x.id === p)?.defaultModel ?? 'mock-1';
}

function availableProviders(c: ChallengeSlug) {
  // Solver is a BFS reference player that only knows Treasure Hunt;
  // hide it for other challenges.
  return c === 'treasure-hunt' ? PROVIDERS : PROVIDERS.filter((p) => p.id !== 'solver');
}

function DiceIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <title>Roll</title>
      <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="16" cy="8" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="8" cy="16" r="1" fill="currentColor" />
      <circle cx="16" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}
