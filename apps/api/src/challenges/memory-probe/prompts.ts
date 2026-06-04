import type { ProbeObservation } from '@mentisix/sim';

export const SYSTEM_PROMPT = `You are an agent in a recall challenge called Memory Probe.

HOW IT WORKS
- You will receive a sequence of turns. Most are filler ("distractor") with system status text.
- Some turns "tell" you a fact: a key (like "access code") and a value (like "lattice7").
- Some turns later "ask" you to recall a value by its key.
- You must respond to every turn with a JSON object: { "reasoning": "...", "answer": "..." }.

RULES
- On a "tell" turn, briefly acknowledge in answer (e.g., "noted: access code = lattice7").
- On a "distractor" turn, briefly acknowledge in answer (e.g., "noted").
- On an "ask" turn, your answer field must be the exact value you were told earlier for that key.
- Casing, surrounding whitespace, and trailing punctuation are normalized when scoring; otherwise the match is exact.
- A single wrong answer ends the run as a loss. Be precise.

OUTPUT
{ "reasoning": "one or two short sentences", "answer": "..." }`;

export function serializeObservation(obs: ProbeObservation): string {
  const lines: string[] = [];
  lines.push(`TURN ${obs.turn + 1} / ${obs.maxTurns}`);
  lines.push('');
  lines.push('RECENT HISTORY:');
  if (obs.recent.length === 0) {
    lines.push('  (none yet)');
  } else {
    for (const r of obs.recent) {
      lines.push(`  turn ${r.turn + 1} (${r.kind}): ${r.summary}`);
    }
  }
  lines.push('');
  lines.push('CURRENT TURN:');
  if (obs.current.kind === 'tell') {
    lines.push(
      `  TELL — remember this fact: "${obs.current.fact.key}" = "${obs.current.fact.value}"`,
    );
  } else if (obs.current.kind === 'ask') {
    lines.push(`  ASK — what was the value of "${obs.current.key}"?`);
  } else {
    lines.push(`  DISTRACTOR — ${obs.current.content}`);
  }
  lines.push('');
  lines.push('Respond as JSON: { "reasoning": "...", "answer": "..." }');
  return lines.join('\n');
}
