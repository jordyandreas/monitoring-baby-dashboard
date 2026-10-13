export function DayCountCard({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl glass-regular px-4 py-3">
          <p className="text-sm text-muted-foreground">{item.label}</p>
          <p className="text-lg font-semibold tabular-nums">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
