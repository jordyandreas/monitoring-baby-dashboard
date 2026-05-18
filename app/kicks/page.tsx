import { KickForm } from "@/components/kicks/kick-form";
import { KickList } from "@/components/kicks/kick-list";
import { KickSummary } from "@/components/kicks/kick-summary";

export default function KicksPage() {
  return (
    <div className="space-y-6">
      <KickForm />
      <KickSummary />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold md:text-xl">Recent kicks</h2>
        <KickList />
      </section>
    </div>
  );
}
