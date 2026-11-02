import { motion } from "framer-motion";
import { Mic, StopCircle, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Person } from "@/lib/personStore";

export interface Message {
  id: string;
  text: string;
  speaker: "You" | string;
  timestamp: string;
  isInterim?: boolean;
}

interface LiveConversationUIProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  messages: Message[];
  interimTranscript: string;
  recognizedPerson: Person | null;
  currentSpeaker: "You" | "Them";
  onSpeakerToggle: (speaker: "You" | "Them") => void;
}

const LiveConversationUI = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  messages,
  interimTranscript,
  recognizedPerson,
  currentSpeaker,
  onSpeakerToggle,
}: LiveConversationUIProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, interimTranscript]);

  const personName = recognizedPerson?.name || "Unknown Person";
  const activeSpeakerName = currentSpeaker === "You" ? "You" : personName;

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col justify-end bg-gradient-to-t from-background/95 via-background/80 to-transparent p-4 pb-6 pt-20">
      
      {/* Live Chat Area */}
      {isRecording && (
        <div 
          ref={scrollRef}
          className="mb-4 max-h-[40vh] overflow-y-auto overflow-x-hidden rounded-xl space-y-3 px-2 pr-4 scrollbar-hide"
        >
          {messages.map((msg) => {
            const isMe = msg.speaker === "You";
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex max-w-[85%] flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <span className="mb-1 text-[10px] font-medium text-primary-foreground/60 px-1">
                    {msg.speaker}
                  </span>
                  <div 
                    className={`rounded-2xl px-4 py-2 ${
                      isMe 
                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                        : "bg-muted/80 backdrop-blur-md text-foreground rounded-tl-sm"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Interim text (currently typing line) */}
          {interimTranscript.trim() && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex w-full ${currentSpeaker === "You" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex max-w-[85%] flex-col ${currentSpeaker === "You" ? "items-end" : "items-start"}`}>
                <span className="mb-1 flex items-center gap-1 text-[10px] font-medium text-primary-foreground/60 px-1">
                  {activeSpeakerName}
                  <span className="flex gap-0.5">
                    <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="h-1 w-1 rounded-full bg-primary/60"/>
                    <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="h-1 w-1 rounded-full bg-primary/60"/>
                    <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="h-1 w-1 rounded-full bg-primary/60"/>
                  </span>
                </span>
                <div 
                  className={`rounded-2xl px-4 py-2 opacity-70 ${
                    currentSpeaker === "You" 
                      ? "bg-primary/50 text-primary-foreground rounded-tr-sm" 
                      : "bg-muted/50 backdrop-blur-md text-foreground rounded-tl-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed italic">{interimTranscript}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Controls Container */}
      <div className="flex items-center justify-between gap-3">
        {/* Speaker Toggle (Only visible while recording) */}
        {isRecording ? (
          <div className="flex bg-foreground/30 backdrop-blur-md rounded-full p-1 border border-primary/20">
            <button
              onClick={() => onSpeakerToggle("You")}
              className={`flex h-10 w-16 items-center justify-center rounded-full text-xs font-medium transition-all ${
                currentSpeaker === "You" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-primary-foreground/70 hover:text-primary-foreground"
              }`}
            >
              You
            </button>
            <button
              onClick={() => onSpeakerToggle("Them")}
              className={`flex h-10 w-20 items-center justify-center rounded-full text-xs font-medium transition-all ${
                currentSpeaker === "Them" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-primary-foreground/70 hover:text-primary-foreground"
              }`}
            >
              <User className="mr-1 h-3 w-3" />
              {personName.split(" ")[0]}
            </button>
          </div>
        ) : (
          <div className="text-sm text-primary-foreground/80 font-medium px-2 flex-1">
            {recognizedPerson 
              ? `Ready to talk with ${personName.split(" ")[0]}?` 
              : "Detecting faces..."}
          </div>
        )}

        {/* Record Button */}
        {isRecording ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onStopRecording}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90"
          >
            <StopCircle className="h-5 w-5" />
            <span className="font-semibold">Stop Conversation</span>
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onStartRecording}
            disabled={!recognizedPerson}
            className={`flex h-12 w-full max-w-[200px] items-center justify-center gap-2 rounded-full shadow-lg font-semibold transition-all ${
              recognizedPerson 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
            }`}
          >
            <Mic className="h-5 w-5" />
            <span>Start Conversation</span>
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default LiveConversationUI;
