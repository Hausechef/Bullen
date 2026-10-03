import { aiChat } from '../../../lib/ai/aiClient';
import { supabase } from '../../../lib/supabase/browserClient';

// AI Call Scenario: a stateful, multi-turn call plan for a human agent to run.
// There is no telephony provider connected in this build (see Telephony
// Settings — Twilio/Telnyx/Vonage all show "Not Connected"), so the AI never
// dials, never talks to the client, and never hears them. It proposes ONE
// line at a time; the agent reads/adapts it on their own call, then types
// back what the client actually said, and the AI proposes the next line.
// Everything here is the planning layer that would sit in front of a real
// telephony connection -- wiring an actual provider is a separate task.

export type CallObjective = 'deposit_push' | 'investment_upsell' | 'kyc_completion' | 'reactivation';

export const CALL_OBJECTIVES: { value: CallObjective; label: string; description: string }[] = [
  { value: 'deposit_push',      label: 'First Deposit',        description: 'Lead the client toward making their first deposit.' },
  { value: 'investment_upsell', label: 'Increase Investment',  description: 'Lead an existing depositor toward adding to their position.' },
  { value: 'kyc_completion',    label: 'KYC Completion',       description: 'Get the client to finish identity verification.' },
  { value: 'reactivation',      label: 'Reactivation',         description: 'Re-engage a cold or inactive lead.' },
];

export type ScenarioStage = 'opening' | 'discovery' | 'pitch' | 'objection_handling' | 'closing' | 'outcome';

export const SCENARIO_STAGES: { value: ScenarioStage; label: string }[] = [
  { value: 'opening',             label: 'Opening' },
  { value: 'discovery',           label: 'Discovery' },
  { value: 'pitch',               label: 'Pitch' },
  { value: 'objection_handling',  label: 'Objections' },
  { value: 'closing',             label: 'Closing' },
  { value: 'outcome',             label: 'Outcome' },
];

export type ScenarioOutcome = 'deposit_interest' | 'no_interest' | 'callback_requested' | 'opted_out' | 'escalated';

export interface ScenarioTurn {
  speaker: 'ai' | 'client';
  text: string;
  stage: ScenarioStage;
  at: string;
}

export interface ScenarioStepResult {
  stage: ScenarioStage;
  aiLine: string;
  done: boolean;
  outcome: ScenarioOutcome | null;
}

const SYSTEM_PROMPT = `You are planning a phone call for a HUMAN agent at a trading platform (Bullenhaus) to place themselves. There is no telephony connection here -- you never talk to the client, you never hear them, and nothing you write is sent to the client automatically. You propose ONE line at a time. The agent reads or adapts your line on their real call, then reports back what the client said, and you propose the next line.

Hard rules, no exceptions:
- Never claim or imply guaranteed profit, "risk-free", "you cannot lose", or any promised return.
- Include a clear, direct risk reminder (trading involves risk, losses are possible) at least once before any close attempt.
- Never invent false urgency or pressure tactics.
- Never suggest hiding, minimizing, or rushing past a client's objection or hesitation.
- The instant the (reported) client wants to stop being contacted, set stage to "outcome", outcome to "opted_out", done to true, and the line must tell the agent to respect that immediately and end the call.
- You are writing instructions FOR the agent, in second person ("Say...", "Ask...", "Acknowledge..."), not a script to read to the client verbatim as if you were the client's friend.
- Advance through stages in order: opening -> discovery -> pitch -> objection_handling -> closing -> outcome. You may revisit objection_handling as needed before closing. Move to "outcome" once the call has reached a natural conclusion (client agreed, declined, asked to be called back, or opted out), or after no more than 8 exchanges.
- When stage is "outcome", set done to true and outcome to one of: "deposit_interest", "no_interest", "callback_requested", "opted_out", "escalated" (escalated = client needs a human specialist/compliance, e.g. a complex legal question).

Respond with ONLY a JSON object, no markdown fences, no extra text:
{"stage": "...", "aiLine": "...", "done": false, "outcome": null}`;

function buildContextPrompt(objective: CallObjective, clientName: string | null | undefined, transcript: ScenarioTurn[]) {
  const objectiveDef = CALL_OBJECTIVES.find(o => o.value === objective);
  const lines = [
    `Call objective: ${objectiveDef?.label ?? objective} -- ${objectiveDef?.description ?? ''}`,
    clientName ? `Client name: ${clientName}.` : 'Client name: unknown, use "the client".',
    '',
    transcript.length === 0
      ? 'This is the very start of the call. Propose the opening line.'
      : 'Conversation so far (AI = suggested lines already given to the agent, CLIENT = what the agent reported the client said):',
    ...transcript.map(t => `${t.speaker === 'ai' ? 'AI' : 'CLIENT'}: ${t.text}`),
    transcript.length > 0 ? '\nPropose the next line for the agent.' : '',
  ];
  return lines.join('\n');
}

function parseStepResult(raw: string): ScenarioStepResult {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI returned an unexpected response format.');
  let parsed: any;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    throw new Error('AI returned an unexpected response format.');
  }
  const validStages: ScenarioStage[] = ['opening', 'discovery', 'pitch', 'objection_handling', 'closing', 'outcome'];
  const stage: ScenarioStage = validStages.includes(parsed.stage) ? parsed.stage : 'opening';
  const validOutcomes: ScenarioOutcome[] = ['deposit_interest', 'no_interest', 'callback_requested', 'opted_out', 'escalated'];
  const outcome: ScenarioOutcome | null = validOutcomes.includes(parsed.outcome) ? parsed.outcome : null;
  return {
    stage,
    aiLine: typeof parsed.aiLine === 'string' && parsed.aiLine.trim() ? parsed.aiLine : 'Continue the conversation naturally and restate the risk disclosure.',
    done: Boolean(parsed.done) || stage === 'outcome',
    outcome,
  };
}

export async function generateNextScenarioStep(params: {
  objective: CallObjective;
  clientName?: string | null;
  transcript: ScenarioTurn[];
}): Promise<ScenarioStepResult> {
  const res = await aiChat({
    profile: 'bullenhouse-crm',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildContextPrompt(params.objective, params.clientName, params.transcript) },
    ],
    max_tokens: 400,
    temperature: 0.4,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `AI service error (${res.status})`);
  }

  const data = await res.json();
  return parseStepResult(data?.reply ?? '');
}

// ── Persistence (audit trail) ───────────────────────────────────────────────

export interface ScenarioSession {
  id: string;
  lead_id: string | null;
  agent_id: string;
  call_log_id: string | null;
  objective: CallObjective;
  status: 'in_progress' | 'completed' | 'opted_out' | 'escalated' | 'abandoned';
  stage: ScenarioStage;
  transcript: ScenarioTurn[];
  outcome: ScenarioOutcome | null;
}

export async function createScenarioSession(params: {
  leadId?: string | null;
  callLogId?: string | null;
  objective: CallObjective;
}): Promise<ScenarioSession | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('ai_call_scenarios')
    .insert({
      lead_id: params.leadId ?? null,
      agent_id: user.id,
      call_log_id: params.callLogId ?? null,
      objective: params.objective,
      status: 'in_progress',
      stage: 'opening',
      transcript: [],
    })
    .select()
    .single();
  if (error) { console.error('[callScenario] create session failed', error); return null; }
  return data as ScenarioSession;
}

export async function appendScenarioTurns(sessionId: string, transcript: ScenarioTurn[], stage: ScenarioStage) {
  await supabase.from('ai_call_scenarios').update({ transcript, stage, updated_at: new Date().toISOString() }).eq('id', sessionId);
}

export async function closeScenarioSession(sessionId: string, status: ScenarioSession['status'], outcome: ScenarioOutcome | null) {
  await supabase.from('ai_call_scenarios').update({ status, outcome, updated_at: new Date().toISOString() }).eq('id', sessionId);
}
