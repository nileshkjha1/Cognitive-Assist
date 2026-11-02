import { motion } from "framer-motion";
import { TranscriptLine } from "@/hooks/useSpeechRecognition";

interface SubtitleOverlayProps {
  lines: TranscriptLine[];
  interim: string;
  isListening: boolean;
}

const SubtitleOverlay = ({ lines, interim, isListening }: SubtitleOverlayProps) => {
  if (!isListening && lines.length === 0) return null;

  const visibleLines = lines.slice(-6);

  return (
    <div
      style={{
        position: "absolute",
        bottom: "80px",
        left: 0,
        right: 0,
        height: "35%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        zIndex: 50,
        pointerEvents: "none",
        padding: "0 12px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4, overflowY: "hidden" }}>
        {visibleLines.map((line) => (
          <motion.div
            key={line.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              background: "rgba(0,0,0,0.6)",
              borderRadius: 8,
              padding: "6px 12px",
              marginBottom: 4,
              fontSize: 15,
              lineHeight: 1.5,
              maxWidth: "90%",
              wordWrap: "break-word",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 12,
                marginRight: 8,
                fontFamily: "monospace",
              }}
            >
              [{line.timestamp}]
            </span>
            <span
              style={{
                fontWeight: 700,
                color: line.speaker === "You" ? "#a78bfa" : "#38bdf8",
                marginRight: 8,
              }}
            >
              {line.speaker}:
            </span>
            <span style={{ color: "#ffffff" }}>{line.text}</span>
          </motion.div>
        ))}

        {interim && (
          <div
            style={{
              background: "rgba(0,0,0,0.4)",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 15,
              lineHeight: 1.5,
              maxWidth: "90%",
              fontStyle: "italic",
              color: "#999",
            }}
          >
            <span style={{ color: "#a78bfa", fontWeight: 700, marginRight: 8 }}>
              You:
            </span>
            {interim}...
          </div>
        )}
      </div>

      {isListening && lines.length === 0 && !interim && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#22c55e",
            }}
          />
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
            Listening...
          </span>
        </div>
      )}
    </div>
  );
};

export default SubtitleOverlay;
