// HBStats — Copyright (C) 2026 Antonio Bueno Antón. SPDX-License-Identifier: AGPL-3.0-or-later
// Gives someone an account in a team: a coach (full access), a roster player or a guest (both read-only). Only the
// team's staff (owner or coach) may call it.
// An e-mail without a confirmed account gets an invite: by default an e-mail sent through the project's SMTP, or with
// delivery "link" the sign-in link returned for the coach to share. It is sent again when an earlier invite went unused;
// a confirmed account is linked at once and needs neither.
import { createClient } from "jsr:@supabase/supabase-js@2";

const APP_URL = "https://abuenoa.github.io/hbstats/";
const STAFF_ROLES = ["owner", "coach"];
const INVITED_ROLES = ["coach", "player", "viewer"];
const DELIVERIES = ["email", "link"];
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return reply(405, { error: "método no permitido" });
  const url = Deno.env.get("SUPABASE_URL")!;
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: { user } } = await caller.auth.getUser();
  if (!user) return reply(401, { error: "inicia sesión de nuevo" });
  const { teamId, role = "player", playerId = null, email, delivery = "email" } = await req.json().catch(() => ({}));
  const isPlayer = role === "player";
  if (typeof teamId !== "string" || !INVITED_ROLES.includes(role) || !DELIVERIES.includes(delivery) || (isPlayer && typeof playerId !== "string") || typeof email !== "string" || !email.includes("@")) {
    return reply(400, { error: "faltan el jugador o el correo" });
  }

  const { data: staff, error: staffError } = await admin.from("team_members").select("role")
    .eq("team_id", teamId).eq("user_id", user.id).in("role", STAFF_ROLES).maybeSingle();
  if (staffError) return reply(500, { error: staffError.message });
  if (!staff) return reply(403, { error: "solo los entrenadores del equipo pueden invitar" });
  if (isPlayer) {
    const { data: player, error: playerError } = await admin.from("players").select("id").eq("id", playerId).eq("team_id", teamId).maybeSingle();
    if (playerError) return reply(500, { error: playerError.message });
    if (!player) return reply(404, { error: "el jugador no es de este equipo" });
  }

  const { data: existing, error: lookupError } = await admin.rpc("user_id_by_email", { p_email: email });
  if (lookupError) return reply(500, { error: lookupError.message });
  let userId = existing as string | null, confirmed = false;
  if (userId) {
    const { data: account, error: accountError } = await admin.auth.admin.getUserById(userId);
    if (accountError) return reply(500, { error: accountError.message });
    confirmed = Boolean(account.user.email_confirmed_at);
  }
  // Every check before anything is sent, so nobody gets an invite to a team they cannot join.
  const { data: member, error: memberError } = userId
    ? await admin.from("team_members").select("role, player_id").eq("team_id", teamId).eq("user_id", userId).maybeSingle()
    : { data: null, error: null };
  if (memberError) return reply(500, { error: memberError.message });
  if (member && member.role === "owner") return reply(409, { error: "ese correo es el del dueño del equipo" });
  if (member && confirmed) return reply(409, { error: "ese correo ya es del equipo" });
  if (isPlayer) {
    const { data: taken, error: takenError } = await admin.from("team_members").select("user_id").eq("player_id", playerId).maybeSingle();
    if (takenError) return reply(500, { error: takenError.message });
    if (taken && taken.user_id !== userId) return reply(409, { error: "este jugador ya tiene cuenta" });
  }

  let link: string | null = null, sent = false;
  const created = !userId;
  if (!confirmed && delivery === "email") {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: APP_URL });
    if (error) return reply(error.status ?? 500, { error: `no se pudo enviar el correo: ${error.message}` });
    userId = data.user.id;
    sent = true;
  } else if (!confirmed) {
    const { data, error } = await admin.auth.admin.generateLink({ type: "invite", email, options: { redirectTo: APP_URL } });
    if (error) return reply(error.status ?? 500, { error: error.message });
    userId = data.user.id;
    link = data.properties.action_link;
  }
  // A pending invite asked again for another role or player takes the new one.
  const row = { role, player_id: isPlayer ? playerId : null };
  const { error: saveError } = member
    ? await admin.from("team_members").update(row).eq("team_id", teamId).eq("user_id", userId)
    : await admin.from("team_members").insert({ team_id: teamId, user_id: userId, ...row });
  if (saveError) {
    // An account made for this invite and left in no team would hold a working link to nothing.
    if (created) await admin.auth.admin.deleteUser(userId!);
    return reply(500, { error: saveError.message });
  }
  return reply(200, { link, sent });
});
