import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "safe" | "warning" | "alert";
  label: string;
}

const StatusBadge = ({ status, label }: StatusBadgeProps) => {
  const styles = {
    safe: "text-safe drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]",
    warning: "text-warning drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]",
    alert: "text-destructive drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]",
  };

  const bgStyles = {
    safe: "from-safe/20",
    warning: "from-warning/20",
    alert: "from-destructive/20"
  };

  return (
    <div className="plasma-container glass-orb inline-flex items-center gap-2 px-4 py-2 font-medium overflow-hidden">
      <div className={cn("plasma-bubble animate-plasma", bgStyles[status])} />
      <span className={cn("relative z-10 h-2 w-2 rounded-full animate-pulse", {
        "bg-safe": status === "safe",
        "bg-warning": status === "warning",
        "bg-destructive": status === "alert",
      })} />
      <span className={cn("relative z-10 tracking-wide text-sm", styles[status])}>{label}</span>
    </div>
  );
};

export default StatusBadge;
