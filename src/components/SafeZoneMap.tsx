import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Shield,
  AlertTriangle,
  Minus,
  Plus,
  Send,
  Navigation,
  Settings2,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as turf from "@turf/turf";
import GlassCard from "./GlassCard";
import StatusBadge from "./StatusBadge";
import { toast } from "sonner";
import { getAllPeople } from "@/lib/personStore";
import { sendSafeZoneAlert } from "@/lib/emailUtils";

delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const patientIcon = new L.DivIcon({
  className: "",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:hsl(199 89% 48% / 0.25);border:2px solid hsl(199 89% 48%);box-shadow:0 0 12px hsl(199 89% 48% / 0.4);animation:patientPulse 2s ease-in-out infinite;">
    <div style="width:14px;height:14px;border-radius:50%;background:hsl(199 89% 48%);"></div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const homeIcon = new L.DivIcon({
  className: "",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:hsl(142 71% 45% / 0.25);border:2px solid hsl(142 71% 45%);">
    <div style="width:10px;height:10px;border-radius:50%;background:hsl(142 71% 45%);"></div>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function RecenterMap({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const ALERT_COOLDOWN_MS = 5 * 60 * 1000;

const SafeZoneMap = () => {
  const [homeLocation, setHomeLocation] = useState<[number, number]>([
    13.3333, 75.7833,
  ]);
  const [patientLocation, setPatientLocation] = useState<[number, number]>([
    13.3333, 75.7833,
  ]);
  const [safeRadius, setSafeRadius] = useState(500);
  const [isInZone, setIsInZone] = useState(true);
  const [isZoneActive, setIsZoneActive] = useState(false);
  const [dispatchedEmails, setDispatchedEmails] = useState<string[]>([]);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [simulatingExit, setSimulatingExit] = useState(false);
  const [distanceFromBoundary, setDistanceFromBoundary] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAlertTimeRef = useRef<number>(0);
  const safeZonePolygonRef = useRef<ReturnType<typeof turf.circle> | null>(
    null
  );

  // Build safe zone polygon using Turf.js
  const buildSafeZonePolygon = useCallback(
    (center: [number, number], radiusMeters: number) => {
      const radiusKm = radiusMeters / 1000;
      const polygon = turf.circle([center[1], center[0]], radiusKm, {
        steps: 64,
        units: "kilometers",
      });
      safeZonePolygonRef.current = polygon;
      return polygon;
    },
    []
  );

  // Get real GPS location
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watcher = navigator.geolocation.watchPosition(
        (pos) => {
          const loc: [number, number] = [
            pos.coords.latitude,
            pos.coords.longitude,
          ];
          setPatientLocation(loc);
          if (!locationLoaded) {
            setHomeLocation(loc);
            setLocationLoaded(true);
          }
        },
        () => {
          if (!locationLoaded) setLocationLoaded(true);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );

      const fallback = setTimeout(() => {
        if (!locationLoaded) setLocationLoaded(true);
      }, 10000);

      return () => {
        navigator.geolocation.clearWatch(watcher);
        clearTimeout(fallback);
      };
    } else {
      setLocationLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check boundary with Turf.js every 10 seconds
  useEffect(() => {
    if (!isZoneActive) return;

    buildSafeZonePolygon(homeLocation, safeRadius);

    const checkBoundary = () => {
      const polygon = safeZonePolygonRef.current;
      if (!polygon) return;

      const point = turf.point([patientLocation[1], patientLocation[0]]);
      const inside = turf.booleanPointInPolygon(point, polygon);
      const wasInside = isInZone;

      setIsInZone(inside);

      // Distance from boundary
      const distMeters = Math.round(
        getDistanceMeters(patientLocation, homeLocation)
      );
      const fromBoundary = Math.max(0, distMeters - safeRadius);
      setDistanceFromBoundary(inside ? 0 : fromBoundary);

      // Trigger alert on breach
      if (wasInside && !inside) {
        const now = Date.now();
        if (now - lastAlertTimeRef.current > ALERT_COOLDOWN_MS) {
          lastAlertTimeRef.current = now;

          toast.error("ALERT: Patient outside safe zone!", {
            duration: 5000,
          });

          const people = getAllPeople();
          const emails = people
            .filter((p) => p.email)
            .map((p) => p.email as string);
          setDispatchedEmails(emails);

          // Send Django alert
          fetch("http://localhost:8000/api/alerts/send/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patient_name: "Patient",
              current_lat: patientLocation[0],
              current_lon: patientLocation[1],
              timestamp: new Date().toISOString(),
              safe_zone_center: homeLocation,
              distance_from_zone_meters: fromBoundary,
            }),
          }).catch(() => {
            // Django unavailable, use EmailJS fallback
          });

          // EmailJS fallback
          emails.forEach((email) => {
            sendSafeZoneAlert(email, distMeters);
          });

          if (emails.length > 0) {
            toast.info(
              `Alert emails sent to ${emails.length} contact${emails.length !== 1 ? "s" : ""}`
            );
          }
        }
      }

      if (inside && dispatchedEmails.length > 0) {
        setDispatchedEmails([]);
      }
    };

    checkBoundary();
    gpsIntervalRef.current = setInterval(checkBoundary, 10000);

    return () => {
      if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
    };
  }, [
    isZoneActive,
    patientLocation,
    homeLocation,
    safeRadius,
    buildSafeZonePolygon,
    isInZone,
    dispatchedEmails.length,
  ]);

  const simulateExit = () => {
    if (simulatingExit) {
      setPatientLocation(homeLocation);
      setSimulatingExit(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    setSimulatingExit(true);
    let step = 0;
    const maxSteps = 20;
    const targetLat = homeLocation[0] + 0.008;
    const targetLng = homeLocation[1] + 0.005;

    intervalRef.current = setInterval(() => {
      step++;
      const progress = step / maxSteps;
      const lat = homeLocation[0] + (targetLat - homeLocation[0]) * progress;
      const lng = homeLocation[1] + (targetLng - homeLocation[1]) * progress;
      setPatientLocation([lat, lng]);

      if (step >= maxSteps) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 300);
  };

  const handleToggleZone = () => {
    if (!isZoneActive) {
      setHomeLocation(patientLocation);
      setIsInZone(true);
      buildSafeZonePolygon(patientLocation, safeRadius);
    }
    setIsZoneActive(!isZoneActive);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
    };
  }, []);

  const distanceFromHome = Math.round(
    getDistanceMeters(patientLocation, homeLocation)
  );

  return (
    <div className="space-y-4">
      {/* Breach alert banner */}
      <AnimatePresence>
        {!isInZone && isZoneActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="w-full rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                animation: "pulseAlert 2s ease-in-out infinite",
              }}
            >
              <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-400">
                  ALERT: Patient outside safe zone
                </p>
                <p className="text-[11px] text-red-300/70">
                  {patientLocation[0].toFixed(6)}, {patientLocation[1].toFixed(6)} &middot;{" "}
                  {distanceFromBoundary}m from boundary &middot;{" "}
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <GlassCard className="relative overflow-hidden p-0">
        <div className="h-[45vh] w-full overflow-hidden rounded-2xl">
          {locationLoaded && (
            <MapContainer
              center={patientLocation}
              zoom={15}
              style={{
                height: "100%",
                width: "100%",
                borderRadius: "1rem",
              }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              <RecenterMap center={patientLocation} zoom={15} />

              {/* Safe zone circle with pulsing border */}
              <Circle
                center={homeLocation}
                radius={safeRadius}
                pathOptions={{
                  color: !isZoneActive
                    ? "hsl(220, 14%, 71%)"
                    : isInZone
                      ? "hsl(142, 71%, 45%)"
                      : "hsl(0, 72%, 60%)",
                  fillColor: !isZoneActive
                    ? "hsl(220, 14%, 71%)"
                    : isInZone
                      ? "hsl(142, 71%, 45%)"
                      : "hsl(0, 72%, 60%)",
                  fillOpacity: isZoneActive ? 0.08 : 0.04,
                  weight: isZoneActive ? 3 : 2,
                  dashArray: isZoneActive ? undefined : "8 6",
                }}
              />

              <Marker position={homeLocation} icon={homeIcon}>
                <Popup>
                  <strong>Home (Safe Zone Center)</strong>
                  <br />
                  Radius: {safeRadius}m
                </Popup>
              </Marker>

              <Marker position={patientLocation} icon={patientIcon}>
                <Popup>
                  <strong>Patient Location</strong>
                  <br />
                  {distanceFromHome}m from home
                  <br />
                  Status: {isInZone ? "Safe" : "Outside Zone"}
                </Popup>
              </Marker>
            </MapContainer>
          )}
        </div>

        {/* Map overlay */}
        <div className="absolute left-3 top-3 z-[1000] space-y-2">
          <div className="rounded-xl bg-foreground/60 px-3 py-1.5 text-[11px] font-medium text-primary-foreground backdrop-blur-md">
            <Navigation className="mr-1 inline h-3 w-3" />
            {distanceFromHome}m from home
          </div>
          {isZoneActive && !isInZone && (
            <div className="rounded-xl bg-red-500/80 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md">
              {distanceFromBoundary}m from boundary
            </div>
          )}
        </div>

        {/* Status indicator overlay */}
        <div className="absolute right-3 top-3 z-[1000]">
          <div
            className={`rounded-xl px-3 py-1.5 text-[11px] font-bold backdrop-blur-md ${
              !isZoneActive
                ? "bg-foreground/40 text-muted-foreground"
                : isInZone
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
            }`}
          >
            {!isZoneActive
              ? "Zone Inactive"
              : isInZone
                ? "Patient inside safe zone"
                : "ALERT: Outside safe zone"}
          </div>
        </div>
      </GlassCard>

      {/* Safe Zone Radius Control */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <p className="text-caption font-semibold text-muted-foreground">
              Safe Zone Radius
            </p>
          </div>
          <span className="text-headline text-primary font-bold">
            {safeRadius}m
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSafeRadius(Math.max(100, safeRadius - 100))}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors hover:bg-secondary/80"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="range"
            min={100}
            max={2000}
            step={50}
            value={safeRadius}
            onChange={(e) => setSafeRadius(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <button
            onClick={() => setSafeRadius(Math.min(2000, safeRadius + 100))}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors hover:bg-secondary/80"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>100m</span>
          <span>1000m</span>
          <span>2000m</span>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <button
            onClick={handleToggleZone}
            className={`w-full rounded-xl py-3.5 font-bold text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
              isZoneActive
                ? "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20"
                : "bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
            }`}
          >
            {isZoneActive ? (
              <>Deactivate Safe Zone</>
            ) : (
              <>
                <Shield className="h-4 w-4" /> Set Active Zone
              </>
            )}
          </button>
        </div>
      </GlassCard>

      {/* Status & Actions */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield
              className={`h-5 w-5 ${
                !isZoneActive
                  ? "text-muted-foreground"
                  : isInZone
                    ? "text-safe"
                    : "text-destructive"
              }`}
            />
            <div>
              <p className="text-body font-medium">Monitoring Status</p>
              <StatusBadge
                status={
                  !isZoneActive ? "warning" : isInZone ? "safe" : "alert"
                }
                label={
                  !isZoneActive
                    ? "Inactive"
                    : isInZone
                      ? "Inside Safe Zone"
                      : "Breach Detected!"
                }
              />
            </div>
          </div>
          <button
            onClick={simulateExit}
            className={`glass-button text-caption ${
              !isZoneActive && !simulatingExit
                ? "opacity-50 cursor-not-allowed pointer-events-none"
                : ""
            }`}
            disabled={!isZoneActive && !simulatingExit}
          >
            {simulatingExit ? "Return Home" : "Simulate Exit"}
          </button>
        </div>
      </GlassCard>

      {/* Alert card when outside */}
      <AnimatePresence>
        {!isInZone && isZoneActive && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <GlassCard className="border-destructive/40 bg-destructive/10 shadow-[0_0_40px_hsla(0,84%,60%,0.2)]">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-6 w-6 text-destructive animate-pulse" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-lg font-bold text-destructive tracking-tight">
                      CRITICAL ALERT
                    </p>
                    <p className="text-sm font-medium text-foreground/80 leading-relaxed mt-0.5">
                      Patient has breached the safe zone! Currently{" "}
                      <span className="text-destructive font-bold">
                        {distanceFromHome}m
                      </span>{" "}
                      from home center.
                    </p>
                  </div>
                </div>

                <div className="bg-background/80 backdrop-blur-md rounded-xl p-4 border border-destructive/20 mt-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Send className="h-4 w-4 text-primary" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Automated Email Dispatch
                    </p>
                  </div>

                  <ul className="space-y-2.5">
                    {dispatchedEmails.length > 0 ? (
                      dispatchedEmails.map((email) => (
                        <li
                          key={email}
                          className="flex items-center gap-2.5 text-sm font-semibold text-foreground bg-foreground/5 py-2 px-3 rounded-lg border border-border/50"
                        >
                          <div className="h-2 w-2 rounded-full bg-safe shrink-0 shadow-[0_0_8px_hsl(142,71%,45%)]" />
                          Alert dispatched to:{" "}
                          <span className="text-primary truncate">
                            {email}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="flex flex-col items-center justify-center py-3 text-center bg-warning/10 rounded-lg border border-warning/20">
                        <span className="text-sm text-warning font-semibold">
                          No caregiver emails registered!
                        </span>
                        <span className="text-[10px] text-warning/80 mt-1">
                          Please add a person with an email address using the
                          Add feature.
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function getDistanceMeters(
  p1: [number, number],
  p2: [number, number]
): number {
  const R = 6371000;
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1[0] * Math.PI) / 180) *
      Math.cos((p2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default SafeZoneMap;
