import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";

export type ActionPotentialTracePoint = {
  timeMs: number;
  voltageMv: number;
};

export const actionPotentialTraceSource = {
  sourceId: "hodgkin-huxley-1952",
  model: "Hodgkin-Huxley squid giant axon membrane equations",
  timeUnit: "ms",
  voltageUnit: "mV",
  timeDomainMs: [0, 20] as const,
  voltageDomainMv: [-90, 50] as const,
  note: "Reviewed static benchmark trace from the published Hodgkin-Huxley model family; used as a fixed explanatory graph, not as a browser-side solver."
};

export const actionPotentialTraceViewport = {
  xRange: [92, 886] as const,
  yRange: [560, 430] as const
};

export const actionPotentialTracePoints: ActionPotentialTracePoint[] = [
  { timeMs: 0, voltageMv: -65 },
  { timeMs: 1, voltageMv: -65 },
  { timeMs: 2, voltageMv: -64.8 },
  { timeMs: 3, voltageMv: -63.7 },
  { timeMs: 4, voltageMv: -58.4 },
  { timeMs: 4.5, voltageMv: -48.2 },
  { timeMs: 5, voltageMv: -25.6 },
  { timeMs: 5.5, voltageMv: 8.7 },
  { timeMs: 6, voltageMv: 39.1 },
  { timeMs: 6.5, voltageMv: 31.8 },
  { timeMs: 7, voltageMv: 14.4 },
  { timeMs: 8, voltageMv: -16.7 },
  { timeMs: 9, voltageMv: -47.9 },
  { timeMs: 10, voltageMv: -68.1 },
  { timeMs: 11, voltageMv: -76.4 },
  { timeMs: 12, voltageMv: -78.2 },
  { timeMs: 13, voltageMv: -76.6 },
  { timeMs: 14, voltageMv: -73.1 },
  { timeMs: 15, voltageMv: -69.3 },
  { timeMs: 16, voltageMv: -66.8 },
  { timeMs: 18, voltageMv: -65.3 },
  { timeMs: 20, voltageMv: -65 }
];

export function actionPotentialTracePath() {
  const x = scaleLinear()
    .domain(actionPotentialTraceSource.timeDomainMs)
    .range(actionPotentialTraceViewport.xRange);
  const y = scaleLinear()
    .domain(actionPotentialTraceSource.voltageDomainMv)
    .range(actionPotentialTraceViewport.yRange);

  const path = line<ActionPotentialTracePoint>()
    .x((point) => x(point.timeMs))
    .y((point) => y(point.voltageMv))(actionPotentialTracePoints);

  return path ?? "";
}
