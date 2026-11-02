import { useState, useRef, useCallback, useEffect } from "react";
import * as faceapi from "face-api.js";

interface DetectedFace {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
  descriptor?: Float32Array;
  landmarks?: { x: number; y: number }[];
}

interface SmoothedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FaceDetectionHook {
  detectedFaces: DetectedFace[];
  isModelLoaded: boolean;
  loadingStatus: string;
  startDetection: (video: HTMLVideoElement) => void;
  stopDetection: () => void;
}

const LERP_FACTOR = 0.3;
const DETECTION_INTERVAL = 150;
const NO_FACE_TIMEOUT = 3000;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function useFaceDetection(): FaceDetectionHook {
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Loading AI models...");
  const detectionLoopRef = useRef(false);
  const rafRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const smoothedBoxesRef = useRef<SmoothedBox[]>([]);
  const rawFacesRef = useRef<DetectedFace[]>([]);
  const lastDetectionTimeRef = useRef<number>(Date.now());
  const isRunningRef = useRef(false);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/";
      try {
        setLoadingStatus("Loading face detection model...");
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        setLoadingStatus("Loading face landmark model...");
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        setLoadingStatus("Loading face recognition model...");
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setIsModelLoaded(true);
        setLoadingStatus("Ready");
      } catch (err) {
        console.error("Failed to load face-api models:", err);
        setLoadingStatus("Failed to load AI models");
      }
    };
    loadModels();
  }, []);

  const runDetection = useCallback(async (video: HTMLVideoElement) => {
    if (!video || video.paused || video.ended || !isModelLoaded) return;

    try {
      const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.6 });

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      const detections = await faceapi
        .detectAllFaces(canvas, options)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length > 0) {
        lastDetectionTimeRef.current = Date.now();
        const faces: DetectedFace[] = detections.map((d) => ({
          x: d.detection.box.x,
          y: d.detection.box.y,
          width: d.detection.box.width,
          height: d.detection.box.height,
          score: d.detection.score,
          descriptor: d.descriptor,
          landmarks: d.landmarks.positions,
        }));
        rawFacesRef.current = faces;
      } else {
        if (Date.now() - lastDetectionTimeRef.current > NO_FACE_TIMEOUT) {
          rawFacesRef.current = [];
          smoothedBoxesRef.current = [];
          setDetectedFaces([]);
        }
      }
    } catch {
      // detection error, skip frame
    }
  }, [isModelLoaded]);

  const animateSmoothing = useCallback(() => {
    if (!isRunningRef.current) return;

    const raw = rawFacesRef.current;
    const smoothed = smoothedBoxesRef.current;

    if (raw.length === 0) {
      if (smoothed.length > 0) {
        smoothedBoxesRef.current = [];
        setDetectedFaces([]);
      }
      rafRef.current = requestAnimationFrame(animateSmoothing);
      return;
    }

    while (smoothed.length < raw.length) {
      smoothed.push({
        x: raw[smoothed.length].x,
        y: raw[smoothed.length].y,
        width: raw[smoothed.length].width,
        height: raw[smoothed.length].height,
      });
    }
    while (smoothed.length > raw.length) {
      smoothed.pop();
    }

    const interpolatedFaces: DetectedFace[] = raw.map((face, i) => {
      const s = smoothed[i];
      s.x = lerp(s.x, face.x, LERP_FACTOR);
      s.y = lerp(s.y, face.y, LERP_FACTOR);
      s.width = lerp(s.width, face.width, LERP_FACTOR);
      s.height = lerp(s.height, face.height, LERP_FACTOR);

      return {
        ...face,
        x: s.x,
        y: s.y,
        width: s.width,
        height: s.height,
      };
    });

    smoothedBoxesRef.current = smoothed;
    setDetectedFaces(interpolatedFaces);

    rafRef.current = requestAnimationFrame(animateSmoothing);
  }, []);

  const startDetection = useCallback(
    (video: HTMLVideoElement) => {
      videoRef.current = video;
      isRunningRef.current = true;

      if (isModelLoaded) {
        detectionLoopRef.current = true;
        const detectionLoop = async () => {
          while (isRunningRef.current && detectionLoopRef.current && videoRef.current) {
            await runDetection(videoRef.current);
            await new Promise((r) => setTimeout(r, DETECTION_INTERVAL));
          }
        };
        detectionLoop();

        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(animateSmoothing);
      }
    },
    [isModelLoaded, runDetection, animateSmoothing]
  );

  const stopDetection = useCallback(() => {
    isRunningRef.current = false;
    detectionLoopRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    rawFacesRef.current = [];
    smoothedBoxesRef.current = [];
    setDetectedFaces([]);
  }, []);

  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      detectionLoopRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { detectedFaces, isModelLoaded, loadingStatus, startDetection, stopDetection };
}
