/**
 * Daily-editable public-source research ledger.
 * Keep each item attributable in the daily research log before promoting it here.
 */
export type Company = {
  name: string;
  ticker: string;
  sector: "Primes" | "Space" | "Autonomy" | "Data & AI" | "Munitions";
  role: string;
  signal: string;
  tone: string;
};

export const companies: Company[] = [
  { name: "Lockheed Martin", ticker: "LMT", sector: "Primes", role: "Aeronautics · missiles · space", signal: "F-35 / missile defense", tone: "blue" },
  { name: "RTX", ticker: "RTX", sector: "Primes", role: "Sensors · air defense · engines", signal: "Patriot / Raytheon", tone: "cyan" },
  { name: "Northrop Grumman", ticker: "NOC", sector: "Primes", role: "Strategic systems · autonomy", signal: "B-21 / Sentinel", tone: "violet" },
  { name: "General Dynamics", ticker: "GD", sector: "Primes", role: "Land systems · naval · IT", signal: "Columbia / Gulfstream", tone: "orange" },
  { name: "Boeing Defense", ticker: "BA", sector: "Primes", role: "Air & space platforms", signal: "KC-46 / MQ-25", tone: "yellow" },
  { name: "L3Harris", ticker: "LHX", sector: "Data & AI", role: "Mission systems · comms", signal: "Resilient networks", tone: "green" },
  { name: "Anduril", ticker: "Private", sector: "Autonomy", role: "Autonomy · counter-UAS", signal: "Lattice / Fury", tone: "pink" },
  { name: "Palantir", ticker: "PLTR", sector: "Data & AI", role: "Decision software · AI", signal: "Maven / Gotham", tone: "lime" },
  { name: "SpaceX", ticker: "Private", sector: "Space", role: "Launch · satellite connectivity", signal: "NSSL / Starshield", tone: "sky" },
  { name: "AeroVironment", ticker: "AVAV", sector: "Autonomy", role: "Tactical UAS · loitering", signal: "Switchblade", tone: "red" },
  { name: "Huntington Ingalls", ticker: "HII", sector: "Primes", role: "Nuclear shipbuilding", signal: "Carrier / submarine", tone: "amber" },
  { name: "General Atomics", ticker: "Private", sector: "Autonomy", role: "Uncrewed aircraft · energy", signal: "MQ-9 / CCA", tone: "teal" }
];

export const signalLanes = [
  ["Acquisition", "DoD", "Program execution & budget signals", "Monitor award notices and obligation changes."],
  ["Industrial base", "Primes", "Production capacity & supply chains", "Track schedule, supplier, and workforce pressure."],
  ["Capability", "New entrants", "Autonomy, AI, space & electronic warfare", "Watch fielding, exercises, and program transitions."],
  ["People", "Leadership", "Senior appointments & board moves", "Log influence paths and revolving-door disclosures."]
] as const;
