import {
  collectUsedKeys,
  getEnCatalog,
  getIdCatalog,
} from "./i18n-utils";

const used = collectUsedKeys();
const enFlat = getEnCatalog();
const idFlat = getIdCatalog();

const missingInEn: string[] = [];
const missingInId: string[] = [];
const unusedInEn: string[] = [];

for (const key of used) {
  if (!enFlat.has(key)) missingInEn.push(key);
  if (!idFlat.has(key)) missingInId.push(key);
}

for (const key of enFlat.keys()) {
  if (!used.has(key)) unusedInEn.push(key);
}

let exitCode = 0;

if (missingInEn.length > 0) {
  exitCode = 1;
  console.error("\n❌ Used in code but missing in en.ts:\n");
  for (const key of missingInEn.sort()) {
    console.error(`  - ${key}`);
  }
  console.error("\nAdd these to lib/i18n/messages/en.ts, then run: pnpm i18n:sync\n");
}

if (missingInId.length > 0) {
  exitCode = 1;
  console.error("\n❌ In en.ts but missing in id.ts:\n");
  for (const key of missingInId.sort()) {
    console.error(`  - ${key}`);
  }
  console.error("\nRun: pnpm i18n:sync\n");
}

if (unusedInEn.length > 0) {
  console.warn("\n⚠️  In en.ts but not found via t(\"...\") in source (may be OK):\n");
  for (const key of unusedInEn.sort()) {
    console.warn(`  - ${key}`);
  }
}

if (exitCode === 0) {
  console.log("✅ i18n: all used keys exist in en.ts and id.ts");
} else {
  process.exit(exitCode);
}
