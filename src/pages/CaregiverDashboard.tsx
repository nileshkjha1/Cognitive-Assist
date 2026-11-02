import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Shield, Users, MapPin, Bell, MessageSquare, Settings, Plus } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import StatusBadge from "@/components/StatusBadge";

const alerts = [
  { text: "Patient took morning medication", time: "9:00 AM", type: "safe" as const },
  { text: "Visitor detected: Dr. Patel", time: "10:30 AM", type: "safe" as const },
  { text: "Patient near zone boundary", time: "2:15 PM", type: "warning" as const },
];

import { getAllPeople, deletePerson, Person } from "@/lib/personStore";
import { useNavigate } from "react-router-dom";

const CaregiverDashboard = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);

  useEffect(() => {
    setPeople(getAllPeople());
  }, []);

  const totalConversations = people.reduce((sum, p) => sum + (p.conversations?.length || 0), 0);

  const stats = [
    { icon: Users, label: "Known People", value: people.length.toString(), color: "text-primary", bg: "bg-primary/10", onClick: () => navigate("/known-people") },
    { icon: MessageSquare, label: "Conversations", value: totalConversations.toString(), color: "text-accent", bg: "bg-accent/10", onClick: () => navigate("/memory-timeline") },
    { icon: MapPin, label: "Zone Exits", value: "0", color: "text-safe", bg: "bg-safe/10" },
    { icon: Bell, label: "Alerts Today", value: "3", color: "text-warning", bg: "bg-warning/10" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
    <div className="px-5 pt-12">
      <PageHeader title="Caregiver Panel" subtitle="Monitor and manage patient care" icon={<Shield className="h-5 w-5" />} />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div 
                onClick={stat.onClick} 
                className={`glass-card-hover h-full flex flex-col justify-center ${stat.onClick ? "cursor-pointer" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-display text-2xl">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center justify-between">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex gap-3">
        <button 
          onClick={() => navigate('/add-person')}
          className="glass-button flex flex-1 items-center justify-center gap-2 text-caption"
        >
          <Plus className="h-4 w-4" /> Add Person
        </button>
        <button 
          onClick={() => navigate('/settings')}
          className="glass-button flex flex-1 items-center justify-center gap-2 text-caption active:scale-95 transition-transform"
        >
          <Settings className="h-4 w-4" /> Settings
        </button>
      </div>

      {/* Recent Alerts */}
      <div className="mt-6">
        <p className="mb-3 text-caption font-semibold text-muted-foreground">Today's Activity</p>
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <GlassCard className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <p className="text-body">{alert.text}</p>
                  <p className="text-[12px] text-muted-foreground">{alert.time}</p>
                </div>
                <StatusBadge status={alert.type} label={alert.type === "safe" ? "OK" : "Warning"} />
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
      <BottomNav />
    </div>
  );
};

export default CaregiverDashboard;
