import { supabase } from "./supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export type ConversionEvent =
  | "page_view" | "sign_up" | "login" | "ad_publish" | "contact_open"
  | "checkout_start" | "checkout_created" | "payment_completed" | "share";

interface Attribution {
  source: string;
  medium: string;
  campaign?: string;
  content?: string;
}

const ATTRIBUTION_KEY = "idb_attribution";

function clean(value: string | null, max = 100): string | undefined {
  const normalized = value?.trim().replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, max);
  return normalized || undefined;
}

function attribution(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const source = clean(params.get("utm_source"));
  if (source) {
    const value: Attribution = {
      source,
      medium: clean(params.get("utm_medium")) || "campaign",
      campaign: clean(params.get("utm_campaign")),
      content: clean(params.get("utm_content")),
    };
    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(value));
    return value;
  }

  try {
    const stored = window.sessionStorage.getItem(ATTRIBUTION_KEY);
    if (stored) return JSON.parse(stored) as Attribution;
  } catch {
    // A blocked sessionStorage must never block analytics.
  }

  let referrerHost = "";
  try {
    referrerHost = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "";
  } catch {
    referrerHost = "";
  }
  const value: Attribution = referrerHost
    ? { source: referrerHost, medium: "referral" }
    : { source: "direct", medium: "none" };
  try {
    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(value));
  } catch {
    // Best effort only.
  }
  return value;
}

function visitorId(): string {
  const key = "idb_visitor_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  window.localStorage.setItem(key, value);
  return value;
}

export async function trackEvent(eventName: ConversionEvent, metadata: Record<string, unknown> = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    const token = (await supabase?.auth.getSession())?.data.session?.access_token;
    await fetch(`${SUPABASE_URL}/functions/v1/analytics-event`, {
      method: "POST",
      keepalive: true,
      headers: {
        apikey: SUPABASE_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_name: eventName,
        path: window.location.pathname,
        visitor_id: visitorId(),
        metadata: { ...attribution(), ...metadata },
      }),
    });
  } catch {
    // Analytics never blocks the user journey.
  }
}
