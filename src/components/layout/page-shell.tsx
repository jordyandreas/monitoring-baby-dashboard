import { PageIntro } from "@/components/layout/page-intro";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full min-w-0 max-w-3xl flex-1 overflow-x-clip px-4 pt-4 md:px-6 md:pt-8 lg:max-w-5xl">
      <PageIntro />
      {children}
    </main>
  );
}
