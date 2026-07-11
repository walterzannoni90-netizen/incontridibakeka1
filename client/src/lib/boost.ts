import { supabase } from "@/lib/supabaseClient";

export type BoostType = "vetrina" | "premium";

interface PurchaseBoostParams {
  adId: string;
  days: number;
  type: BoostType;
  startAt?: string | null;
}

export interface PurchaseBoostResult {
  ad_id: string;
  credits_used: number;
  remaining_credits: number;
  starts_at: string;
  ends_at: string;
}

export async function purchaseBoost({
  adId,
  days,
  type,
  startAt = null,
}: PurchaseBoostParams): Promise<PurchaseBoostResult> {
  if (!supabase) throw new Error("Supabase non configurato");

  const { data, error } = await supabase.rpc("purchase_ad_boost", {
    p_ad_id: adId,
    p_duration_days: days,
    p_type: type,
    p_start_at: startAt,
  });

  if (error) throw new Error(error.message || "Errore acquisto boost");

  const result = Array.isArray(data) ? data[0] : data;
  if (!result) throw new Error("Il boost non ha restituito un risultato");

  return result as PurchaseBoostResult;
}
