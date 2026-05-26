import { BabyProfileCard } from "@/components/baby/baby-profile-card";
import { BabyPlusWidget } from "@/components/baby-plus/baby-plus-widget";
import { LiveGreetingClock } from "@/components/layout/live-greeting-clock";
import { KickWidget } from "@/components/kicks/kick-widget";
import { VitaminWidget } from "@/components/vitamins/vitamin-widget";
import { WaterWidget } from "@/components/water/water-widget";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <LiveGreetingClock />
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <BabyProfileCard className="h-full" />
        <BabyPlusWidget className="h-full" />
        <VitaminWidget className="h-full" />
        <KickWidget className="h-full" />
        <WaterWidget className="h-full lg:col-span-2" />
      </div>
    </div>
  );
}
