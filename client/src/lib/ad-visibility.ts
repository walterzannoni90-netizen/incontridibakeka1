export interface AdPromotionState {
  premium_until?: string | null;
  vetrina_until?: string | null;
  vetrina_scheduled_at?: string | null;
}

export interface AdPhotoState extends AdPromotionState {
  image?: string | null;
  images?: string[] | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function validTimestamp(value?: string | null): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function isPremiumActive(
  ad: AdPromotionState,
  now = Date.now(),
): boolean {
  const premiumUntil = validTimestamp(ad.premium_until);
  return premiumUntil !== null && now < premiumUntil;
}

export function isVetrinaActive(
  ad: AdPromotionState,
  now = Date.now(),
): boolean {
  const vetrinaUntil = validTimestamp(ad.vetrina_until);
  const scheduledAt = validTimestamp(ad.vetrina_scheduled_at) ?? 0;
  return vetrinaUntil !== null && now >= scheduledAt && now < vetrinaUntil;
}

export function isAdPromoted(
  ad: AdPromotionState,
  now = Date.now(),
): boolean {
  return isPremiumActive(ad, now) || isVetrinaActive(ad, now);
}

export function isPublicPhotoBlurred(
  ad: AdPromotionState,
  revealed: boolean,
  now = Date.now(),
): boolean {
  return !isAdPromoted(ad, now) && !revealed;
}

export function getPublicAdImages(
  ad: AdPhotoState,
  now = Date.now(),
): string[] {
  const storedImages = ad.images?.length
    ? ad.images
    : ad.image
      ? [ad.image]
      : [];

  return isAdPromoted(ad, now) ? storedImages : storedImages.slice(0, 1);
}

export function buildAdminVetrinaActivation(
  ad: AdPromotionState,
  durationDays: number,
  startedAt = new Date(),
) {
  if (![1, 3, 7, 30].includes(durationDays)) {
    throw new Error("Durata Vetrina non valida");
  }

  const vetrinaUntil = new Date(startedAt.getTime() + durationDays * DAY_MS);
  const premiumUntil = isPremiumActive(ad, startedAt.getTime())
    ? new Date(ad.premium_until as string)
    : null;
  const combinedUntil = premiumUntil && premiumUntil > vetrinaUntil
    ? premiumUntil
    : vetrinaUntil;

  return {
    is_sponsored: true,
    is_boosted: true,
    boost_type: "vetrina",
    boost_start_at: startedAt.toISOString(),
    boost_end_at: combinedUntil.toISOString(),
    boosted_until: combinedUntil.toISOString(),
    vetrina_scheduled_at: startedAt.toISOString(),
    vetrina_until: vetrinaUntil.toISOString(),
    vetrina_duration_days: durationDays,
    updated_at: startedAt.toISOString(),
  } as const;
}

export function buildAdminVetrinaRemoval(
  ad: AdPromotionState,
  now = Date.now(),
) {
  const premiumActive = isPremiumActive(ad, now);
  const premiumUntil = premiumActive ? ad.premium_until : null;

  return {
    is_sponsored: false,
    vetrina_scheduled_at: null,
    vetrina_until: null,
    vetrina_duration_days: null,
    is_boosted: premiumActive,
    is_premium: premiumActive,
    boost_type: premiumActive ? "premium" : null,
    boost_end_at: premiumUntil,
    boosted_until: premiumUntil,
    updated_at: new Date(now).toISOString(),
  } as const;
}
