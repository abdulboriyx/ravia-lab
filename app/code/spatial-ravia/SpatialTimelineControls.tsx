"use client";

import type { TemporalFrame } from "./biology-timeline";

type Props = {
  playing: boolean;
  speed: number;
  timeMs: number;
  totalDurationMs: number;
  frame: TemporalFrame | null;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onSeek: (timeMs: number) => void;
  onSpeedChange: (speed: number) => void;
};

export function SpatialTimelineControls({
  playing,
  speed,
  timeMs,
  totalDurationMs,
  frame,
  onPlay,
  onPause,
  onRestart,
  onSeek,
  onSpeedChange,
}: Props) {
  return (
    <div className="spatialTimelineControls" aria-label="Mechanism timeline">
      <button
        type="button"
        className="spatialTimelineButton"
        aria-label={playing ? "Pause mechanism" : "Play mechanism"}
        onClick={playing ? onPause : onPlay}
      >
        {playing ? "Pause" : "Play"}
      </button>
      <button
        type="button"
        className="spatialTimelineButton"
        aria-label="Restart mechanism"
        onClick={onRestart}
      >
        Restart
      </button>
      <input
        className="spatialTimelineRange"
        aria-label="Mechanism time"
        type="range"
        min={0}
        max={Math.max(totalDurationMs, 1)}
        step={16}
        value={Math.min(timeMs, totalDurationMs)}
        onPointerDown={onPause}
        onChange={(event) => onSeek(Number(event.currentTarget.value))}
      />
      <span className="spatialTimelinePhase">
        {frame?.phaseLabel ?? "Phase"}
      </span>
      <select
        className="spatialTimelineSpeed"
        aria-label="Playback speed"
        value={speed}
        onChange={(event) => onSpeedChange(Number(event.currentTarget.value))}
      >
        <option value={0.5}>0.5x</option>
        <option value={1}>1x</option>
        <option value={2}>2x</option>
        <option value={4}>4x</option>
      </select>
    </div>
  );
}
