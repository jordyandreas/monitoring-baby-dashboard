export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-6 md:px-6 md:pb-10 md:pt-8 lg:max-w-5xl">
      {children}
    </main>
  );
}
