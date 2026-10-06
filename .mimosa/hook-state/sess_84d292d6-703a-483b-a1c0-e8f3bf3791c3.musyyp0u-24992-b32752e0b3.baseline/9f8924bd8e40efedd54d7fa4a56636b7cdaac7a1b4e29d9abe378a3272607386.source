import { supabase } from "../../../lib/supabase/browserClient";

export const LEAD_PAGE_SIZE = 30;
const REQUEST_TIMEOUT_MS = 12_000;
const USER_FALLBACK_PAGE_SIZE = 100;

export const LEADS_SELECT = [
  "id",
  "name",
  "first_name",
  "last_name",
  "email",
  "phone",
  "country",
  "stage",
  "capacity",
  "timezone",
  "notes",
  "acquisition_source",
  "assigned_agent_id",
  "created_at",
  "updated_at",
].join(", ");

const USERS_SELECT = [
  "id",
  "email",
  "full_name",
  "username",
  "display_name",
  "avatar_url",
  "role",
  "kyc_status",
  "created_at",
  "updated_at",
].join(", ");

const STAFF_ROLES = new Set(["admin", "crm_admin", "agent", "manager", "director", "trade_admin", "super-admin", "superadmin"]);

export type LeadSort = "created_at" | "updated_at" | "stage" | "email";
export type LeadDirection = "asc" | "desc";
export type PipelineSource = "leads" | "users";

export interface LeadPageParams {
  page?: number;
  pageSize?: number;
  search?: string;
  stage?: string;
  assignedTo?: string | null;
  sort?: LeadSort;
  direction?: LeadDirection;
}

function withTimeout<T>(promise: PromiseLike<T>, message: string): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS)),
  ]);
}

function displayName(row: any) {
  return row.full_name || row.display_name || row.username || row.email?.split("@")[0] || "Client";
}

export function deriveLeadStage(user: any) {
  const kyc = String(user.kyc_status || "").toLowerCase();
  if (kyc === "pending") return "PENDING_KYC";
  if (kyc === "approved") return "APPROVED";
  if (kyc === "verified") return "APPROVED";
  if (kyc === "rejected") return "REJECTED";
  return "NEW_INQUIRY";
}

export function mapLead(row: any) {
  return {
    ...row,
    pipelineSource: "leads" as PipelineSource,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    country: row.country ?? row.acquisition_source?.country ?? null,
    acquisitionSource: row.acquisition_source ?? {},
  };
}

export function mapUserLead(row: any) {
  const name = displayName(row);
  const parts = name.split(/\s+/).filter(Boolean);
  return {
    id: row.id,
    email: row.email,
    phone: null,
    firstName: parts[0] ?? name,
    lastName: parts.slice(1).join(" "),
    displayName: name,
    avatarUrl: row.avatar_url ?? null,
    role: row.role,
    kycStatus: row.kyc_status ?? null,
    stage: deriveLeadStage(row),
    capacity: row.kyc_status ?? "TBD",
    country: null,
    acquisitionSource: { leadSource: "Users" },
    assigned_agent_id: null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    pipelineSource: "users" as PipelineSource,
  };
}

function applyLeadFilters(query: any, params: LeadPageParams) {
  let q = query;
  if (params.stage) q = q.eq("stage", params.stage);
  if (params.assignedTo === null) q = q.is("assigned_agent_id", null);
  if (params.assignedTo) q = q.eq("assigned_agent_id", params.assignedTo);
  const search = params.search?.trim();
  if (search && search.length >= 2) {
    const safe = search.replace(/[%(),]/g, "");
    q = q.or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,email.ilike.%${safe}%,name.ilike.%${safe}%`);
  }
  return q;
}

function normalizeDbError(message: string) {
  return new Error(message);
}

export async function getLeadCounts(params: LeadPageParams = {}) {
  let q = supabase.from("leads").select("id", { count: "exact", head: true });
  q = applyLeadFilters(q, params);
  const { count, error } = await withTimeout(q, "Lead count request timed out");
  if (error) throw normalizeDbError("Unable to load lead counts");
  return count ?? 0;
}

export async function getLeadsPage(params: LeadPageParams = {}) {
  const page = Math.max(0, params.page ?? 0);
  const pageSize = Math.min(Math.max(params.pageSize ?? LEAD_PAGE_SIZE, 1), 50);
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("leads")
    .select(LEADS_SELECT, { count: "exact" })
    .order(params.sort ?? "created_at", { ascending: (params.direction ?? "desc") === "asc" })
    .range(from, to);

  q = applyLeadFilters(q, params);
  const { data, count, error } = await withTimeout(q, "Lead request timed out");
  if (error) throw normalizeDbError("Unable to load leads");
  return { rows: (data ?? []).map(mapLead), count: count ?? 0, page, pageSize };
}

// Fetches an arbitrary row range (not tied to a fixed page size) so callers can
// top up a stage back to a fixed visible count after a row leaves it, without
// the offset drifting off a page boundary.
export async function getLeadsRange(params: LeadPageParams & { from: number; count: number }) {
  const from = Math.max(0, Math.floor(params.from));
  const to = from + Math.max(1, Math.floor(params.count)) - 1;

  let q = supabase
    .from("leads")
    .select(LEADS_SELECT, { count: "exact" })
    .order(params.sort ?? "created_at", { ascending: (params.direction ?? "desc") === "asc" })
    .range(from, to);

  q = applyLeadFilters(q, params);
  const { data, count, error } = await withTimeout(q, "Lead request timed out");
  if (error) throw normalizeDbError("Unable to load leads");
  return { rows: (data ?? []).map(mapLead), count: count ?? 0 };
}

function isCrmClientCandidate(row: any) {
  const role = String(row.role || "").toLowerCase();
  return !STAFF_ROLES.has(role);
}

export async function getUsersLeadPage(params: LeadPageParams = {}) {
  const page = Math.max(0, params.page ?? 0);
  const pageSize = Math.min(Math.max(params.pageSize ?? USER_FALLBACK_PAGE_SIZE, 1), 100);
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("users")
    .select(USERS_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const search = params.search?.trim();
  if (search && search.length >= 2) {
    const safe = search.replace(/[%(),]/g, "");
    q = q.or(`email.ilike.%${safe}%,full_name.ilike.%${safe}%,username.ilike.%${safe}%,display_name.ilike.%${safe}%`);
  }

  const { data, count, error } = await withTimeout(q, "User fallback request timed out");
  if (error) throw normalizeDbError("Unable to load users fallback");

  const rows = (data ?? []).filter(isCrmClientCandidate).map(mapUserLead);
  return {
    rows,
    count: count ?? rows.length,
    page,
    pageSize,
    hasMore: (data ?? []).length === pageSize,
  };
}

export async function searchLeads(query: string) {
  if (query.trim().length < 2) return [];
  try {
    const { rows } = await getLeadsPage({ search: query, page: 0, pageSize: 50 });
    if (rows.length > 0) return rows;
  } catch (error) {
    console.error("[leadsService] Lead search failed, using users fallback", error);
  }
  const { rows } = await getUsersLeadPage({ search: query, page: 0, pageSize: 50 });
  return rows;
}

export async function updateLeadStatus(leadId: string, nextStatus: string) {
  const { error } = await withTimeout(
    supabase.from("leads").update({ stage: nextStatus }).eq("id", leadId),
    "Lead stage update timed out",
  );
  if (error) throw normalizeDbError("Unable to update lead stage");
}

export async function assignLead(leadId: string, agentId: string) {
  const { error } = await supabase.from("leads").update({ assigned_agent_id: agentId }).eq("id", leadId);
  if (error) throw new Error("Unable to assign lead");
}

export async function getLeadDetails(leadId: string) {
  const { data, error } = await supabase.from("leads").select(LEADS_SELECT).eq("id", leadId).maybeSingle();
  if (error) throw new Error("Unable to load lead details");
  return data ? mapLead(data) : null;
}

export async function createLeadNote(): Promise<never> {
  throw new Error("Notes storage is not configured yet");
}

export async function createFollowUpTask(): Promise<never> {
  throw new Error("Task storage is not configured yet");
}
