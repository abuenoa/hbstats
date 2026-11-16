// Zona6 — Copyright (C) 2026 Antonio Bueno Antón. All rights reserved.
// What the e-mail functions share: the CORS reply, the staff check, the SMTP account from the function secrets
// (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and optionally SMTP_FROM) and the branded e-mail around a text the app wrote.
import nodemailer from "npm:nodemailer@6.9.16";
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

export const STAFF_ROLES = ["owner", "coach"];
const SMTP_SECURE_PORT = 465;
export const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
export const PDF_FILENAME_PATTERN = /^[\w.-]{1,120}\.pdf$/;
export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
export const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
export const SMTP_NOT_CONFIGURED = { code: "smtp_not_configured", error: "el correo de Zona6 no está configurado todavía" };

// Null when the caller is staff of the team, else the reply to send.
export async function staffOnly(admin: SupabaseClient, teamId: string, userId: string, what: string) {
  const { data, error } = await admin.from("team_members").select("role").eq("team_id", teamId).eq("user_id", userId).in("role", STAFF_ROLES).maybeSingle();
  if (error) return reply(500, { error: error.message });
  return data ? null : reply(403, { error: `solo los entrenadores del equipo pueden ${what}` });
}

export function smtpTransport() {
  const host = Deno.env.get("SMTP_HOST"), user = Deno.env.get("SMTP_USER"), pass = Deno.env.get("SMTP_PASS");
  if (!host || !user || !pass) return null;
  const port = Number(Deno.env.get("SMTP_PORT") || SMTP_SECURE_PORT);
  return { from: Deno.env.get("SMTP_FROM") || user, transport: nodemailer.createTransport({ host, port, secure: port === SMTP_SECURE_PORT, auth: { user, pass } }) };
}

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
// The text the app wrote, as a plain branded e-mail: WhatsApp-style *bold* marks are dropped, links stay text.
export const plainText = (text: string) => text.replace(/\*/g, "");
export function reportHtml(teamName: string, text: string, footnote: string) {
  const lines = plainText(text).split("\n").map((line) => `<p style="margin:0 0 8px">${escapeHtml(line)}</p>`).join("");
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#151515">
  <div style="background:#d4202a;color:#fff;padding:14px 18px;border-radius:10px 10px 0 0;font-weight:700;font-size:18px">Zona6 · ${escapeHtml(teamName)}</div>
  <div style="border:1px solid #e5e5e5;border-top:0;padding:18px;border-radius:0 0 10px 10px;font-size:15px;line-height:1.4">${lines}
  <p style="margin:14px 0 0;color:#666;font-size:12px">${escapeHtml(footnote)}</p></div></div>`;
}
export const pdfAttachment = (filename: string, pdf: string) => ({ filename, content: pdf, encoding: "base64", contentType: "application/pdf" });
