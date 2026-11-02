import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface QuickActionOrbProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  colorClass?: string;
  delay?: number;
}

const QuickActionOrb = ({ icon: Icon, label, onClick, colorClass = "text-primary", delay = 0 }: QuickActionOrbProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay, type: "spring" }}
      className="flex flex-col items-center gap-3"
    >
      <button
        onClick={onClick}
        className="glass-orb group h-20 w-20 sm:h-24 sm:w-24 isolate"
        aria-label={label}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 transition-opacity group-hover:opacity-100" />
        <Icon className={`relative z-10 h-8 w-8 sm:h-10 sm:w-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12 ${colorClass}`} strokeWidth={1.5} />
      </button>
      <span className="text-sm font-medium tracking-wide text-foreground/90">{label}</span>
    </motion.div>
  );
};

export default QuickActionOrb;
