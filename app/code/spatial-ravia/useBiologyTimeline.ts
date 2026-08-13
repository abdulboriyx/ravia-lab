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
import type { FocusedTimelineWindow } from "./biology-translation-timeline-focus.ts";

type UseBiologyTimelineResult = {
  hasTemporal: boolean;
  playing: boolean;
  speed: number;
  resetVersion: number;
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
  temporal?: BiologySceneSpec["temporal"],
  focusedWindow?: FocusedTimelineWindow
): UseBiologyTimelineResult {
  const totalDurationMs = useMemo(() => getTotalDurationMs(temporal), [temporal]);
  const [timeMs, setTimeMs] = useState(() => getInitialTimeMs(temporal));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeedState] = useState(1);
  const [resetVersion, setResetVersion] = useState(0);
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
        const nextTimeMs = Math.min(clampTimeMs(temporal, currentTimeMs + deltaMs), focusedWindow?.endMs ?? Infinity);

        if (nextTimeMs >= (focusedWindow?.endMs ?? totalDurationMs)) {
          previousTickRef.current = null;
          setPlaying(false);
        }

        return nextTimeMs;
      });

      frameRequest = window.requestAnimationFrame(tick);
    };

    frameRequest = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameRequest);
  }, [focusedWindow?.endMs, playing, speed, temporal, totalDurationMs]);

  const seek = useCallback(
    (nextTimeMs: number) => {
      const absoluteTime = focusedWindow ? focusedWindow.startMs + nextTimeMs : nextTimeMs;
      setTimeMs(Math.min(Math.max(clampTimeMs(temporal, absoluteTime), focusedWindow?.startMs ?? 0), focusedWindow?.endMs ?? Infinity));
      previousTickRef.current = null;
    },
    [focusedWindow, temporal]
  );

  const restart = useCallback(() => {
    setTimeMs(focusedWindow?.startMs ?? getInitialTimeMs(temporal));
    setResetVersion((value) => value + 1);
    previousTickRef.current = null;
    setPlaying(true);
  }, [focusedWindow, temporal]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => {
    previousTickRef.current = null;
    setPlaying(false);
  }, []);
  const setSpeed = useCallback((nextSpeed: number) => {
    previousTickRef.current = null;
    setSpeedState(nextSpeed);
  }, []);

  // A prompt can replace the temporal plan without remounting this hook.
  // Until the next interaction writes the new clock, never expose a stale
  // timestamp outside the new focused interval.
  const safeTimeMs = focusedWindow && (timeMs < focusedWindow.startMs || timeMs >= focusedWindow.endMs)
    ? focusedWindow.startMs
    : timeMs;

  return {
    hasTemporal: Boolean(temporal && totalDurationMs > 0),
    playing,
    speed,
    resetVersion,
    timeMs: focusedWindow ? safeTimeMs - focusedWindow.startMs : safeTimeMs,
    totalDurationMs: focusedWindow ? focusedWindow.endMs - focusedWindow.startMs : totalDurationMs,
    frame: getTemporalFrame(temporal, safeTimeMs),
    play,
    pause,
    restart,
    seek,
    setSpeed,
  };
}
