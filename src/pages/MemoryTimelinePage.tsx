import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import MemoryTimeline from "@/components/MemoryTimeline";
import { Clock } from "lucide-react";

const MemoryTimelinePage = () => (
  <div className="min-h-screen bg-background pb-24">
    <div className="px-5 pt-12">
      <PageHeader title="Memory Timeline" subtitle="Your recent memories and interactions" icon={<Clock className="h-5 w-5" />} />
      <MemoryTimeline />
    </div>
    <BottomNav />
  </div>
);

export default MemoryTimelinePage;
