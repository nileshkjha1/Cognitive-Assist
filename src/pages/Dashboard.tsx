import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Clock, MapPin, Shield, Brain, Activity, Users, UserPlus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import StatusBadge from "@/components/StatusBadge";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import QuickActionOrb from "@/components/QuickActionOrb";
import { getAllPeople, deletePerson, Person } from "@/lib/personStore";

const quickActions = [
  { icon: Camera, label: "Camera", path: "/camera-memory", color: "text-primary", bg: "bg-primary/10" },
  { icon: Clock, label: "Memories", path: "/memory-timeline", color: "text-accent", bg: "bg-accent/10" },
  { icon: MapPin, label: "Location", path: "/map-tracking", color: "text-safe", bg: "bg-safe/10" },
  { icon: UserPlus, label: "Add People", path: "/add-person", color: "text-info", bg: "bg-info/10" },
];

const recentPeople = [
  { name: "Ganesh", relationship: "Son", time: "2h ago" },
  { name: "Sarah", relationship: "Daughter", time: "Yesterday" },
  { name: "Dr. Patel", relationship: "Doctor", time: "2 days ago" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [recentPeople, setRecentPeople] = useState<Person[]>([]);

  useEffect(() => {
    // Load people from store on mount
    setRecentPeople(getAllPeople());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deletePerson(id);
    setRecentPeople(getAllPeople());
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { currentTarget, clientX, clientY } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = ((clientX - left) / width) * 100;
    const y = ((clientY - top) / height) * 100;
    currentTarget.style.setProperty("--x", `${x}%`);
    currentTarget.style.setProperty("--y", `${y}%`);
  };

  return (
    <div 
      className="min-h-screen bg-background pb-24 transition-colors duration-300" 
      onMouseMove={handleMouseMove}
      style={{
        background: "radial-gradient(circle at var(--x, 50%) var(--y, 50%), hsla(199, 89%, 48%, 0.15) 0%, transparent 50%), hsl(var(--background))"
      }}
    >
      {/* Header area */}
      <div className="px-5 pt-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 flex items-center justify-between"
        >
          <div>
            <p className="text-caption text-muted-foreground">Good Morning</p>
            <h1 className="text-display gradient-text">Guardian</h1>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <Brain className="h-6 w-6 text-primary" />
          </div>
        </motion.div>

        {/* Status card */}
        <GlassCard className="mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-safe" />
              <div>
                <p className="text-body font-medium">System Status</p>
                <p className="text-caption text-muted-foreground">All monitors active</p>
              </div>
            </div>
            <StatusBadge status="safe" label="Active" />
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <div className="mt-8">
          <p className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase opacity-80">Quick Actions</p>
          <div className="grid grid-cols-4 gap-4 px-1">
            {quickActions.map((action, i) => (
              <QuickActionOrb
                key={action.label}
                icon={action.icon}
                label={action.label}
                onClick={() => navigate(action.path)}
                colorClass={action.color}
                delay={i * 0.1}
              />
            ))}
          </div>
        </div>

        {/* Recent People */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-caption font-semibold text-muted-foreground">Recent People</p>
            <button onClick={() => navigate("/camera-memory")} className="text-caption text-primary">
              View All
            </button>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {recentPeople.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6 text-muted-foreground text-sm font-medium">
                  No recognized people yet.
                  <br/>
                  <button onClick={() => navigate("/add-person")} className="mt-2 text-primary hover:underline">Add someone</button>
                </motion.div>
              )}
              {recentPeople.map((person, i) => (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="glass-card-hover flex items-center gap-4 cursor-pointer relative group p-4">
                    <div className="glass-orb h-12 w-12 shrink-0 overflow-hidden">
                      {person.profileImage ? (
                        <img src={person.profileImage} alt={person.name} className="h-full w-full object-cover" />
                      ) : (
                        <Users className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold tracking-wide truncate">{person.name}</p>
                      <p className="text-xs font-medium text-muted-foreground/80 truncate">{person.relationship}</p>
                    </div>
                    
                    {/* Time / Actions */}
                    <div className="flex items-center gap-2">
                       <p className="text-[10px] font-semibold text-muted-foreground bg-white/5 px-2 py-1 rounded-full border border-white/5 whitespace-nowrap">
                         {new Date(person.lastInteraction).toLocaleDateString()}
                       </p>
                       <button 
                         onClick={(e) => handleDelete(person.id, e)}
                         className="h-8 w-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                         aria-label="Delete person"
                       >
                         <Trash2 className="h-4 w-4" />
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Location Summary */}
        <div className="mt-6">
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-safe/10">
                <MapPin className="h-5 w-5 text-safe" />
              </div>
              <div className="flex-1">
                <p className="text-body font-medium">Location</p>
                <p className="text-caption text-muted-foreground">Inside safe zone • Home</p>
              </div>
              <StatusBadge status="safe" label="Safe" />
            </div>
          </GlassCard>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
