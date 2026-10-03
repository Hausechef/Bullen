import { test } from "node:test";
import assert from "node:assert/strict";
import { rankOf, canAssignRole, canManageTarget } from "./supabase.js";

// These helpers enforce the staff privilege boundary: a caller must never be
// able to create, promote to, or act on a role at or above its own tier.
// A regression here re-opens the vertical/horizontal escalation that let a
// crm_admin/director mint an admin or reset a peer/superior admin's password.

test("rankOf: known roles are ordered, unknown/empty rank 0", () => {
  assert.equal(rankOf("agent"), 1);
  assert.equal(rankOf("manager"), 2);
  assert.equal(rankOf("director"), 3);
  assert.equal(rankOf("crm_admin"), 3);
  assert.equal(rankOf("trade_admin"), 3);
  assert.equal(rankOf("admin"), 4);
  assert.ok(rankOf("admin") > rankOf("director"));
  assert.equal(rankOf("nonsense"), 0);
  assert.equal(rankOf(null), 0);
  assert.equal(rankOf(undefined), 0);
});

test("canAssignRole: cannot assign a role above your own tier", () => {
  // The core escalation the fix closes.
  assert.equal(canAssignRole("director", "admin"), false);
  assert.equal(canAssignRole("crm_admin", "admin"), false);
  assert.equal(canAssignRole("manager", "director"), false);
  assert.equal(canAssignRole("agent", "manager"), false);
});

test("canAssignRole: can assign your own tier or below", () => {
  assert.equal(canAssignRole("admin", "admin"), true);
  assert.equal(canAssignRole("admin", "agent"), true);
  assert.equal(canAssignRole("director", "director"), true);
  assert.equal(canAssignRole("director", "manager"), true);
  assert.equal(canAssignRole("manager", "agent"), true);
});

test("canManageTarget: cannot act on a user who outranks you", () => {
  assert.equal(canManageTarget("director", "admin"), false);
  assert.equal(canManageTarget("crm_admin", "admin"), false);
  assert.equal(canManageTarget("manager", "director"), false);
});

test("canManageTarget: can act on peers and lower tiers", () => {
  assert.equal(canManageTarget("admin", "admin"), true);
  assert.equal(canManageTarget("admin", "director"), true);
  assert.equal(canManageTarget("director", "manager"), true);
  // An unknown/absent target role ranks 0 and is always manageable by staff.
  assert.equal(canManageTarget("manager", null), true);
  assert.equal(canManageTarget("manager", undefined), true);
});
