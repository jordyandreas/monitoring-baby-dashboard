/**
 * Sync id.ts from en.ts — copies missing keys (English placeholder).
 * Existing Indonesian strings in id.ts are preserved.
 */
import {
  collectUsedKeys,
  getEnCatalog,
  getIdCatalog,
  writeIdCatalog,
} from "./i18n-utils";

const enFlat = getEnCatalog();
const idFlat = getIdCatalog();
const used = collectUsedKeys();

let added = 0;

for (const key of enFlat.keys()) {
  if (!idFlat.has(key)) {
    idFlat.set(key, enFlat.get(key)!);
    added++;
  }
}

for (const key of used) {
  if (!enFlat.has(key)) {
    console.warn(`  ⚠️  ${key} — used in code but missing in en.ts (add to en.ts first)`);
  }
}

const outPath = writeIdCatalog(idFlat);
console.log(`✅ Synced id.ts (${added} new key(s) copied from en)`);
console.log(`   ${outPath}`);
if (added > 0) {
  console.log("\nNext: translate new strings in id.ts.");
}
