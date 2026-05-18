import { BabyProfileCard } from "@/components/baby/baby-profile-card";
import { BabyPlusWidget } from "@/components/baby-plus/baby-plus-widget";
import { KickWidget } from "@/components/kicks/kick-widget";

export default function HomePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <BabyProfileCard />
      <div className="space-y-6">
        <BabyPlusWidget />
        <KickWidget />
      </div>
    </div>
  );
}
