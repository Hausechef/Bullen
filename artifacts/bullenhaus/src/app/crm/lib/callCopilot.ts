import { aiChat } from '../../../lib/ai/aiClient';

export type CallGoal = 'cold_call' | 'follow_up' | 'objection_handling' | 'closing' | 'kyc_help' | 'general';

export const CALL_GOALS: { value: CallGoal; label: string }[] = [
  { value: 'cold_call', label: 'First Contact' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'objection_handling', label: 'Handling an Objection' },
  { value: 'closing', label: 'Closing / Next Step' },
  { value: 'kyc_help', label: 'KYC Assistance' },
  { value: 'general', label: 'General Check-in' },
];

export interface CallBriefInput {
  clientName?: string | null;
  goal: CallGoal;
  context?: string;
}

export interface CallBrief {
  opening: string;
  discoveryQuestions: string[];
  keyPoints: string[];
  anticipatedObjections: { objection: string; response: string }[];
  riskReminder: string;
  softClose: string;
}

// This is an assistive brief for a human agent to read and adapt on their own
// call. It is never sent to, or read aloud by, an automated system, and the
// AI never contacts the client directly.
const SYSTEM_PROMPT = `You are a call-preparation assistant for a human sales/support agent at a trading platform (Bullenhaus). You generate a short, compliant call brief the AGENT will read and adapt themselves before or during a call THEY place. You never draft anything that will be sent to a client automatically or read by a machine.

Hard rules, no exceptions:
- Never claim or imply guaranteed profit, "risk-free", "you cannot lose", or any promised return.
- Always include a clear, direct reminder that trading involves risk and losses are possible.
- Never create false urgency ("deposit now or lose the opportunity") or pressure tactics.
- Never suggest hiding, minimizing, or rushing past a client's objection or hesitation.
- If the client wants to stop being contacted, the brief must say to respect that immediately.
- The agent, not the AI, makes every claim to the client — write in second person addressed to the agent ("Open by...", "Ask...", "Remind them...").

Respond with ONLY a JSON object matching this exact shape, no markdown fences, no extra text:
{
  "opening": "one short opening line the agent can say",
  "discoveryQuestions": ["question 1", "question 2", "question 3"],
  "keyPoints": ["point 1", "point 2", "point 3"],
  "anticipatedObjections": [{"objection": "...", "response": "..."}, {"objection": "...", "response": "..."}],
  "riskReminder": "one sentence risk disclosure reminder for the agent to include",
  "softClose": "one non-pressuring closing question"
}`;

function buildUserPrompt({ clientName, goal, context }: CallBriefInput): string {
  const parts = [
    `Call type: ${goal.replace(/_/g, ' ')}.`,
    clientName ? `Client name: ${clientName}.` : `Client name: unknown - use a generic placeholder like "the client".`,
    context?.trim() ? `Additional context from the agent: ${context.trim()}` : 'No additional context provided.',
  ];
  return parts.join('\n');
}

export async function generateCallBrief(input: CallBriefInput): Promise<CallBrief> {
  const res = await aiChat({
    profile: 'bullenhouse-crm',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(input) },
    ],
    max_tokens: 700,
    temperature: 0.3,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `AI service error (${res.status})`);
  }

  const data = await res.json();
  const raw: string = data?.reply ?? '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned an unexpected response format.');

  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('AI returned an unexpected response format.');
  }

  return {
    opening: typeof parsed.opening === 'string' ? parsed.opening : '',
    discoveryQuestions: Array.isArray(parsed.discoveryQuestions) ? parsed.discoveryQuestions.slice(0, 5).map(String) : [],
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 6).map(String) : [],
    anticipatedObjections: Array.isArray(parsed.anticipatedObjections)
      ? parsed.anticipatedObjections.slice(0, 4).map((o: any) => ({
          objection: String(o?.objection ?? ''),
          response: String(o?.response ?? ''),
        }))
      : [],
    riskReminder: typeof parsed.riskReminder === 'string' && parsed.riskReminder.trim()
      ? parsed.riskReminder
      : 'Trading involves risk and losses are possible - make sure this is clearly communicated.',
    softClose: typeof parsed.softClose === 'string' ? parsed.softClose : '',
  };
}
