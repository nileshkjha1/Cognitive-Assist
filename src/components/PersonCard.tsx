import { motion } from "framer-motion";
import { User, MessageSquare, Clock } from "lucide-react";
import GlassCard from "./GlassCard";

interface PersonCardProps {
  name: string;
  relationship: string;
  lastConversation: string;
  recentMemory: string;
  lastSeen: string;
  avatarColor?: string;
}

const PersonCard = ({ name, relationship, lastConversation, recentMemory, lastSeen }: PersonCardProps) => (
  <div className="glass-card-hover">
    <div className="flex items-start gap-4">
      <div className="glass-orb h-14 w-14 shrink-0 flex items-center justify-center text-primary">
        <User className="h-7 w-7" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="text-lg font-semibold gradient-text">{name}</h3>
          <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent border border-accent/20">
            {relationship}
          </span>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-2">
            <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-medium">{lastConversation}</p>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-medium">{recentMemory}</p>
          </div>
        </div>

        <p className="mt-4 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest text-right">Last seen: {lastSeen}</p>
      </div>
    </div>
  </div>
);

export default PersonCard;
