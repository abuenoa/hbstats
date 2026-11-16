// Zona6 — Copyright (C) 2026 Antonio Bueno Antón. All rights reserved.
// Opens a report PDF from a short link (?k=<key>), the one the WhatsApp messages and e-mails carry: the key names a PDF
// in the private match-reports bucket (public.report_links), and each visit gets a download signed for a minute. Public
// on purpose (deployed without JWT verification): whoever has the link reads that one PDF until the link expires.
import { createClient } from "jsr:@supabase/supabase-js@2";

const BUCKET = "match-reports";
const KEY_PATTERN = /^[A-Za-z0-9]{20,40}$/;
const SIGNED_SECONDS = 60;
const page = (status: number, title: string, text: string) => new Response(
  `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Zona6</title>
<body style="margin:0;background:#0d0f12;color:#f5f5f5;font-family:Arial,sans-serif;display:grid;place-items:center;min-height:100vh">
<div style="max-width:420px;padding:28px;text-align:center"><p style="color:#f5c400;font-weight:bold;letter-spacing:3px">ZONA6</p>
<h1 style="font-size:22px">${title}</h1><p style="color:#c8ccd2;line-height:1.5">${text}</p></div></body></html>`,
  { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
);

Deno.serve(async (req) => {
  if (req.method !== "GET") return new Response(null, { status: 405 });
  const key = new URL(req.url).searchParams.get("k") ?? "";
  if (!KEY_PATTERN.test(key)) return page(404, "Enlace no válido", "Revisa que el enlace esté completo.");
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: link, error } = await admin.from("report_links").select("path, filename, expires_at").eq("key", key).maybeSingle();
  if (error) return page(500, "No se pudo abrir", "Inténtalo de nuevo en un momento.");
  if (!link) return page(404, "Enlace no válido", "Este informe no existe o se ha borrado.");
  if (Date.parse(link.expires_at) < Date.now()) return page(410, "Enlace caducado", "Pide a tu entrenador que te lo envíe de nuevo.");
  const { data: signed, error: signError } = await admin.storage.from(BUCKET).createSignedUrl(link.path, SIGNED_SECONDS, { download: link.filename });
  if (signError || !signed) return page(404, "Informe no disponible", "Pide a tu entrenador que te lo envíe de nuevo.");
  return new Response(null, { status: 302, headers: { Location: signed.signedUrl, "Cache-Control": "no-store" } });
});
