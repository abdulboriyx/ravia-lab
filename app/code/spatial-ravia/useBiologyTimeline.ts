"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BiologySceneSpec } from "./biology-scene-spec";
import {
  clampTimeMs,
  getInitialTimeMs,
  getTemporalFrame,
  getTotalDurationMs,
  type TemporalFrame,
} from "./biology-timeline";

type UseBiologyTimelineResult = {
  hasTemporal: boolean;
  playing: boolean;
  speed: number;
  timeMs: number;
  totalDurationMs: number;
  frame: TemporalFrame | null;
  play: () => void;
  pause: () => void;
  restart: () => void;
  seek: (timeMs: number) => void;
  setSpeed: (speed: number) => void;
};

export function useBiologyTimeline(
  temporal?: BiologySceneSpec["temporal"]
): UseBiologyTimelineResult {
  const totalDurationMs = useMemo(() => getTotalDurationMs(temporal), [temporal]);
  const [timeMs, setTimeMs] = useState(() => getInitialTimeMs(temporal));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeedState] = useState(1);
  const previousTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing || !temporal || totalDurationMs <= 0) {
      previousTickRef.current = null;
      return undefined;
    }

    let frameRequest = 0;

    const tick = (timestamp: number) => {
      const previousTimestamp = previousTickRef.current ?? timestamp;
      previousTickRef.current = timestamp;
      const deltaMs = (timestamp - previousTimestamp) * speed;

      setTimeMs((currentTimeMs) => {
        const nextTimeMs = clampTimeMs(temporal, currentTimeMs + deltaMs);

        if (nextTimeMs >= totalDurationMs) {
          previousTickRef.current = null;
          setPlaying(false);
        }

        return nextTimeMs;
      });

      frameRequest = window.requestAnimationFrame(tick);
    };

    frameRequest = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameRequest);
  }, [playing, speed, temporal, totalDurationMs]);

  const seek = useCallback(
    (nextTimeMs: number) => {
      setTimeMs(clampTimeMs(temporal, nextTimeMs));
      previousTickRef.current = null;
    },
    [temporal]
  );

  const restart = useCallback(() => {
    setTimeMs(0);
    previousTickRef.current = null;
    setPlaying(true);
  }, []);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => {
    previousTickRef.current = null;
    setPlaying(false);
  }, []);
  const setSpeed = useCallback((nextSpeed: number) => {
    previousTickRef.current = null;
    setSpeedState(nextSpeed);
  }, []);

  return {
    hasTemporal: Boolean(temporal && totalDurationMs > 0),
    playing,
    speed,
    timeMs,
    totalDurationMs,
    frame: getTemporalFrame(temporal, timeMs),
    play,
    pause,
    restart,
    seek,
    setSpeed,
  };
}
