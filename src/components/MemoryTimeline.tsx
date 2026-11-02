import { motion } from "framer-motion";
import { MessageSquare, Calendar, UserRound, Sparkles } from "lucide-react";
import GlassCard from "./GlassCard";
import { getAllPeople } from "@/lib/personStore";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { format, formatDistanceToNow } from "date-fns";

const MemoryTimeline = () => {
  const people = getAllPeople();
  const peopleWithConvos = people.filter(
    (p) => p.conversations && p.conversations.length > 0
  );

  if (peopleWithConvos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-foreground/10">
          <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
        </div>
        <p className="text-body font-semibold text-primary-foreground/60">
          No conversations recorded yet
        </p>
        <p className="text-caption mt-2 max-w-[260px] text-muted-foreground/70">
          Start a conversation from the Camera tab to see your memory timeline
          here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {peopleWithConvos.map((person, pi) => {
        const lastInteraction = person.lastInteraction
          ? formatDistanceToNow(new Date(person.lastInteraction), {
              addSuffix: true,
            })
          : "";
        const latestSummary = person.conversations[0]?.summary || "";
        const summaryPreview =
          latestSummary.length > 100
            ? latestSummary.substring(0, 100) + "..."
            : latestSummary;

        return (
          <div key={person.id}>
            {/* Person header card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pi * 0.1 }}
              className="mb-4"
            >
              <div
                className="flex items-center gap-3 rounded-2xl p-4"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary overflow-hidden shrink-0">
                  {person.profileImage ? (
                    <img
                      src={person.profileImage}
                      alt={person.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-body font-semibold text-primary">
                    {person.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {person.relationship}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground/70">
                    <span>
                      {person.conversations.length} conversation
                      {person.conversations.length !== 1 ? "s" : ""} recorded
                    </span>
                    {lastInteraction && (
                      <span>Last: {lastInteraction}</span>
                    )}
                  </div>
                  {summaryPreview && (
                    <p className="mt-1.5 text-[11px] text-primary-foreground/50 line-clamp-1">
                      {summaryPreview}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Conversations timeline */}
            <div className="relative ml-4 space-y-4 border-l-2 border-border pl-6">
              <Accordion type="single" collapsible className="w-full">
                {person.conversations.map((convo, i) => {
                  const convoDate = new Date(convo.date);
                  const formattedDate = format(convoDate, "MMMM d, yyyy");
                  const formattedTime = format(convoDate, "hh:mm a");
                  const durationMins = convo.durationSeconds
                    ? Math.ceil(convo.durationSeconds / 60)
                    : Math.max(1, Math.ceil((convo.messages?.length || 1) * 0.5));

                  return (
                    <motion.div
                      key={convo.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: pi * 0.1 + i * 0.08 }}
                      className="mb-4"
                    >
                      <GlassCard className="relative p-0 hover:bg-foreground/40 transition-colors">
                        <div className="absolute -left-[33px] top-6 h-3 w-3 rounded-full border-2 border-background bg-accent" />

                        <AccordionItem
                          value={convo.id}
                          className="border-none"
                        >
                          <AccordionTrigger className="px-4 py-4 hover:no-underline">
                            <div className="flex flex-1 items-start gap-3 text-left">
                              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {formattedDate} &middot; {formattedTime}{" "}
                                    &middot; {durationMins} min
                                    {durationMins !== 1 ? "s" : ""}
                                  </span>
                                </div>
                                <p className="text-sm font-semibold leading-tight text-primary-foreground">
                                  {convo.summary}
                                </p>
                                {convo.keyTopics && convo.keyTopics.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {convo.keyTopics.map((topic, idx) => (
                                      <span
                                        key={idx}
                                        className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary"
                                      >
                                        {topic}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            {/* Conversation transcript */}
                            <div className="mt-2 rounded-lg bg-background/50 p-3 border border-border">
                              <p className="text-xs font-semibold text-muted-foreground mb-3">
                                Transcript
                              </p>
                              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
                                {convo.messages ? (
                                  convo.messages.map((msg, lidx) => {
                                    const isMe = msg.speaker === "You";
                                    return (
                                      <div
                                        key={lidx}
                                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                      >
                                        <div
                                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                                            isMe
                                              ? "bg-purple-500/20 text-purple-200 rounded-br-md"
                                              : "bg-blue-500/20 text-blue-200 rounded-bl-md"
                                          }`}
                                        >
                                          <span
                                            className={`text-[10px] font-bold block mb-0.5 ${
                                              isMe
                                                ? "text-purple-400"
                                                : "text-blue-400"
                                            }`}
                                          >
                                            {msg.speaker}
                                            {msg.timestamp && (
                                              <span className="ml-2 font-normal opacity-50">
                                                {msg.timestamp}
                                              </span>
                                            )}
                                          </span>
                                          {msg.text}
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : convo.transcript ? (
                                  convo.transcript
                                    .split("\n")
                                    .map((line, lidx) => {
                                      if (!line.trim()) return null;
                                      const isMe = line.startsWith("You:");
                                      return (
                                        <p
                                          key={lidx}
                                          className={`text-sm ${
                                            isMe
                                              ? "text-primary italic"
                                              : "text-primary-foreground/90"
                                          } leading-relaxed`}
                                        >
                                          {line}
                                        </p>
                                      );
                                    })
                                ) : null}
                              </div>
                            </div>

                            {/* AI Summary card */}
                            <div
                              className="mt-3 rounded-xl p-3 border"
                              style={{
                                background:
                                  "linear-gradient(135deg, rgba(20,184,166,0.1), rgba(6,182,212,0.05))",
                                borderColor: "rgba(20,184,166,0.2)",
                              }}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-4 w-4 text-teal-400" />
                                <span className="text-xs font-bold text-teal-400">
                                  AI Memory Summary
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed text-primary-foreground/80">
                                {convo.summary}
                              </p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </Accordion>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MemoryTimeline;
