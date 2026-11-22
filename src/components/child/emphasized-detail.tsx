const AMOUNT = String.raw`\d+\s*(?:jam|j|h)\b(?:\s+\d+\s*(?:mnt|min|m)\b)?|\d+\s*(?:ml|mnt|min|m)\b`;
const SPLIT = new RegExp(`(${AMOUNT})`, "gi");
const WHOLE = new RegExp(`^(?:${AMOUNT})$`, "i");

export function EmphasizedDetail({ text }: { text: string }) {
  const parts = text.split(SPLIT);
  return (
    <p className="text-sm text-muted-foreground">
      {parts.map((part, index) =>
        WHOLE.test(part) ? (
          <span key={index} className="font-semibold text-foreground">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </p>
  );
}
