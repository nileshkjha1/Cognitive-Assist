import { motion, AnimatePresence } from "framer-motion";
import { User, MessageSquare, Clock, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Person } from "@/lib/personStore";

interface FaceBoxCardProps {
  person: Person | null;
  box: { x: number; y: number; width: number; height: number; score?: number };
  videoWidth: number;
  videoHeight: number;
  containerWidth: number;
  containerHeight: number;
  isNew?: boolean;
}

function getConfidenceColor(score: number): string {
  if (score >= 0.8) return "#22c55e";
  if (score >= 0.6) return "#f59e0b";
  return "#ef4444";
}

function getConfidenceLabel(score: number): string {
  if (score >= 0.8) return "High";
  if (score >= 0.6) return "Medium";
  return "Low";
}

const FaceBoxCard = ({ person, box, videoWidth, videoHeight, containerWidth, containerHeight, isNew }: FaceBoxCardProps) => {
  const navigate = useNavigate();
  const confidence = (box.score ?? 0) * 100;
  const confColor = getConfidenceColor(box.score ?? 0);

  const scaleX = containerWidth / videoWidth;
  const scaleY = containerHeight / videoHeight;

  const scaledX = box.x * scaleX;
  const scaledY = box.y * scaleY;
  const scaledW = box.width * scaleX;
  const scaledH = box.height * scaleY;

  const cardX = scaledX + scaledW + 12;
  const cardY = scaledY;
  const cardMaxWidth = containerWidth - cardX - 8;

  const lastConvo = person?.conversations?.[0];
  const timeSince = person?.lastInteraction
    ? getTimeSince(new Date(person.lastInteraction))
    : "";

  const cornerSize = Math.max(12, Math.min(scaledW, scaledH) * 0.15);

  return (
    <AnimatePresence>
      <motion.div
        key={`face-box-${box.x.toFixed(0)}-${box.y.toFixed(0)}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="absolute pointer-events-none"
        style={{ left: scaledX, top: scaledY, width: scaledW, height: scaledH }}
      >
        <div className="relative h-full w-full">
          {/* Corner accents only (no full border) */}
          <div className="absolute inset-0">
            {/* Top-left */}
            <div
              className="absolute top-0 left-0"
              style={{
                width: cornerSize,
                height: cornerSize,
                borderLeft: `3px solid ${confColor}`,
                borderTop: `3px solid ${confColor}`,
                borderTopLeftRadius: 6,
              }}
            />
            {/* Top-right */}
            <div
              className="absolute top-0 right-0"
              style={{
                width: cornerSize,
                height: cornerSize,
                borderRight: `3px solid ${confColor}`,
                borderTop: `3px solid ${confColor}`,
                borderTopRightRadius: 6,
              }}
            />
            {/* Bottom-left */}
            <div
              className="absolute bottom-0 left-0"
              style={{
                width: cornerSize,
                height: cornerSize,
                borderLeft: `3px solid ${confColor}`,
                borderBottom: `3px solid ${confColor}`,
                borderBottomLeftRadius: 6,
              }}
            />
            {/* Bottom-right */}
            <div
              className="absolute bottom-0 right-0"
              style={{
                width: cornerSize,
                height: cornerSize,
                borderRight: `3px solid ${confColor}`,
                borderBottom: `3px solid ${confColor}`,
                borderBottomRightRadius: 6,
              }}
            />
            {/* Animated dashed border */}
            <div
              className="absolute inset-[3px] rounded-md"
              style={{
                border: `1px dashed ${confColor}50`,
                animation: "borderDash 2s linear infinite",
              }}
            />
          </div>

          {/* Name label below box */}
          <motion.div
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
          >
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold shadow-lg"
              style={{
                background: `${confColor}e6`,
                backdropFilter: "blur(8px)",
                color: "#fff",
              }}
            >
              <span>{person ? person.name : "Unknown Person"}</span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                style={{ background: "rgba(0,0,0,0.3)" }}
              >
                {confidence.toFixed(0)}%
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Info card positioned to the right of face box */}
      {person && cardMaxWidth > 100 && (
        <motion.div
          key={`info-card-${person?.id || "unknown"}`}
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -10, opacity: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 25 }}
          className="absolute pointer-events-none z-20"
          style={{
            left: cardX,
            top: cardY,
            maxWidth: Math.min(cardMaxWidth, 280),
          }}
        >
          <div className="rounded-xl border border-primary/20 bg-background/80 p-3 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-1.5 mb-2">
              <User className="h-3.5 w-3.5 text-primary" />
              <span className="text-[12px] font-bold text-primary">{person.relationship}</span>
              {timeSince && (
                <span className="ml-auto text-[10px] text-primary-foreground/50">{timeSince}</span>
              )}
            </div>

            <p className="text-[11px] leading-tight text-primary-foreground/80 mb-2">
              {person.description}
            </p>

            {lastConvo && (
              <div className="border-t border-primary-foreground/10 pt-1.5">
                <div className="flex items-center gap-1 mb-1">
                  <MessageSquare className="h-3 w-3 text-accent" />
                  <span className="text-[10px] font-semibold text-accent">Last Conversation</span>
                </div>
                <p className="text-[11px] leading-normal text-primary-foreground/80 line-clamp-4">
                  {lastConvo.summary}
                </p>
              </div>
            )}

            {person.recentMemories?.[0] && (
              <div className="border-t border-primary-foreground/10 pt-1.5 mt-1.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <Clock className="h-2.5 w-2.5 text-warning" />
                  <span className="text-[9px] font-medium text-warning">Recent Memory</span>
                </div>
                <p className="text-[10px] leading-tight text-primary-foreground/60 line-clamp-1">
                  {person.recentMemories[0]}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* New person card */}
      {isNew && !person && (
        <motion.div
          key="new-person-card"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute pointer-events-auto z-20 cursor-pointer"
          onClick={() => navigate("/add-person")}
          style={{
            left: cardX,
            top: cardY,
            maxWidth: Math.min(cardMaxWidth, 180),
          }}
        >
          <div className="rounded-xl border border-warning/30 bg-background/80 p-3 shadow-xl backdrop-blur-xl hover:bg-background/95 transition-colors">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-warning" />
              <span className="text-[11px] font-semibold text-warning">New Person</span>
            </div>
            <p className="mt-1 text-[10px] text-primary-foreground/60">
              Tap to add name & relationship
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function getTimeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default FaceBoxCard;
