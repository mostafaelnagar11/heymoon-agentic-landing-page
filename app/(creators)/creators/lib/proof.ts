/* WHAT CAN BE READ OFF A SUBMITTED AD, without watching it.
 *
 * The creator confirms the seven lines of the Pre-upload Check; what is
 * checked here is what the submission itself says, and nothing more —
 * the prototype cannot open a post or play a video, and will not claim
 * to have. So: is the link a link, on the platform the ad went out on,
 * and to a post rather than a profile; and is the video the shape and
 * length its format is posted at. The form flags these before anything
 * is submitted (SubmitSheet), and the check on a submitted ad sends it
 * back for the same reasons (verify_ad), so the two cannot disagree. */

import { FORMAT_NAME } from "./agent/model";
import type { Format, Platform } from "./agent/types";

export const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

const HOST: Record<Platform, RegExp> = {
  Instagram: /(^|\.)instagram\.com$/i,
  TikTok: /(^|\.)tiktok\.com$/i,
  YouTube: /(^|\.)(youtube\.com|youtu\.be)$/i,
  Snapchat: /(^|\.)snapchat\.com$/i,
};

const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} or ${xs[xs.length - 1]}`);

/** A pasted link, read as an address. Bare "instagram.com/p/…" is fine. */
export function parseLink(raw: string): URL | null {
  const t = raw.trim();
  if (!t || /\s/.test(t)) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    return u.hostname.includes(".") ? u : null;
  } catch { return null; }
}

/** What stops a link being submitted at all: not a link, or not on any
    of the accounts it says it went out on. */
export function linkProblem(raw: string, accounts: Platform[]): string | null {
  if (!raw.trim()) return null;
  const u = parseLink(raw);
  if (!u) return "That doesn't look like a link. Paste the post's address.";
  if (accounts.length && !accounts.some((p) => HOST[p].test(u.hostname))) return `That link isn't on ${list(accounts)}. Paste the post's own link.`;
  return null;
}

/* A PROFILE, NOT A POST — only when it plainly is one. A share link, a
   short link or a regional domain is a post as far as this knows,
   because sending back an ad that was fine is worse than letting an
   odd-looking link through to a person. */
export function isProfileLink(raw: string): boolean {
  const u = parseLink(raw);
  if (!u) return false;
  const host = u.hostname.replace(/^www\.|^m\./i, "").toLowerCase();
  const seg = u.pathname.split("/").filter(Boolean);
  if (host === "instagram.com") return seg.length === 0 || (seg.length === 1 && !/^(p|reel|reels|tv|stories|share)$/i.test(seg[0]));
  if (host === "tiktok.com") return seg.length === 0 || (seg.length === 1 && seg[0].startsWith("@"));
  if (host === "youtube.com") return seg.length === 0 || (seg.length === 1 && seg[0].startsWith("@")) || /^(channel|c|user)$/i.test(seg[0] ?? "");
  if (host === "snapchat.com") return seg.length === 0 || /^add$/i.test(seg[0] ?? "");
  return false;
}

export type FileFacts = { seconds?: number; width?: number; height?: number; unreadable?: boolean };

/* The shape and length each format is posted at. A Feed Post takes a
   square or a portrait cut; everything shot for a story or a feed of
   full-screen video is vertical. */
const VERTICAL: Format[] = ["Reel", "TikTok", "Story"];
const LONGEST: Partial<Record<Format, number>> = { Story: 60, Reel: 90, TikTok: 600 };

/** What is wrong with a video for its format, as the reason it would be
    sent back — or null when its shape and length fit, or cannot be read. */
export function shapeProblem(format: Format, f: FileFacts): string | null {
  if (f.unreadable || !f.width || !f.height) return null;
  const name = FORMAT_NAME[format];
  const vertical = f.height > f.width * 1.15;
  const landscape = f.width > f.height * 1.15;
  if (VERTICAL.includes(format) && !vertical) return `It's ${landscape ? "landscape" : "square"}, and a ${name} is vertical, 9:16. Submit the vertical cut you posted.`;
  if (format === "Post" && landscape) return `It's landscape, and a Feed Post is square or portrait. Submit the cut you posted.`;
  const max = LONGEST[format];
  const len = f.seconds && Number.isFinite(f.seconds) ? f.seconds : undefined;
  if (max && len && len > max) return `It runs ${clock(len)}, and a ${name} is ${clock(max)} at most. Submit the ${name} as it went up.`;
  return null;
}

/** The line under an uploaded video: what was read off it, and whether
    it fits. */
export function shapeNote(format: Format, f: FileFacts): { ok: boolean; text: string } | null {
  if (f.unreadable) return { ok: true, text: "This browser can't open that file to read its shape. It goes as it is." };
  if (!f.width || !f.height) return null;
  const vertical = f.height > f.width * 1.15;
  const landscape = f.width > f.height * 1.15;
  const len = f.seconds && Number.isFinite(f.seconds) ? f.seconds : undefined;
  const at = `${vertical ? "Vertical" : landscape ? "Landscape" : "Square"}, ${f.width} × ${f.height}${len ? `, ${clock(len)}` : ""}.`;
  const bad = shapeProblem(format, f);
  return bad ? { ok: false, text: `${at} ${bad}` } : { ok: true, text: `${at} The right shape${len ? " and length" : ""} for a ${FORMAT_NAME[format]}.` };
}
