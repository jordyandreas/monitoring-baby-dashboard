export function EmphasizedDetail({ text }: { text: string }) {
  const parts = text.split(/(\d+\s*(?:ml|min|mnt))/gi);
  return (
    <p className="text-sm text-muted-foreground">
      {parts.map((part, index) =>
        /^\d+\s*(?:ml|min|mnt)$/i.test(part) ? (
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
