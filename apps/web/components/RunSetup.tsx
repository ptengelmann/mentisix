'use client';

import type { ProviderId, RunStartRequest } from '@mentisix/types';
import { Button, Input, Kicker } from '@mentisix/ui';
import { useState } from 'react';

const PROVIDERS: { id: ProviderId; label: string; defaultModel: string }[] = [
  { id: 'anthropic', label: 'Anthropic', defaultModel: 'claude-sonnet-4-6' },
  { id: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o' },
  { id: 'groq', label: 'Groq', defaultModel: 'llama-3.3-70b-versatile' },
  { id: 'mock', label: 'Mock (no key)', defaultModel: 'mock-1' },
];

export type RunSetupProps = {
  onStart: (req: RunStartRequest) => void;
  disabled?: boolean;
};

export function RunSetup({ onStart, disabled }: RunSetupProps) {
  const [provider, setProvider] = useState<ProviderId>('mock');
  const [model, setModel] = useState('mock-1');
  const [apiKey, setApiKey] = useState('');
  const [seed, setSeed] = useState('');

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const req: RunStartRequest = {
      challenge: 'treasure-hunt',
      model: { provider, model: model.trim() || defaultFor(provider) },
      apiKey: apiKey.trim() || 'mock-key',
      ...(seed.trim() ? { seed: Number.parseInt(seed.trim(), 10) } : {}),
    };
    onStart(req);
  };

  return (
    <form
      onSubmit={submit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        maxWidth: 560,
      }}
    >
      <div>
        <Kicker index="00">Configure</Kicker>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            margin: '14px 0 0',
          }}
        >
          Drop an agent on the grid
        </h2>
      </div>

      <Field label="Provider">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 1,
            background: 'var(--mx-line-soft)',
          }}
        >
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setProvider(p.id);
                setModel(p.defaultModel);
              }}
              style={{
                background: provider === p.id ? 'var(--mx-slate)' : 'var(--mx-void)',
                border: 'none',
                padding: '14px 12px',
                color: provider === p.id ? 'var(--mx-signal)' : 'var(--mx-fog)',
                fontFamily: 'var(--mx-font-mono)',
                fontSize: 11,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Model" hint="Provider-specific identifier">
        <Input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={defaultFor(provider)}
          autoComplete="off"
          spellCheck={false}
        />
      </Field>

      <Field label="API key" hint="Held in memory only · never persisted">
        <Input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={provider === 'mock' ? 'not required for mock' : 'sk-…'}
          autoComplete="off"
          spellCheck={false}
        />
      </Field>

      <Field label="Seed" hint="Leave blank for random">
        <Input
          inputMode="numeric"
          pattern="[0-9]*"
          value={seed}
          onChange={(e) => setSeed(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="random"
          autoComplete="off"
        />
      </Field>

      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
        <Button type="submit" variant="signal" dot disabled={disabled}>
          {disabled ? 'Starting' : 'Start run'}
        </Button>
      </div>
    </form>
  );
}

function Field({
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

function defaultFor(p: ProviderId): string {
  return PROVIDERS.find((x) => x.id === p)?.defaultModel ?? 'mock-1';
}
