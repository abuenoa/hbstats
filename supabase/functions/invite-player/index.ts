// HBStats — Copyright (C) 2026 Antonio Bueno Antón. SPDX-License-Identifier: AGPL-3.0-or-later
// Gives a roster player a read-only account in their team. Only the team's staff (owner or coach) may call it.
// An e-mail without an account gets an invite link (returned for the coach to share: no e-mail is sent); an existing
// account is linked at once and no link is needed.
import { createClient } from "jsr:@supabase/supabase-js@2";

const APP_URL = "https://abuenoa.github.io/hbstats/";
const STAFF_ROLES = ["owner", "coach"];
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
  const { teamId, playerId, email } = await req.json().catch(() => ({}));
  if (typeof teamId !== "string" || typeof playerId !== "string" || typeof email !== "string" || !email.includes("@")) {
    return reply(400, { error: "faltan el jugador o el correo" });
  }

  const { data: staff, error: staffError } = await admin.from("team_members").select("role")
    .eq("team_id", teamId).eq("user_id", user.id).in("role", STAFF_ROLES).maybeSingle();
  if (staffError) return reply(500, { error: staffError.message });
  if (!staff) return reply(403, { error: "solo los entrenadores del equipo pueden invitar" });
  const { data: player, error: playerError } = await admin.from("players").select("id").eq("id", playerId).eq("team_id", teamId).maybeSingle();
  if (playerError) return reply(500, { error: playerError.message });
  if (!player) return reply(404, { error: "el jugador no es de este equipo" });
  const { data: taken } = await admin.from("team_members").select("user_id").eq("player_id", playerId).maybeSingle();
  if (taken) return reply(409, { error: "este jugador ya tiene cuenta" });

  const { data: existing, error: lookupError } = await admin.rpc("user_id_by_email", { p_email: email });
  if (lookupError) return reply(500, { error: lookupError.message });
  let userId = existing as string | null, link: string | null = null;
  if (!userId) {
    const { data, error } = await admin.auth.admin.generateLink({ type: "invite", email, options: { redirectTo: APP_URL } });
    if (error) return reply(500, { error: error.message });
    userId = data.user.id;
    link = data.properties.action_link;
  }
  const { data: member } = await admin.from("team_members").select("role").eq("team_id", teamId).eq("user_id", userId).maybeSingle();
  if (member) return reply(409, { error: "ese correo ya es del equipo" });
  const { error: linkError } = await admin.from("team_members").insert({ team_id: teamId, user_id: userId, role: "player", player_id: playerId });
  if (linkError) return reply(500, { error: linkError.message });
  return reply(200, { link });
});
