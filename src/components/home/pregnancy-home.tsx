import { BabyProfileCard } from "@/components/pregnancy/baby/baby-profile-card";
import { BabyPlusWidget } from "@/components/pregnancy/baby-plus/baby-plus-widget";
import { LiveGreetingClock } from "@/components/layout/live-greeting-clock";
import { KickWidget } from "@/components/pregnancy/kicks/kick-widget";
import { VitaminWidget } from "@/components/pregnancy/vitamins/vitamin-widget";
import { WaterWidget } from "@/components/pregnancy/water/water-widget";

export function PregnancyHome() {
  return (
    <div className="space-y-6">
      <LiveGreetingClock />
      <BabyProfileCard />
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
        <BabyPlusWidget className="h-full" />
        <VitaminWidget className="h-full" />
        <KickWidget className="h-full" />
        <WaterWidget className="h-full" />
      </div>
    </div>
  );
}
