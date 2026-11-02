import { useLocation, useNavigate } from "react-router-dom";
import { Camera, LayoutDashboard, Clock, MapPin, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { path: "/camera-memory", icon: Camera, label: "Camera" },
  { path: "/memory-timeline", icon: Clock, label: "Memory" },
  { path: "/map-tracking", icon: MapPin, label: "Map" },
  { path: "/caregiver-dashboard", icon: Shield, label: "Care" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-0">
      <div className="relative w-full max-w-md">
        <div className="absolute inset-x-0 bottom-0 h-24 bg-primary/5 blur-2xl" />
        <nav className="glass-nav relative mx-auto flex items-end justify-between px-6 pb-6 pt-4 rounded-t-[2.5rem] border-b-0">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-2xl p-2 transition-all duration-300",
                  isActive
                    ? "text-primary -translate-y-2 scale-110"
                    : "text-muted-foreground hover:-translate-y-1 hover:text-foreground/80"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute inset-0 rounded-2xl bg-primary/10 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <item.icon
                  className={cn(
                    "relative z-10 h-6 w-6 transition-all",
                    isActive
                      ? "drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]"
                      : ""
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "relative z-10 text-[10px] font-semibold tracking-wide transition-all",
                    isActive ? "opacity-100" : "opacity-70"
                  )}
                >
                  {item.label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="navIndicatorDot"
                    className="absolute -bottom-1.5 h-1 w-1 rounded-full bg-primary shadow-[0_0_8px_rgba(14,165,233,0.8)]"
                  />
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default BottomNav;
