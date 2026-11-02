import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Scan, VideoOff, Loader2, Mic, StopCircle } from "lucide-react";
import * as faceapi from "face-api.js";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useSpeechRecognition, TranscriptLine } from "@/hooks/useSpeechRecognition";
import { getAllPeople, Person, addConversation } from "@/lib/personStore";
import FaceBoxCard from "./FaceBoxCard";
import { toast } from "sonner";

const DJANGO_API_URL = "http://localhost:8000";

async function generateAISummary(
  personName: string,
  conversation: TranscriptLine[]
): Promise<{ summary: string; topics: string[] }> {
  const formatted = conversation
    .map((l) => `${l.speaker}: ${l.text}`)
    .join("\n");

  try {
    const res = await fetch(`${DJANGO_API_URL}/api/conversations/save/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        person_name: personName,
        conversation: conversation.map((l) => ({
          speaker: l.speaker,
          text: l.text,
          timestamp: l.timestamp,
        })),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.summary) {
        return { summary: data.summary, topics: data.topics || [] };
      }
    }
  } catch {
    // Django/Ollama unavailable
  }

  // Fallback: local heuristic
  const words = formatted
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/);
  const commonWords = new Set([
    "the","a","an","and","or","but","in","on","at","to","for","with","about",
    "as","by","is","are","was","were","i","you","he","she","it","we","they",
    "my","your","his","her","their","this","that","these","those","of",
  ]);
  const wordCounts = new Map<string, number>();
  words.forEach((w) => {
    if (w.length > 3 && !commonWords.has(w)) {
      wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
    }
  });
  const sortedTopics = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((e) => e[0]);

  let summary = "";
  if (formatted.length < 50) {
    summary = `Brief interaction: "${formatted.substring(0, 40)}..."`;
  } else {
    summary = `${personName} visited. Discussed ${sortedTopics.join(", ") || "various topics"}. Summary unavailable — AI service offline.`;
  }
  return {
    summary: summary.charAt(0).toUpperCase() + summary.slice(1),
    topics: sortedTopics.map((t) => t.charAt(0).toUpperCase() + t.slice(1)),
  };
}

const CameraOverlay = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [videoSize, setVideoSize] = useState({ width: 640, height: 480 });
  const [matchedPeople, setMatchedPeople] = useState<Map<number, Person | null>>(new Map());

  const [lockedPerson, setLockedPerson] = useState<Person | null>(null);
  const [faceDetectionActive, setFaceDetectionActive] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const isSavingRef = useRef(false);

  const { detectedFaces, isModelLoaded, loadingStatus, startDetection, stopDetection } =
    useFaceDetection();

  const recognizedPerson =
    Array.from(matchedPeople.values()).find((p) => p !== null) || null;

  const knownPeopleList = getAllPeople();
  const people = useRef<Person[]>(knownPeopleList);

  const { lines, interim, isListening, conversationStartTime, start, stop } =
    useSpeechRecognition(recognizedPerson?.name || "Person");

  const chatFeedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
  }, [lines, interim]);

  useEffect(() => {
    people.current = getAllPeople();
  }, []);

  // Timer for conversation duration
  useEffect(() => {
    if (!conversationStartTime) {
      setElapsedSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - conversationStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [conversationStartTime]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        setCameraError(null);

        const { videoWidth, videoHeight } = videoRef.current;
        if (videoWidth && videoHeight) {
          setVideoSize({ width: videoWidth, height: videoHeight });
        }
      }
    } catch (err: unknown) {
      setCameraError((err as Error).message || "Camera access denied");
    }
  }, []);

  useEffect(() => {
    if (cameraActive && isModelLoaded && videoRef.current) {
      startDetection(videoRef.current);
    }
    return () => stopDetection();
  }, [cameraActive, isModelLoaded, startDetection, stopDetection]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const newMatches = new Map<number, Person | null>();
    const activeKnownPeople = people.current;
    const DISTANCE_THRESHOLD = 0.55;

    detectedFaces.forEach((face, idx) => {
      let bestMatch: Person | null = null;
      let minDistance = DISTANCE_THRESHOLD;

      if (face.descriptor) {
        activeKnownPeople.forEach((person) => {
          if (person.faceDescriptor && person.faceDescriptor.length > 0) {
            const storedDescriptor = new Float32Array(person.faceDescriptor);
            const distance = faceapi.euclideanDistance(
              face.descriptor!,
              storedDescriptor
            );

            if (distance < minDistance) {
              minDistance = distance;
              bestMatch = person;
            }
          }
        });
      }
      newMatches.set(idx, bestMatch);
    });
    setMatchedPeople(newMatches);
  }, [detectedFaces]);

  useEffect(() => {
    startCamera();
    const video = videoRef.current;
    return () => {
      if (video?.srcObject) {
        (video.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop());
      }
    };
  }, [startCamera]);

  const startConversation = async () => {
    if (!window.isSecureContext) {
      alert("Speech Recognition requires HTTPS. Please use https://localhost:8080");
      return;
    }
    if (
      !("SpeechRecognition" in window) &&
      !("webkitSpeechRecognition" in window)
    ) {
      alert("Please use Chrome or Edge browser for speech recognition.");
      return;
    }

    stopDetection();
    setLockedPerson(recognizedPerson);
    setFaceDetectionActive(false);

    await new Promise((resolve) => setTimeout(resolve, 500));
    start();
  };

  const stopConversation = async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    try {
      const finalLines = stop();

      const targetPerson = lockedPerson || recognizedPerson;
      if (finalLines.length > 0 && targetPerson) {
        const durationSeconds = elapsedSeconds;

        toast.info("Generating AI summary...");
        const { summary, topics } = await generateAISummary(
          targetPerson.name,
          finalLines
        );

        addConversation(targetPerson.id, summary, topics, finalLines.map((m) => ({
          speaker: m.speaker,
          text: m.text,
          timestamp: m.timestamp,
        })), durationSeconds);
        toast.success("Conversation saved to Memory");
      }

      setLockedPerson(null);
      setFaceDetectionActive(true);
      if (videoRef.current) {
        startDetection(videoRef.current);
      }
    } finally {
      isSavingRef.current = false;
    }
  };

  const formatDuration = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-foreground/95"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        muted
        style={{ transform: "scaleX(-1)" }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-foreground/20 via-transparent to-foreground/40" />

      {/* Conversation duration progress bar */}
      {isListening && (
        <div className="absolute top-0 left-0 right-0 z-40 h-1">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 300, ease: "linear" }}
          />
          <div className="absolute right-2 top-1.5 rounded-full bg-foreground/70 px-2 py-0.5 text-[10px] font-bold text-primary-foreground backdrop-blur-sm">
            {formatDuration(elapsedSeconds)}
          </div>
        </div>
      )}

      {/* Loading state */}
      <AnimatePresence>
        {(!isModelLoaded || !cameraActive) && !cameraError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-foreground/80 backdrop-blur-md"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-caption text-primary-foreground/70">{loadingStatus}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera error */}
      {cameraError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-foreground/90">
          <VideoOff className="h-10 w-10 text-destructive" />
          <p className="text-caption text-primary-foreground/70 text-center px-6">
            Camera access needed for face recognition
          </p>
          <button onClick={startCamera} className="glass-button mt-2 text-caption text-primary">
            Try Again
          </button>
        </div>
      )}

      {/* Status bar */}
      <div className="relative z-10 flex items-center justify-between p-4">
        <div className="flex items-center gap-2 rounded-full bg-foreground/40 px-3 py-1.5 backdrop-blur-md">
          <Camera className="h-3.5 w-3.5 text-primary-foreground" />
          <span className="text-[11px] font-medium text-primary-foreground">
            {!cameraActive
              ? "Starting camera..."
              : !isModelLoaded
                ? "Loading AI..."
                : detectedFaces.length > 0
                  ? `${detectedFaces.length} face${detectedFaces.length > 1 ? "s" : ""} detected`
                  : "Scanning..."}
          </span>
        </div>

        {/* Listening indicator with animated green pulse */}
        {isListening && (
          <div className="flex items-center gap-2 rounded-full bg-foreground/50 px-3 py-1.5 backdrop-blur-md">
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="h-2.5 w-2.5 rounded-full bg-green-500"
            />
            <span className="text-[10px] font-medium text-green-400">Listening...</span>
          </div>
        )}

        {!isListening && cameraActive && isModelLoaded && detectedFaces.length === 0 && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <Scan className="h-5 w-5 text-primary" />
          </motion.div>
        )}
        {!isListening && detectedFaces.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-safe/20"
          >
            <div className="h-2.5 w-2.5 rounded-full bg-safe pulse-ring" />
          </motion.div>
        )}
      </div>

      {/* Scan line when no faces */}
      {cameraActive && isModelLoaded && detectedFaces.length === 0 && !isListening && (
        <div className="scan-line absolute inset-x-0 h-24 z-10" />
      )}

      {/* Corner brackets */}
      {!isListening && (
        <>
          <div className="absolute left-4 top-16 h-8 w-8 border-l-2 border-t-2 border-primary/40 rounded-tl-lg z-10" />
          <div className="absolute right-4 top-16 h-8 w-8 border-r-2 border-t-2 border-primary/40 rounded-tr-lg z-10" />
          <div className="absolute bottom-16 left-4 h-8 w-8 border-b-2 border-l-2 border-primary/40 rounded-bl-lg z-10" />
          <div className="absolute bottom-16 right-4 h-8 w-8 border-b-2 border-r-2 border-primary/40 rounded-br-lg z-10" />
        </>
      )}

      {/* Static locked recognized state */}
      {lockedPerson && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            background: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "10px 16px",
            borderRadius: 10,
            fontSize: 15,
            zIndex: 50,
          }}
        >
          {lockedPerson.name} &middot; {lockedPerson.relationship}
        </div>
      )}

      {/* Face detection boxes with person info */}
      {!lockedPerson &&
        containerSize.width > 0 &&
        detectedFaces.map((face, idx) => {
          const person = matchedPeople.get(idx) ?? null;
          const mirroredBox = {
            ...face,
            x: videoSize.width - face.x - face.width,
          };
          return (
            <FaceBoxCard
              key={`fb-${idx}`}
              person={person}
              box={mirroredBox}
              videoWidth={videoSize.width}
              videoHeight={videoSize.height}
              containerWidth={containerSize.width}
              containerHeight={containerSize.height}
              isNew={!person}
            />
          );
        })}

      {/* Subtitle overlay in bottom 35% of camera view */}
      {isListening && (
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
          <div
            ref={chatFeedRef}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              overflowY: "hidden",
            }}
          >
            {lines.slice(-6).map((line) => (
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

            {/* Interim (partial) speech */}
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
        </div>
      )}

      {/* Controls bar */}
      <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col justify-end bg-gradient-to-t from-background/95 via-background/80 to-transparent p-4 pb-6 pt-8">
        <div className="flex items-center justify-between gap-3 relative z-50">
          {!isListening && (
            <div className="text-sm text-primary-foreground/80 font-medium px-2 flex-1">
              {recognizedPerson
                ? `Ready to talk with ${recognizedPerson.name.split(" ")[0]}?`
                : "Detecting faces..."}
            </div>
          )}

          {isListening ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={stopConversation}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 w-full"
            >
              <StopCircle className="h-5 w-5" />
              <span className="font-semibold">Stop Conversation</span>
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={startConversation}
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
    </div>
  );
};

export default CameraOverlay;
