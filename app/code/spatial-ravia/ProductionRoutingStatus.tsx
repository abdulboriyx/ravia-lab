"use client";

import type { ProductionPromptRoute } from "./production-prompt-router";

export function ProductionRoutingStatus({ route }: { route: ProductionPromptRoute }) {
  const failure = route.failure;
  return (
    <section className="spatialRaviaStatus" role={failure ? "alert" : "status"} data-production-route={route.productionOwner}>
      <strong>{failure ? "Production routing error" : "Production route resolved"}</strong>
      <div>Capability: {route.capabilityId}</div>
      <div>Support: {route.capabilitySupportStatus}</div>
      <div>Scientific owner: {route.scientificOwner}</div>
      <div>Production owner: {route.productionOwner}</div>
      <div>P3/P4: {route.p3StateAvailability} / {route.p4StateAvailability}</div>
      <div>Renderer: {route.rendererOwner}</div>
      {failure && <div>{failure.code}: {failure.message}</div>}
    </section>
  );
}
