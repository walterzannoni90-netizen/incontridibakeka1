export interface AdPromotionState {
  premium_until?: string | null;
  vetrina_until?: string | null;
  vetrina_scheduled_at?: string | null;
}

export interface AdPhotoState extends AdPromotionState {
  image?: string | null;
  images?: string[] | null;
}

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
