export type OrbitVector = {
  day: number;
  xAu: number;
  yAu: number;
  zAu: number;
  vxAuPerDay: number;
  vyAuPerDay: number;
  vzAuPerDay: number;
};

export type OrbitBenchmarkPoint = {
  day: number;
  jpl: OrbitVector;
  twoBody: OrbitVector;
  positionErrorAu: number;
};

export const orbitBenchmarkMetadata = {
  sourceId: "jpl-horizons-earth-sun-2026",
  target: "Earth (399)",
  center: "Sun (10)",
  referenceFrame: "Ecliptic of J2000.0",
  timeScale: "TDB",
  units: {
    position: "AU",
    velocity: "AU/day",
    gravitationalParameter: "AU^3/day^2"
  },
  startDate: "2026-01-01T00:00:00 TDB",
  stopDate: "2026-01-06T00:00:00 TDB",
  stepDays: 1,
  solarGravitationalParameterAu3PerDay2: 0.0002959122082855911,
  maximumPositionErrorAu: 0.000025,
  maximumPositionErrorKm: 3740,
  generator:
    "Offline two-body propagation from the JPL initial state using SciPy solve_ivp/RK45-equivalent tolerance; fixture checked against Horizons geometric vectors.",
  horizonsQuery:
    "COMMAND='399', CENTER='500@10', EPHEM_TYPE='VECTORS', VEC_TABLE='2', OUT_UNITS='AU-D', REF_PLANE='ECLIPTIC', START_TIME='2026-Jan-01', STOP_TIME='2026-Jan-06', STEP_SIZE='1 d'"
} as const;

export const jplHorizonsEarthSunVectors: OrbitVector[] = [
  vector(0, -0.1742814809205833, 0.9677589202546031, -0.00005944511017526243, -0.01720454736868129, -0.003116607022544302, 2.371782782240443e-7),
  vector(1, -0.1914577181329627, 0.9644927710527493, -0.00005911589728742784, -0.01714711395795914, -0.003415500296231398, 4.209140871117766e-7),
  vector(2, -0.208574091023267, 0.9609282947159187, -0.00005860610361963604, -0.01708482545228891, -0.003713268701506632, 5.962120981428834e-7),
  vector(3, -0.2256257563584321, 0.9570665936010502, -0.00005793031322919772, -0.01701769732094529, -0.00400995676721387, 7.510809557688929e-7),
  vector(4, -0.2426078625852829, 0.9529087307268453, -0.00005711391163296903, -0.01694569882505395, -0.004305595113243403, 8.761684426938214e-7),
  vector(5, -0.2595155094354412, 0.9484557530294953, -0.00005618982381162337, -0.01686876612967665, -0.004600183176316146, 9.658429232042847e-7)
];

export const twoBodyOrbitVectors: OrbitVector[] = [
  vector(0, -0.1742814809205833, 0.9677589202546031, -0.00005944511017526243, -0.01720454736868129, -0.003116607022544302, 2.371782782240443e-7),
  vector(1, -0.19145801604267043, 0.964491882603263, -0.00005919869398762226, -0.017147631476445685, -0.003417301197059921, 2.5564146146732627e-7),
  vector(2, -0.20857496409370685, 0.9609246683816232, -0.00005893385352793171, -0.01708537639359917, -0.0037169438359021963, 2.740258199988273e-7),
  vector(3, -0.2256269957011219, 0.9570583780467525, -0.000058650670623330626, -0.01701780207266366, -0.004015437159455943, 2.9232535368706003e-7),
  vector(4, -0.24260880239286978, 0.952894209639051, -0.000058349233086501766, -0.016944930360782845, -0.004312683787417974, 3.1053409199143404e-7),
  vector(5, -0.25951509848773435, 0.948433458362741, -0.0000580296346848411, -0.016866784990923825, -0.004608586779154715, 3.28646096437304e-7)
];

export const orbitBenchmarkPoints: OrbitBenchmarkPoint[] = jplHorizonsEarthSunVectors.map((jpl, index) => {
  const twoBody = twoBodyOrbitVectors[index];

  return {
    day: jpl.day,
    jpl,
    twoBody,
    positionErrorAu: positionErrorAu(jpl, twoBody)
  };
});

export function positionErrorAu(left: OrbitVector, right: OrbitVector) {
  return Math.hypot(left.xAu - right.xAu, left.yAu - right.yAu, left.zAu - right.zAu);
}

export function maxOrbitBenchmarkPositionErrorAu() {
  return Math.max(...orbitBenchmarkPoints.map((point) => point.positionErrorAu));
}

export function orbitPositionAtProgress(progress: number) {
  const clamped = Math.min(1, Math.max(0, progress));
  const scaled = clamped * (twoBodyOrbitVectors.length - 1);
  const lowerIndex = Math.floor(scaled);
  const upperIndex = Math.min(twoBodyOrbitVectors.length - 1, lowerIndex + 1);
  const local = scaled - lowerIndex;
  const lower = twoBodyOrbitVectors[lowerIndex];
  const upper = twoBodyOrbitVectors[upperIndex];

  return vector(
    lower.day + (upper.day - lower.day) * local,
    lower.xAu + (upper.xAu - lower.xAu) * local,
    lower.yAu + (upper.yAu - lower.yAu) * local,
    lower.zAu + (upper.zAu - lower.zAu) * local,
    lower.vxAuPerDay + (upper.vxAuPerDay - lower.vxAuPerDay) * local,
    lower.vyAuPerDay + (upper.vyAuPerDay - lower.vyAuPerDay) * local,
    lower.vzAuPerDay + (upper.vzAuPerDay - lower.vzAuPerDay) * local
  );
}

function vector(
  day: number,
  xAu: number,
  yAu: number,
  zAu: number,
  vxAuPerDay: number,
  vyAuPerDay: number,
  vzAuPerDay: number
): OrbitVector {
  return { day, xAu, yAu, zAu, vxAuPerDay, vyAuPerDay, vzAuPerDay };
}
