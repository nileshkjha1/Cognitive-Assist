import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ArrowLeft, Loader2, CheckCircle2, VideoOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { addPerson } from "@/lib/personStore";
import PageHeader from "@/components/PageHeader";

const AddPerson = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [step, setStep] = useState<"scan" | "form" | "success">("scan");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [capturedDescriptor, setCapturedDescriptor] = useState<Float32Array | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [mappedLandmarks, setMappedLandmarks] = useState<{x: number, y: number}[]>([]);

  const { detectedFaces, isModelLoaded, loadingStatus, startDetection, stopDetection } = useFaceDetection();
  
  const detectedFacesRef = useRef(detectedFaces);
  useEffect(() => {
    detectedFacesRef.current = detectedFaces;
  }, [detectedFaces]);

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
      }
    } catch (err: any) {
      setCameraError(err.message || "Camera access denied");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
    stopDetection();
    setCameraActive(false);
  }, [stopDetection]);

  useEffect(() => {
    if (step === "scan") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step, startCamera, stopCamera]);

  useEffect(() => {
    if (cameraActive && isModelLoaded && videoRef.current) {
      startDetection(videoRef.current);
    }
  }, [cameraActive, isModelLoaded, startDetection]);

  // Initiate 3D deep scan when model is loaded and we are in "scan" step
  useEffect(() => {
    if (step !== "scan" || !isModelLoaded) return;

    const interval = setInterval(() => {
      const faces = detectedFacesRef.current;
      
      if (faces.length === 1) {
        setIsScanning(true);
        setScanProgress(prev => {
          const next = prev + 0.334; // reaches 100 in ~30 seconds (300 loops of 100ms)
          
          if (next >= 100 && prev < 100) {
            // Lock in the capture exactly once when reaching 100
            const face = faces[0];
            if (face.descriptor && videoRef.current) {
              try {
                const canvas = document.createElement("canvas");
                const size = 150;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  const video = videoRef.current;
                  const minDim = Math.min(video.videoWidth, video.videoHeight);
                  const startX = (video.videoWidth - minDim) / 2;
                  const startY = (video.videoHeight - minDim) / 2;
                  
                  ctx.translate(size, 0);
                  ctx.scale(-1, 1);
                  ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, size, size);
                  setCapturedImage(canvas.toDataURL("image/jpeg", 0.6));
                }
              } catch (e) {
                console.error("Failed to capture thumbnail", e);
              }
              setCapturedDescriptor(face.descriptor);
              setStep("form");
            }
            return 100;
          }
          return next > 100 ? 100 : next;
        });
      } else if (faces.length === 0) {
         // Face temporarily lost, just pause the scan!
         setIsScanning(false);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isModelLoaded, step]);

  // Dynamically map FaceAPI coordinates (internal video resolution) to the CSS container (object-cover + mirrored)
  useEffect(() => {
    if (detectedFaces.length === 1 && videoRef.current && (step === "scan" || isScanning)) {
      const face = detectedFaces[0];
      const video = videoRef.current;
      
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const cw = video.clientWidth;
      const ch = video.clientHeight;

      if (vw && vh && cw && ch) {
        // object-fit: cover scaling
        const scale = Math.max(cw / vw, ch / vh);
        
        const renderedWidth = vw * scale;
        const renderedHeight = vh * scale;
        
        // CSS offsets from centering
        const offsetX = (cw - renderedWidth) / 2;
        const offsetY = (ch - renderedHeight) / 2;

        let cssX = offsetX + face.x * scale;
        const cssY = offsetY + face.y * scale;
        const cssW = face.width * scale;
        const cssH = face.height * scale;

        // The video has transform: scaleX(-1), so we must mirror the X coordinate!
        cssX = cw - (cssX + cssW);

        // Map the 68 facial landmarks dynamically to the screen!
        if (face.landmarks) {
          const mapped = face.landmarks.map(pt => {
             let cssX = offsetX + pt.x * scale;
             const cssY = offsetY + pt.y * scale;
             cssX = cw - cssX; // mirror horizontally
             return { x: cssX, y: cssY };
          });
          setMappedLandmarks(mapped);
        }
      }
    }
  }, [detectedFaces, isScanning, step]);

  // Helper for SVG path construction
  const connectLine = (start: number, end: number, close = false) => {
    if (mappedLandmarks.length !== 68) return "";
    const slice = mappedLandmarks.slice(start, end + 1);
    const d = slice.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return close ? d + ' Z' : d;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedDescriptor || !name.trim()) return;

    // Convert Float32Array to standard array for localStorage
    const descriptorArray = Array.from(capturedDescriptor);

    addPerson({
      name: name.trim(),
      relationship: relationship.trim(),
      email: email.trim(),
      description: description.trim(),
      recentMemories: [],
      conversations: [],
      lastInteraction: new Date().toISOString(),
      profileImage: capturedImage || undefined,
      faceDescriptor: descriptorArray
    });

    setStep("success");
    setTimeout(() => {
      navigate("/dashboard");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-24 transition-colors duration-300">
      <div className="px-5 pt-12">
        <button 
          onClick={() => navigate("/dashboard")}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        
        <PageHeader 
          title="Add Person" 
          subtitle="Register a new face memory" 
          icon={<Camera className="h-5 w-5" />} 
        />

        <AnimatePresence mode="wait">
          {step === "scan" && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-6"
            >
              <div className="relative h-96 w-full overflow-hidden rounded-[2rem] border border-border bg-foreground/5 shadow-2xl">
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover"
                  playsInline
                  muted
                  style={{ transform: "scaleX(-1)" }}
                />
                
                {/* Overlays */}
                {!isModelLoaded && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-3">
                     <Loader2 className="h-8 w-8 animate-spin text-primary" />
                     <p className="font-medium text-foreground">{loadingStatus}</p>
                   </div>
                )}
                
                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm gap-3 p-6 text-center">
                     <VideoOff className="h-10 w-10 text-destructive" />
                     <p className="font-medium text-destructive">{cameraError}</p>
                     <button onClick={startCamera} className="glass-button text-sm mt-4">Try Again</button>
                  </div>
                )}

                {isModelLoaded && cameraActive && detectedFaces.length === 0 && !isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="scan-line absolute inset-x-0 h-24 z-10" />
                    <div className="border-2 border-primary/50 w-48 h-48 rounded-[2.5rem] relative">
                       <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-semibold text-white drop-shadow-md">
                         Position face here
                       </span>
                    </div>
                  </div>
                )}

                {/* Ultra-Premium 30s Cyber Biometric Scanner Overlay */}
                {isModelLoaded && cameraActive && isScanning && detectedFaces.length > 0 && mappedLandmarks.length === 68 && (
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden mix-blend-screen transition-all duration-300">
                    
                    {/* Sci-Fi Vignette/Dimming */}
                    <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px]" />
                    
                    {/* Side Telemetry Hexadecimals */}
                    <div className="absolute left-3 top-1/4 flex flex-col gap-1.5 font-mono text-[8px] text-primary/50 text-left opacity-80">
                       {Array.from({length: 16}).map((_, i) => (
                          <div key={`hex-l-${i}`} className="animate-pulse" style={{animationDelay: `${i*100}ms`}}>{[...Array(6)].map(() => Math.floor(Math.random()*16).toString(16)).join('').toUpperCase()}</div>
                       ))}
                    </div>
                    <div className="absolute right-3 top-1/4 flex flex-col gap-1.5 font-mono text-[8px] text-primary/50 text-right opacity-80">
                       {Array.from({length: 16}).map((_, i) => (
                          <div key={`hex-r-${i}`} className="animate-pulse" style={{animationDelay: `${(15-i)*100}ms`}}>{[...Array(6)].map(() => Math.floor(Math.random()*16).toString(16)).join('').toUpperCase()}</div>
                       ))}
                    </div>

                    {/* SVG 68-Point Precision Topology Wireframe */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 transition-all duration-100 ease-linear">
                      <g fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary opacity-[0.35]">
                        {/* Core Topology Curves */}
                        <path d={connectLine(0, 16)} />
                        <path d={connectLine(17, 21)} />
                        <path d={connectLine(22, 26)} />
                        <path d={connectLine(27, 30)} />
                        <path d={connectLine(31, 35)} />
                        <path d={connectLine(36, 41, true)} />
                        <path d={connectLine(42, 47, true)} />
                        <path d={connectLine(48, 59, true)} />
                        <path d={connectLine(60, 67, true)} />
                        
                        {/* Triangulation Structural Lines for Depth Illusion */}
                        {mappedLandmarks.length === 68 && (
                           <>
                             {/* Nose Bridge to Eyes */}
                             <path d={`M ${mappedLandmarks[27].x} ${mappedLandmarks[27].y} L ${mappedLandmarks[39].x} ${mappedLandmarks[39].y}`} strokeDasharray="1 3" />
                             <path d={`M ${mappedLandmarks[27].x} ${mappedLandmarks[27].y} L ${mappedLandmarks[42].x} ${mappedLandmarks[42].y}`} strokeDasharray="1 3" />
                             {/* Nose Tip to Mouth */}
                             <path d={`M ${mappedLandmarks[33].x} ${mappedLandmarks[33].y} L ${mappedLandmarks[51].x} ${mappedLandmarks[51].y}`} strokeDasharray="1 3" />
                             {/* Eyes to Eyebrows */}
                             <path d={`M ${mappedLandmarks[37].x} ${mappedLandmarks[37].y} L ${mappedLandmarks[19].x} ${mappedLandmarks[19].y}`} strokeDasharray="1 3" />
                             <path d={`M ${mappedLandmarks[44].x} ${mappedLandmarks[44].y} L ${mappedLandmarks[24].x} ${mappedLandmarks[24].y}`} strokeDasharray="1 3" />
                             {/* Jaw to Mouth */}
                             <path d={`M ${mappedLandmarks[8].x} ${mappedLandmarks[8].y} L ${mappedLandmarks[57].x} ${mappedLandmarks[57].y}`} strokeDasharray="1 3" />
                           </>
                        )}
                      </g>
                      
                      {/* High-Fidelity Micro Point Cloud */}
                      <g className="fill-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]">
                        {mappedLandmarks.map((p, i) => (
                          <circle 
                            key={`node-${i}`} 
                            cx={p.x} 
                            cy={p.y} 
                            r={i % 5 === 0 ? "1.5" : "0.75"} 
                            className={`opacity-${i % 3 === 0 ? 100 : 50} animate-pulse`} 
                            style={{ animationDelay: `${i * 30}ms`, animationDuration: '3s' }} 
                          />
                        ))}
                      </g>

                      {/* Deep Scan Laser Line (Sharp & Authentic) */}
                      <g className="opacity-80 animate-hud-laser text-primary" style={{transformOrigin: 'center'}}>
                         <rect x="0" y="0" width="100%" height="1.5" fill="currentColor" className="drop-shadow-[0_0_12px_hsl(199,89%,48%)]" />
                         <rect x="0" y="1.5" width="100%" height="80" fill="url(#laser-grad)" />
                         <defs>
                           <linearGradient id="laser-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                             <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                             <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                           </linearGradient>
                         </defs>
                      </g>
                    </svg>

                    {/* Minimalist Centered Status Bar */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 font-mono text-[10px] text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] w-full px-8">
                      <p className="font-semibold tracking-[0.2em] uppercase text-primary bg-background/60 px-4 py-1 rounded-full border border-primary/20 backdrop-blur-md">
                        {scanProgress < 20 ? "Initializing..." : scanProgress < 85 ? "Mapping Biometrics..." : "Finalizing Matrix..."}
                      </p>
                      
                      <div className="flex justify-between w-full max-w-[280px] mt-2 text-[9px] text-white/70 tracking-widest font-medium">
                        <span>DAT: {Math.floor((scanProgress / 100) * 8192)}B</span>
                        <span>CFD: {Math.min(100, Math.round((detectedFaces[0].score * 100) + (scanProgress * ((1 - detectedFaces[0].score))))).toFixed(1)}%</span>
                        <span>NDS: {Math.floor((scanProgress / 100) * 68)}</span>
                      </div>
                      
                      <div className="w-full max-w-[280px] h-1 bg-white/10 rounded-full mt-1 overflow-hidden relative shadow-inner">
                        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_10px_hsl(199,89%,48%)] transition-all duration-100 ease-linear" style={{ width: `${scanProgress}%` }} />
                      </div>
                    </div>
                  </div>
                )}

                {isModelLoaded && cameraActive && detectedFaces.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-destructive/20 backdrop-blur-[2px]">
                    <p className="text-white font-bold bg-destructive/80 px-4 py-2 rounded-full">Too many faces detected!</p>
                  </div>
                )}
              </div>
              <p className="mt-6 text-center text-sm font-medium text-muted-foreground max-w-[280px] mx-auto">
                Please ask the person to look directly into the camera. We'll automatically capture their face.
              </p>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 glass-panel p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-safe/20 flex items-center justify-center text-safe">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Face Captured</h2>
                  <p className="text-xs text-muted-foreground">Now, add their details.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground uppercase tracking-wide">Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="e.g. Ganesh"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground uppercase tracking-wide">Relationship</label>
                  <input 
                    type="text" 
                    value={relationship}
                    onChange={e => setRelationship(e.target.value)}
                    required
                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="e.g. Son"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground uppercase tracking-wide">Contact Email (for safety alerts)</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="example@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground uppercase tracking-wide">Description / Role</label>
                  <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                    placeholder="e.g. Visits every weekend to help with groceries."
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-primary text-white rounded-xl py-4 font-semibold shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all active:scale-[0.98]"
                >
                  Save Person
                </button>
              </form>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-12 flex flex-col items-center justify-center text-center p-8"
            >
              <div className="glass-orb h-24 w-24 bg-safe/10 border-safe/20 text-safe mb-6">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Saved Successfully</h2>
              <p className="text-muted-foreground font-medium">Their face is now securely stored in your memory.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AddPerson;
