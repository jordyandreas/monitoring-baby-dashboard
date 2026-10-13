import type { VaccineKey } from "@/lib/child/types";

export const VACCINE_GROUPS: readonly { ageKey: string; keys: readonly VaccineKey[] }[] = [
  { ageKey: "vaccines.ageBirth", keys: ["hb0"] },
  { ageKey: "vaccines.age1", keys: ["bcg", "opv1"] },
  { ageKey: "vaccines.age2", keys: ["dpt1", "opv2", "pcv1"] },
  { ageKey: "vaccines.age3", keys: ["dpt2", "opv3"] },
  { ageKey: "vaccines.age4", keys: ["dpt3", "opv4", "ipv", "pcv2"] },
  { ageKey: "vaccines.age9", keys: ["mr"] },
];

const VACCINE_LABEL_KEYS: Record<VaccineKey, string> = {
  hb0: "vaccines.hb0",
  bcg: "vaccines.bcg",
  opv1: "vaccines.opv1",
  opv2: "vaccines.opv2",
  opv3: "vaccines.opv3",
  opv4: "vaccines.opv4",
  dpt1: "vaccines.dpt1",
  dpt2: "vaccines.dpt2",
  dpt3: "vaccines.dpt3",
  ipv: "vaccines.ipv",
  pcv1: "vaccines.pcv1",
  pcv2: "vaccines.pcv2",
  mr: "vaccines.mr",
};

export function vaccineLabelKey(key: VaccineKey): string {
  return VACCINE_LABEL_KEYS[key];
}
