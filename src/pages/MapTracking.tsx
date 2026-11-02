import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import SafeZoneMap from "@/components/SafeZoneMap";
import { MapPin } from "lucide-react";

const MapTracking = () => (
  <div className="min-h-screen bg-background pb-24">
    <div className="px-5 pt-12">
      <PageHeader title="Safe Zone Map" subtitle="Real-time location monitoring" icon={<MapPin className="h-5 w-5" />} />
      <SafeZoneMap />
    </div>
    <BottomNav />
  </div>
);

export default MapTracking;
