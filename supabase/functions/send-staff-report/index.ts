// Zona6 — Copyright (C) 2026 Antonio Bueno Antón. All rights reserved.
// Sends the whole match report (the match PDF and every player's page) by e-mail, one e-mail each, to the team's owner
// and coaches and to the coaching staff. Only the team's staff may call it. The app builds the files; the addresses are
// read here — the confirmed e-mails of the owner's and coaches' accounts (auth.users) and the staff profiles' e-mails
// (staff_contacts) — and never leave the server. An address in both gets one e-mail.
// The mail goes through the SMTP account in the function's secrets (see ../_shared/mail.ts).
import { createClient } from "jsr:@supabase/supabase-js@2";
import { BASE64_PATTERN, CORS, plainText, REPORT_FILENAME_PATTERN, reportAttachment, reply, reportHtml, smtpTransport, SMTP_NOT_CONFIGURED, STAFF_ROLES, staffOnly } from "../_shared/mail.ts";

// The MVP image, the match report and every player's page.
const MAX_FILES = 4;
const MAX_TEXT_LENGTH = 2000;
const MAX_SUBJECT_LENGTH = 160;
// The match report and the squad's pages together; well under the function's body limit.
const MAX_TOTAL_BASE64_LENGTH = 15_000_000;
const STAFF_FOOTNOTE = "Van adjuntos la imagen del MVP, el informe del partido y las páginas de todos los jugadores.";

// Each file's base64 comes as `data` (`pdf` from the app before the MVP image was attached).
type Attachment = { filename: string; data: string };
const asAttachment = (f: Record<string, unknown>): Attachment | null => {
  const data = f?.data ?? f?.pdf;
  return typeof f?.filename === "string" && REPORT_FILENAME_PATTERN.test(f.filename) && typeof data === "string" && BASE64_PATTERN.test(data)
    ? { filename: f.filename, data } : null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return reply(405, { error: "método no permitido" });
  const url = Deno.env.get("SUPABASE_URL")!;
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: { user } } = await caller.auth.getUser();
  if (!user) return reply(401, { error: "inicia sesión de nuevo" });
  const { teamId, subject, text, files: sentFiles } = await req.json().catch(() => ({}));
  const files = Array.isArray(sentFiles) ? sentFiles.map(asAttachment) : null;
  if (typeof teamId !== "string" || typeof subject !== "string" || !subject || subject.length > MAX_SUBJECT_LENGTH ||
    typeof text !== "string" || text.length > MAX_TEXT_LENGTH || !Array.isArray(files) || !files.length || files.length > MAX_FILES ||
    files.some((f) => !f) || (files as Attachment[]).reduce((n, f) => n + f.data.length, 0) > MAX_TOTAL_BASE64_LENGTH) {
    return reply(400, { error: "informe no válido" });
  }
  const refused = await staffOnly(admin, teamId, user.id, "enviar el informe");
  if (refused) return refused;
  const smtp = smtpTransport();
  if (!smtp) return reply(503, SMTP_NOT_CONFIGURED);

  const [{ data: team, error: teamError }, { data: members, error: membersError }, { data: contacts, error: contactsError }] = await Promise.all([
    admin.from("teams").select("name").eq("id", teamId).single(),
    admin.from("team_members").select("user_id").eq("team_id", teamId).in("role", STAFF_ROLES),
    admin.from("staff_contacts").select("email").eq("team_id", teamId).not("email", "is", null),
  ]);
  if (teamError) return reply(500, { error: teamError.message });
  if (membersError) return reply(500, { error: membersError.message });
  if (contactsError) return reply(500, { error: contactsError.message });
  const accounts = await Promise.all((members ?? []).map((m) => admin.auth.admin.getUserById(m.user_id)));
  const accountEmails = accounts.map((a) => a.data.user).filter((u) => u && u.email && u.email_confirmed_at).map((u) => u!.email!);
  const byAddress = new Map([...accountEmails, ...(contacts ?? []).map((c) => c.email as string)].map((e) => [e.trim().toLowerCase(), e.trim()]));
  const to = [...byAddress.values()];

  const attachments = (files as Attachment[]).map((f) => reportAttachment(f.filename, f.data)), html = reportHtml(team.name, text, STAFF_FOOTNOTE);
  let sent = 0;
  const failed: string[] = [];
  for (const address of to) {
    try {
      await smtp.transport.sendMail({ from: `Zona6 · ${team.name} <${smtp.from}>`, to: address, subject, text: plainText(text), html, attachments });
      sent += 1;
    } catch (err) {
      failed.push(err instanceof Error ? err.message : String(err));
    }
  }
  if (!sent && failed.length) return reply(502, { error: `no se pudo enviar el correo: ${failed[0]}` });
  return reply(200, { sent, failed: failed.length });
});
