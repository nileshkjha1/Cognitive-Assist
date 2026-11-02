import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, LogOut, User, Mail, Shield, UserRound } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import { useAuthStore } from "@/lib/authStore";

const Settings = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <PageHeader 
        title="Settings & Profile" 
        actionIcon={<ArrowLeft className="h-5 w-5" />}
        onAction={() => navigate(-1)}
      />

      <main className="flex-1 overflow-y-auto p-5 pb-24">
        {currentUser ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Profile Hero */}
            <div className="flex flex-col items-center pt-4">
              <div className="relative mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30 shadow-[0_0_15px_hsl(199,89%,48%,0.2)]">
                <span className="text-3xl font-bold text-primary">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
                <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-background border border-border flex items-center justify-center">
                  <Shield className="h-3 w-3 text-accent" />
                </div>
              </div>
              <h2 className="text-title text-foreground">{currentUser.name}</h2>
              <p className="text-caption text-primary font-medium tracking-wide">CAREGIVER ADMIN</p>
            </div>

            {/* Profile Details Card */}
            <GlassCard className="space-y-5">
              <h3 className="text-body font-semibold text-foreground mb-4 border-b border-border pb-2">Account Information</h3>
              
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/80">
                  <UserRound className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">Username</p>
                  <p className="text-body font-medium text-foreground">@{currentUser.username}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/80">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">Email Address</p>
                  <p className="text-body font-medium text-foreground">{currentUser.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/80">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">Account ID</p>
                  <p className="text-body font-medium text-foreground uppercase tracking-wider">{currentUser.id.split('-')[0]}</p>
                </div>
              </div>
            </GlassCard>

            {/* Danger Zone */}
            <div className="pt-6">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 py-3.5 text-body font-semibold text-destructive transition-colors hover:bg-destructive/20 active:scale-[0.98]"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center">
            <p className="text-body text-muted-foreground mb-4">No active session found.</p>
            <button
              onClick={() => navigate("/login")}
              className="rounded-xl bg-primary px-6 py-2 text-primary-foreground font-semibold"
            >
              Return to Login
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Settings;
