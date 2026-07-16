import { describe, expect, it } from "vitest";
import {
  getPublicAdImages,
  isAdPromoted,
  isPremiumActive,
  isVetrinaActive,
} from "./ad-visibility";

const NOW = new Date("2026-07-16T12:00:00.000Z").getTime();

describe("visibilità pubblica delle foto", () => {
  it("mantiene oscurato un annuncio senza promozione", () => {
    const ad = { image: "prima.jpg", images: ["prima.jpg", "seconda.jpg"] };

    expect(isAdPromoted(ad, NOW)).toBe(false);
    expect(getPublicAdImages(ad, NOW)).toEqual(["prima.jpg"]);
  });

  it("mantiene oscurata una promozione scaduta", () => {
    const ad = {
      image: "prima.jpg",
      images: ["prima.jpg", "seconda.jpg"],
      premium_until: "2026-07-15T12:00:00.000Z",
      vetrina_until: "2026-07-16T11:59:59.000Z",
    };

    expect(isAdPromoted(ad, NOW)).toBe(false);
    expect(getPublicAdImages(ad, NOW)).toEqual(["prima.jpg"]);
  });

  it("mostra le foto quando Premium è realmente attivo", () => {
    const ad = {
      images: ["prima.jpg", "seconda.jpg"],
      premium_until: "2026-07-17T12:00:00.000Z",
    };

    expect(isPremiumActive(ad, NOW)).toBe(true);
    expect(getPublicAdImages(ad, NOW)).toEqual(ad.images);
  });

  it("rispetta inizio e fine reali della Vetrina", () => {
    const scheduled = {
      vetrina_scheduled_at: "2026-07-16T13:00:00.000Z",
      vetrina_until: "2026-07-17T13:00:00.000Z",
    };
    const active = {
      ...scheduled,
      vetrina_scheduled_at: "2026-07-16T11:00:00.000Z",
    };

    expect(isVetrinaActive(scheduled, NOW)).toBe(false);
    expect(isVetrinaActive(active, NOW)).toBe(true);
  });
});
