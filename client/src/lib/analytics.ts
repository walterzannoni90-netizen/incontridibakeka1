import { supabase } from "./supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export type ConversionEvent =
  | "page_view" | "sign_up" | "login" | "ad_publish" | "contact_open"
  | "checkout_start" | "checkout_created" | "payment_completed";

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
        metadata,
      }),
    });
  } catch {
    // Analytics never blocks the user journey.
  }
}

