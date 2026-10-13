/** Whole grams from a kilogram value. Nearest gram only undoes binary float error. */
export function kgToGrams(kg: number): number {
  return Math.round(kg * 1000);
}

/** Kilograms stored for WHO charts. 3975 gr stays 3.975 kg, not 3.98 kg. */
export function gramsToKg(grams: number): number {
  return grams / 1000;
}

/** 3975 → "3,975". Comma marks thousands. */
export function formatGrams(grams: number): string {
  return Math.trunc(grams).toLocaleString("en-US");
}
