// Zona6 — Copyright (C) 2026 Antonio Bueno Antón. All rights reserved.
// Sends the whole match report (the match PDF and every player's page) to the team's owner and coaches by e-mail.
// Only the team's staff may call it. The app builds the files; the addresses are read here from the accounts
// (auth.users) of the owner and coaches who have confirmed their e-mail, and never leave the server.
// The mail goes through the SMTP account in the function's secrets (see ../_shared/mail.ts).
import { createClient } from "jsr:@supabase/supabase-js@2";
import { BASE64_PATTERN, CORS, PDF_FILENAME_PATTERN, pdfAttachment, plainText, reply, reportHtml, smtpTransport, SMTP_NOT_CONFIGURED, STAFF_ROLES, staffOnly } from "../_shared/mail.ts";

const MAX_FILES = 3;
const MAX_TEXT_LENGTH = 2000;
const MAX_SUBJECT_LENGTH = 160;
// The match report and the squad's pages together; well under the function's body limit.
const MAX_TOTAL_BASE64_LENGTH = 15_000_000;
const STAFF_FOOTNOTE = "El informe del partido y las páginas de todos los jugadores van en los PDF adjuntos.";

type Attachment = { filename: string; pdf: string };
const isFile = (f: Record<string, unknown>): f is Attachment =>
  typeof f?.filename === "string" && PDF_FILENAME_PATTERN.test(f.filename) && typeof f.pdf === "string" && BASE64_PATTERN.test(f.pdf);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return reply(405, { error: "método no permitido" });
  const url = Deno.env.get("SUPABASE_URL")!;
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: { user } } = await caller.auth.getUser();
  if (!user) return reply(401, { error: "inicia sesión de nuevo" });
  const { teamId, subject, text, files } = await req.json().catch(() => ({}));
  if (typeof teamId !== "string" || typeof subject !== "string" || !subject || subject.length > MAX_SUBJECT_LENGTH ||
    typeof text !== "string" || text.length > MAX_TEXT_LENGTH || !Array.isArray(files) || !files.length || files.length > MAX_FILES ||
    !files.every(isFile) || files.reduce((n: number, f: Attachment) => n + f.pdf.length, 0) > MAX_TOTAL_BASE64_LENGTH) {
    return reply(400, { error: "informe no válido" });
  }
  const refused = await staffOnly(admin, teamId, user.id, "enviar el informe");
  if (refused) return refused;
  const smtp = smtpTransport();
  if (!smtp) return reply(503, SMTP_NOT_CONFIGURED);

  const [{ data: team, error: teamError }, { data: members, error: membersError }] = await Promise.all([
    admin.from("teams").select("name").eq("id", teamId).single(),
    admin.from("team_members").select("user_id").eq("team_id", teamId).in("role", STAFF_ROLES),
  ]);
  if (teamError) return reply(500, { error: teamError.message });
  if (membersError) return reply(500, { error: membersError.message });
  const accounts = await Promise.all((members ?? []).map((m) => admin.auth.admin.getUserById(m.user_id)));
  const to = accounts.map((a) => a.data.user).filter((u) => u && u.email && u.email_confirmed_at).map((u) => u!.email!);
  if (!to.length) return reply(200, { sent: 0 });

  try {
    await smtp.transport.sendMail({
      from: `Zona6 · ${team.name} <${smtp.from}>`, to: smtp.from, bcc: to, subject, text: plainText(text),
      html: reportHtml(team.name, text, STAFF_FOOTNOTE), attachments: (files as Attachment[]).map((f) => pdfAttachment(f.filename, f.pdf)),
    });
  } catch (err) {
    return reply(502, { error: `no se pudo enviar el correo: ${err instanceof Error ? err.message : String(err)}` });
  }
  return reply(200, { sent: to.length });
});
