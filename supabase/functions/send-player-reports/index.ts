// Zona6 — Copyright (C) 2026 Antonio Bueno Antón. All rights reserved.
// Sends each player his own match report by e-mail: a short text and his PDF page. Only the team's staff (owner or
// coach) may call it. The app builds the reports (the ratings live in the app); the addresses never leave the server:
// they are read here from the staff-only player_contacts. Players without an e-mail are skipped.
// The mail goes through the SMTP account in the function's secrets (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and
// optionally SMTP_FROM); without them the function answers 503 with code "smtp_not_configured".
import { createClient } from "jsr:@supabase/supabase-js@2";
import { BASE64_PATTERN, CORS, PDF_FILENAME_PATTERN, pdfAttachment, plainText, reply, reportHtml, smtpTransport, SMTP_NOT_CONFIGURED, staffOnly } from "../_shared/mail.ts";

const MAX_REPORTS = 8;
const MAX_TEXT_LENGTH = 2000;
const MAX_SUBJECT_LENGTH = 160;
// A player page is a few hundred KB; this keeps one request well under the function's body limit.
const MAX_PDF_BASE64_LENGTH = 3_000_000;
const PLAYER_FOOTNOTE = "Tu informe completo va en el PDF adjunto.";

type Report = { playerId: string; subject: string; text: string; filename: string; pdf: string };
const isReport = (r: Record<string, unknown>): r is Report =>
  typeof r?.playerId === "string" && typeof r.subject === "string" && r.subject.length <= MAX_SUBJECT_LENGTH &&
  typeof r.text === "string" && r.text.length <= MAX_TEXT_LENGTH && typeof r.filename === "string" && PDF_FILENAME_PATTERN.test(r.filename) &&
  typeof r.pdf === "string" && r.pdf.length <= MAX_PDF_BASE64_LENGTH && BASE64_PATTERN.test(r.pdf);

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

  const refused = await staffOnly(admin, teamId, user.id, "enviar informes");
  if (refused) return refused;

  const smtp = smtpTransport();
  if (!smtp) return reply(503, SMTP_NOT_CONFIGURED);

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
        from: `Zona6 · ${team.name} <${smtp.from}>`, to, subject: r.subject, text: plainText(r.text), html: reportHtml(team.name, r.text, PLAYER_FOOTNOTE),
        attachments: [pdfAttachment(r.filename, r.pdf)],
      });
      sent.push(r.playerId);
    } catch (err) {
      failed.push({ playerId: r.playerId, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return reply(200, { sent, skipped, failed });
});
