import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import CameraOverlay from "@/components/CameraOverlay";
import { Camera } from "lucide-react";

const CameraMemory = () => (
  <div className="flex min-h-screen flex-col bg-background pb-24">
    <div className="px-5 pt-12">
      <PageHeader title="Camera Memory" subtitle="AI face recognition active" icon={<Camera className="h-5 w-5" />} />
    </div>
    <div className="flex-1 px-5">
      <div className="h-[65vh] overflow-hidden rounded-2xl">
        <CameraOverlay />
      </div>
    </div>
    <BottomNav />
  </div>
);

export default CameraMemory;
