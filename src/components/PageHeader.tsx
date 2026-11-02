import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
}

const PageHeader = ({ title, subtitle, icon, actionIcon, onAction }: PageHeaderProps) => (
  <motion.div
    className="mb-6 flex items-center justify-between glass-panel px-6 py-4"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, type: "spring" }}
  >
    <div>
      <h1 className="text-2xl font-semibold tracking-tight gradient-text">{title}</h1>
      {subtitle && <p className="text-sm font-medium text-muted-foreground/80 mt-1">{subtitle}</p>}
    </div>
    {icon && !actionIcon && (
      <div className="glass-orb flex h-14 w-14 shrink-0 items-center justify-center text-primary shadow-lg animate-orb-float">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
        <div className="relative z-10">{icon}</div>
      </div>
    )}
    {actionIcon && (
      <button 
        onClick={onAction}
        className="glass-orb flex h-12 w-12 shrink-0 items-center justify-center text-foreground hover:text-primary transition-colors shadow-lg active:scale-95"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-secondary/40 to-transparent" />
        <div className="relative z-10">{actionIcon}</div>
      </button>
    )}
  </motion.div>
);

export default PageHeader;
