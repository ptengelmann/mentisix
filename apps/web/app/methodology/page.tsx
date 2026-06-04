import { Card, Kicker, Tag } from '@mentisix/ui';
import Link from 'next/link';
import { Nav } from '../../components/Nav';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function MethodologyPage() {
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
        <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', gap: 40 }}>
          <Section01 />
          <Section02 />
          <Section03 />
          <Section04 />
          <Section05 />
          <Section06 />
          <Section07 />
        </div>
      </main>
    </>
  );
}

function Header() {
  return (
    <div>
      <Kicker index="05">Methodology</Kicker>
      <h1
        style={{
          fontSize: 'clamp(40px, 6vw, 64px)',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          margin: '14px 0 18px',
          color: 'var(--mx-bone)',
        }}
      >
        How the benchmark works.
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
        Everything you need to reproduce, audit, or cite a Mentisix score. The simulator is pure
        TypeScript and deterministic from a seed. Every run we have ever recorded is downloadable
        from the{' '}
        <Link href="/dataset" style={{ color: 'var(--mx-signal)' }}>
          dataset
        </Link>
        .
      </p>
      <div style={{ marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Tag state="pass">Treasure Hunt v0</Tag>
        <Tag state="run">Deterministic</Tag>
        <Tag state="run">Open source</Tag>
      </div>
    </div>
  );
}

function Section01() {
  return (
    <Card title="01. The world">
      <Prose>
        <p>
          Treasure Hunt v0 is a 12×12 grid populated procedurally from a seed. Each cell is one of
          five kinds: floor, wall, treasure, key, or door. Doors come in two colors (red, blue);
          keys come in matching colors. The agent starts at the top-left walkable cell.
        </p>
        <p>The default configuration:</p>
        <Pre>{`{
  width: 12,
  height: 12,
  maxSteps: 200,
  treasures: 3,
  keys: 2,
  visionRadius: 3
}`}</Pre>
        <p>
          The agent has a 3×3 vision window centered on itself. Cells outside the window are unknown
          (the "fog of war"). Cells once observed remain known on the client side for rendering, but
          the agent's <em>observation payload</em> at any turn includes only the live 3×3 window
          plus its current position and inventory.
        </p>
      </Prose>
    </Card>
  );
}

function Section02() {
  return (
    <Card title="02. Procedural generation is deterministic">
      <Prose>
        <p>
          The seed maps to a unique world via a pure function. Same seed, same world, every time,
          across machines. The pipeline:
        </p>
        <ol>
          <li>
            <b>Layout.</b> Sprinkle walls at ~22% density on a fresh grid. Knock down walls
            bordering unreachable regions until every floor cell is reachable from the start corner.
          </li>
          <li>
            <b>Placement.</b> Pick the farthest reachable cells for treasures (mutually separated),
            mid-distance cells for keys, then doors gating the treasure regions that require them.
          </li>
          <li>
            <b>Verification.</b> A BFS over <code>(position, key-bitmask, treasure-bitmask)</code>{' '}
            confirms the world is solvable. If a placement fails verification the generator re-rolls
            with a fresh deterministic sub-seed. If 8 layouts × 8 placements all fail
            (extraordinarily rare), an error is thrown.
          </li>
        </ol>
        <p>
          All randomness flows through <code>makeRng(seed)</code> (mulberry32). The full procgen
          source lives in{' '}
          <a
            href="https://github.com/ptengelmann/mentisix/tree/main/packages/sim/src/procgen"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--mx-signal)' }}
          >
            packages/sim/src/procgen
          </a>{' '}
          and is covered by a 100-seed solvability test that runs in CI.
        </p>
      </Prose>
    </Card>
  );
}

function Section03() {
  return (
    <Card title="03. Action vocabulary">
      <Prose>
        <p>The agent picks exactly one of 14 action tokens per turn:</p>
        <Pre>{`move_north, move_south, move_east, move_west
pick_up
use_red_key_north, use_red_key_south, use_red_key_east, use_red_key_west
use_blue_key_north, use_blue_key_south, use_blue_key_east, use_blue_key_west
wait`}</Pre>
        <p>
          Movement into a wall, a closed door without the matching key, or off the grid is rejected
          and reported back to the agent on the next turn as a <code>blocked_*</code> outcome. The
          step still consumes the budget. Picking up an item only works on the agent's current cell;
          using a key only works on a closed door directly adjacent in the named direction. Flat
          enums round-trip cleanly through OpenAI strict JSON Schema, Anthropic tool_use, Gemini
          responseSchema, and Groq/OpenRouter json_object without discriminated-union footguns.
        </p>
      </Prose>
    </Card>
  );
}

function Section04() {
  return (
    <Card title="04. Scoring">
      <Prose>
        <p>
          The scoring formula is intentionally simple. Pass/fail dominates; efficiency breaks ties.
        </p>
        <Pre>{`function score(world) {
  if (world.status === 'won') {
    return 1000 + max(0, maxSteps - stepsUsed) * 5
  }
  return treasuresCollected * 250
}`}</Pre>
        <p>
          A clean run that finishes in 60 steps of a 200-step budget scores{' '}
          <b style={{ color: 'var(--mx-signal)' }}>1700</b>. A run that finishes at the buzzer
          scores <b style={{ color: 'var(--mx-signal)' }}>1000</b>. A failed run that collected two
          of three treasures scores <b>500</b>. A failed run with zero treasures scores <b>0</b>.
          The leaderboard ranks by best score per (provider, model); fewer steps breaks ties.
        </p>
        <p>
          The full source is{' '}
          <a
            href="https://github.com/ptengelmann/mentisix/blob/main/packages/sim/src/score.ts"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--mx-signal)' }}
          >
            packages/sim/src/score.ts
          </a>
          .
        </p>
      </Prose>
    </Card>
  );
}

function Section05() {
  return (
    <Card title="05. Reproduce any run">
      <Prose>
        <p>Every run has a public URL with the full event stream. Three ways to verify:</p>
        <ol>
          <li>
            Open <code>/runs/&lt;id&gt;</code> in the browser. The page replays the agent's
            decisions step by step from persisted JSON, with no API key required.
          </li>
          <li>
            Hit <code>GET /runs/&lt;id&gt;/replay</code> to fetch the same data programmatically.
            Pipe into your own analysis.
          </li>
          <li>
            Pull the full corpus from <code>GET /datasets/treasure-hunt/runs.jsonl</code> and
            recompute. The score function is a pure function of the final <code>WorldState</code>,
            so a row's stored score should equal the result of replaying the events into the
            simulator and calling <code>score()</code>.
          </li>
        </ol>
        <p>To reproduce a run from a seed locally:</p>
        <Pre>{`pnpm install
pnpm --filter @mentisix/sim build
node -e "
  import('@mentisix/sim').then(({ generate, step, score }) => {
    let world = generate({ seed: 4291 })
    // ... drive your agent's actions through step(world, action) ...
    console.log(score(world))
  })
"`}</Pre>
      </Prose>
    </Card>
  );
}

function Section06() {
  return (
    <Card title="06. Versioning + provenance">
      <Prose>
        <p>
          Treasure Hunt v0 is the current frozen challenge. Future challenges (Memory Probe, Tool
          Use, Code Review) will be versioned independently. Any change to the v0 scoring,
          generation, or action vocabulary would constitute a new version — old replays remain valid
          against v0 forever.
        </p>
        <p>
          Every run row in the dataset includes a <code>challenge</code> slug and a{' '}
          <code>seed</code>. The challenge slug is the contract; the source code for any version is
          pinned to a git commit on{' '}
          <a
            href="https://github.com/ptengelmann/mentisix"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--mx-signal)' }}
          >
            github.com/ptengelmann/mentisix
          </a>
          .
        </p>
      </Prose>
    </Card>
  );
}

function Section07() {
  return (
    <Card title="07. Limitations + known biases">
      <Prose>
        <p>Treasure Hunt v0 measures one slice of cognition, not all of it. Known biases:</p>
        <ul>
          <li>
            <b>ASCII grid format dependency.</b> Models that handle 2D text grids well have a
            structural advantage over models that don't. We chose ASCII over JSON because text
            models reason about text; JSON observations bias toward agentic SDKs and obscure raw
            reasoning. Trade-off documented, not hidden.
          </li>
          <li>
            <b>Single-shot reasoning per turn.</b> No tool calls, no chain-of-thought scratchpad
            beyond the per-turn reasoning field. Models with strong agentic frameworks built into
            their inference path may score differently in a tool-using harness.
          </li>
          <li>
            <b>Small action space.</b> Fourteen flat tokens. Models that excel at long-tail action
            generation are not stressed here; models that fail simple structured output are
            disqualified upstream by the Zod parser.
          </li>
          <li>
            <b>Score scale is bounded.</b> A maximum score of ~2000 means that a model already at
            ceiling can only differentiate on tie-breakers. Future challenges will widen the
            ceiling.
          </li>
          <li>
            <b>No multi-agent or memory persistence between turns.</b> The agent sees its
            observation and recent action history each turn; it does not see its own past reasoning.
            This is a deliberate constraint of v0 and will be relaxed in dedicated future
            challenges.
          </li>
        </ul>
        <p>
          Found a methodology gap or a bug?{' '}
          <a
            href="https://github.com/ptengelmann/mentisix/issues"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--mx-signal)' }}
          >
            Open an issue
          </a>
          .
        </p>
      </Prose>
    </Card>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '22px 26px 28px',
        fontSize: 15.5,
        lineHeight: 1.65,
        color: 'var(--mx-fog)',
      }}
    >
      {children}
    </div>
  );
}

function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre
      style={{
        margin: '14px 0',
        padding: '16px 18px',
        background: 'var(--mx-void)',
        border: '1px solid var(--mx-line-soft)',
        fontFamily: 'var(--mx-font-mono)',
        fontSize: 12.5,
        lineHeight: 1.6,
        color: 'var(--mx-bone)',
        overflow: 'auto',
      }}
    >
      {children}
    </pre>
  );
}

export const metadata = {
  title: 'Methodology · Mentisix',
  description:
    'How the Mentisix Treasure Hunt benchmark works. Scoring formula, determinism, reproducibility, limitations.',
};
