// Zona6 — Copyright (C) 2026 Antonio Bueno Antón. All rights reserved.
// Sends each player his own match report by e-mail: a short text and his PDF page. Only the team's staff (owner or
// coach) may call it. The app builds the reports (the ratings live in the app); the addresses never leave the server:
// they are read here from the staff-only player_contacts. Players without an e-mail are skipped.
// The mail goes through the SMTP account in the function's secrets (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and
// optionally SMTP_FROM); without them the function answers 503 with code "smtp_not_configured".
import { createClient } from "jsr:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

const STAFF_ROLES = ["owner", "coach"];
const MAX_REPORTS = 8;
const MAX_TEXT_LENGTH = 2000;
const MAX_SUBJECT_LENGTH = 160;
// A player page is a few hundred KB; this keeps one request well under the function's body limit.
const MAX_PDF_BASE64_LENGTH = 3_000_000;
const SMTP_SECURE_PORT = 465;
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
const FILENAME_PATTERN = /^[\w.-]{1,120}\.pdf$/;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

type Report = { playerId: string; subject: string; text: string; filename: string; pdf: string };
const isReport = (r: Record<string, unknown>): r is Report =>
  typeof r?.playerId === "string" && typeof r.subject === "string" && r.subject.length <= MAX_SUBJECT_LENGTH &&
  typeof r.text === "string" && r.text.length <= MAX_TEXT_LENGTH && typeof r.filename === "string" && FILENAME_PATTERN.test(r.filename) &&
  typeof r.pdf === "string" && r.pdf.length <= MAX_PDF_BASE64_LENGTH && BASE64_PATTERN.test(r.pdf);

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
// The text the app wrote, as a plain branded e-mail: WhatsApp-style *bold* lines stay plain, links stay text.
function reportHtml(teamName: string, text: string) {
  const lines = text.replace(/\*/g, "").split("\n").map((line) => `<p style="margin:0 0 8px">${escapeHtml(line)}</p>`).join("");
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#151515">
  <div style="background:#d4202a;color:#fff;padding:14px 18px;border-radius:10px 10px 0 0;font-weight:700;font-size:18px">Zona6 · ${escapeHtml(teamName)}</div>
  <div style="border:1px solid #e5e5e5;border-top:0;padding:18px;border-radius:0 0 10px 10px;font-size:15px;line-height:1.4">${lines}
  <p style="margin:14px 0 0;color:#666;font-size:12px">Tu informe completo va en el PDF adjunto.</p></div></div>`;
}

function smtpTransport() {
  const host = Deno.env.get("SMTP_HOST"), user = Deno.env.get("SMTP_USER"), pass = Deno.env.get("SMTP_PASS");
  if (!host || !user || !pass) return null;
  const port = Number(Deno.env.get("SMTP_PORT") || SMTP_SECURE_PORT);
  return { from: Deno.env.get("SMTP_FROM") || user, transport: nodemailer.createTransport({ host, port, secure: port === SMTP_SECURE_PORT, auth: { user, pass } }) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return reply(405, { error: "método no permitido" });
  const url = Deno.env.get("SUPABASE_URL")!;
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: { user } } = await caller.auth.getUser();
  if (!user) return reply(401, { error: "inicia sesión de nuevo" });
  const { teamId, reports } = await req.json().catch(() => ({}));
  if (typeof teamId !== "string" || !Array.isArray(reports) || !reports.length || reports.length > MAX_REPORTS || !reports.every(isReport)) {
    return reply(400, { error: "informes no válidos" });
  }

  const { data: staff, error: staffError } = await admin.from("team_members").select("role")
    .eq("team_id", teamId).eq("user_id", user.id).in("role", STAFF_ROLES).maybeSingle();
  if (staffError) return reply(500, { error: staffError.message });
  if (!staff) return reply(403, { error: "solo los entrenadores del equipo pueden enviar informes" });

  const smtp = smtpTransport();
  if (!smtp) return reply(503, { code: "smtp_not_configured", error: "el correo de Zona6 no está configurado todavía" });

  const ids = reports.map((r: Report) => r.playerId);
  const [{ data: team, error: teamError }, { data: contacts, error: contactsError }] = await Promise.all([
    admin.from("teams").select("name").eq("id", teamId).single(),
    admin.from("player_contacts").select("player_id, email").eq("team_id", teamId).in("player_id", ids),
  ]);
  if (teamError) return reply(500, { error: teamError.message });
  if (contactsError) return reply(500, { error: contactsError.message });
  const emailOf = new Map((contacts ?? []).filter((c) => c.email).map((c) => [c.player_id, c.email as string]));

  const sent: string[] = [], skipped: string[] = [], failed: { playerId: string; error: string }[] = [];
  for (const r of reports as Report[]) {
    const to = emailOf.get(r.playerId);
    if (!to) { skipped.push(r.playerId); continue; }
    try {
      await smtp.transport.sendMail({
        from: `Zona6 · ${team.name} <${smtp.from}>`, to, subject: r.subject, text: r.text.replace(/\*/g, ""), html: reportHtml(team.name, r.text),
        attachments: [{ filename: r.filename, content: r.pdf, encoding: "base64", contentType: "application/pdf" }],
      });
      sent.push(r.playerId);
    } catch (err) {
      failed.push({ playerId: r.playerId, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return reply(200, { sent, skipped, failed });
});
