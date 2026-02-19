import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PF_RATIO_FULLNESS_MAX } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * PF Ratio: 1–10 scale (10 = best).
 * - Quality combines fullness (slightly higher weight) and taste.
 * - Food over ~$20–30 is supposed to be good, we reward good + cheap (under that range) toward 10.
 */
const FULLNESS_WEIGHT = 1.1;
const PRICE_ANCHOR = 5;
const PRICE_SCALE = 30;

const QUALITY_FLOOR = 6; // below this (quality or fullness) the score is pulled down

export function calculatePFRatio(
  fullnessScore: number,
  tasteScore: number,
  pricePaid: number,
): number {
  if (pricePaid <= 0 || !Number.isFinite(pricePaid)) return 1;
  const quality =
    (FULLNESS_WEIGHT * fullnessScore + tasteScore) / (FULLNESS_WEIGHT + 1);
  const effectiveQuality =
    tasteScore >= QUALITY_FLOOR && fullnessScore >= QUALITY_FLOOR
      ? quality
      : Math.min(
          quality,
          fullnessScore < tasteScore ? fullnessScore * 0.95 : tasteScore,
        );

  const valueRaw =
    effectiveQuality * (PRICE_SCALE / (pricePaid + PRICE_ANCHOR));
  const normalized = Math.min(valueRaw / 10, 1);
  const score = 1 + 9 * normalized;
  return Math.max(1, Math.min(10, score));
}

export function formatPFRatio(value: number): string {
  return value.toFixed(2);
}

export function clampScore(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function isValidFullnessOrTaste(score: number): boolean {
  return Number.isFinite(score) && score >= 1 && score <= PF_RATIO_FULLNESS_MAX;
}

export function isValidPrice(price: number): boolean {
  return Number.isFinite(price) && price > 0;
}
