import { useRef, useState } from "react";

const SpeechRecognitionAPI =
  (window as unknown as { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition })
    .SpeechRecognition ||
  (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition })
    .webkitSpeechRecognition;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _recognition: any = null;

export interface TranscriptLine {
  id: number;
  timestamp: string;
  speaker: string;
  text: string;
}

function getCurrentTimestamp(): string {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function useSpeechRecognition(recognizedName: string) {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [interim, setInterim] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [conversationStartTime, setConversationStartTime] = useState<number | null>(null);

  const linesRef = useRef<TranscriptLine[]>([]);
  const isRunningRef = useRef(false);
  const nameRef = useRef(recognizedName);
  nameRef.current = recognizedName;

  const getRecognition = () => {
    if (!_recognition && SpeechRecognitionAPI) {
      _recognition = new SpeechRecognitionAPI();
      _recognition.continuous = true;
      _recognition.interimResults = true;
      _recognition.lang = "en-IN";
      _recognition.maxAlternatives = 1;

      _recognition.onstart = () => {};

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (interimTranscript) {
          setInterim(interimTranscript);
        }

        if (finalTranscript.trim()) {
          const last = linesRef.current;
          const prevSpeaker =
            last.length > 0 ? last[last.length - 1].speaker : nameRef.current;
          const speaker = prevSpeaker === "You" ? nameRef.current : "You";
          const entry: TranscriptLine = {
            id: Date.now(),
            timestamp: getCurrentTimestamp(),
            speaker,
            text: finalTranscript.trim(),
          };
          linesRef.current = [...linesRef.current, entry];
          setLines([...linesRef.current]);
          setInterim("");
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _recognition.onerror = (event: any) => {
        if (event.error === "aborted" || event.error === "no-speech") {
          return;
        }
        if (event.error === "not-allowed") {
          alert("Microphone permission denied");
          isRunningRef.current = false;
          setIsListening(false);
        }
      };

      _recognition.onend = () => {
        if (isRunningRef.current) {
          setTimeout(() => {
            try {
              _recognition.start();
            } catch {
              // ignore restart errors
            }
          }, 300);
        }
      };
    }
    return _recognition;
  };

  const start = async () => {
    linesRef.current = [];
    setLines([]);
    setInterim("");
    isRunningRef.current = true;
    setIsListening(true);
    setConversationStartTime(Date.now());
    const rec = getRecognition();
    if (!rec) {
      alert("Speech Recognition not supported. Use Chrome or Edge.");
      return;
    }
    try {
      rec.start();
    } catch {
      // ignore start errors
    }
  };

  const stop = () => {
    isRunningRef.current = false;
    setIsListening(false);
    setInterim("");
    setConversationStartTime(null);
    try {
      _recognition?.stop();
    } catch {
      // ignore stop errors
    }
    return linesRef.current;
  };

  return { lines, interim, isListening, conversationStartTime, start, stop };
}
