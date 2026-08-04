import type { Metadata } from "next";
import type { ScientificPrimitive } from "../primitives.ts";
import { primitiveGalleryPrimitives, resolveCoord } from "../primitives.ts";

export const metadata: Metadata = {
  title: "Spatial Ravia Primitives | Ravia Lab",
  description: "Development gallery for generic scientific visualization primitives."
};

export default function PrimitiveGalleryPage() {
  return (
    <main className="primitiveGallery">
      <section className="primitiveGalleryHeader">
        <p>Spatial Ravia / development</p>
        <h1>Primitive gallery</h1>
      </section>

      <section className="primitiveGalleryCanvas" aria-label="Scientific primitive gallery">
        <svg viewBox="0 0 560 520" role="img" aria-label="Gallery of scientific visualization primitives">
          <PrimitiveSvgDefs />
          {primitiveGalleryPrimitives.map((primitive) => (
            <g key={primitive.id}>
              {renderPrimitive(primitive)}
              {primitive.labels.map((label) => (
                <text
                  className="renderLabel"
                  key={`${primitive.id}-${label.text}`}
                  x={resolveCoord(label.at[0], 0)}
                  y={resolveCoord(label.at[1], 0)}
                >
                  {label.text}
                </text>
              ))}
            </g>
          ))}
        </svg>
      </section>
    </main>
  );
}

function renderPrimitive(primitive: ScientificPrimitive) {
  const className = [
    "scientificPrimitive",
    `primitive-${primitive.kind}`,
    `primitive-${primitive.styleToken}`
  ].join(" ");
  const geometry = primitive.geometry;
  const directionalProps =
    primitive.kind === "directional-arrow" ? { markerEnd: "url(#primitive-arrowhead)" } : {};

  if ("d" in geometry) {
    return <path className={className} d={geometry.d(0)} {...directionalProps} />;
  }

  if ("x1" in geometry) {
    return (
      <line
        className={className}
        {...directionalProps}
        x1={resolveCoord(geometry.x1, 0)}
        y1={resolveCoord(geometry.y1, 0)}
        x2={resolveCoord(geometry.x2, 0)}
        y2={resolveCoord(geometry.y2, 0)}
      />
    );
  }

  if ("width" in geometry) {
    return (
      <rect
        className={className}
        x={resolveCoord(geometry.x, 0)}
        y={resolveCoord(geometry.y, 0)}
        width={resolveCoord(geometry.width, 0)}
        height={resolveCoord(geometry.height, 0)}
      />
    );
  }

  if ("r" in geometry) {
    return (
      <circle
        className={className}
        cx={resolveCoord(geometry.cx, 0)}
        cy={resolveCoord(geometry.cy, 0)}
        r={resolveCoord(geometry.r, 0)}
      />
    );
  }

  if ("rx" in geometry) {
    return (
      <ellipse
        className={className}
        cx={resolveCoord(geometry.cx, 0)}
        cy={resolveCoord(geometry.cy, 0)}
        rx={resolveCoord(geometry.rx, 0)}
        ry={resolveCoord(geometry.ry, 0)}
      />
    );
  }

  if ("points" in geometry) {
    return (
      <polygon
        className={className}
        points={geometry.points
          .map(([x, y]) => `${resolveCoord(x, 0)},${resolveCoord(y, 0)}`)
          .join(" ")}
      />
    );
  }

  if ("time" in geometry) {
    return (
      <g className={className}>
        <line x1={36 + geometry.time * 180} y1={486} x2={36 + geometry.time * 180} y2={510} />
        <text x={44 + geometry.time * 180} y={504}>{geometry.label}</text>
      </g>
    );
  }

  if ("radius" in geometry) {
    return (
      <g className={className}>
        <circle
          cx={resolveCoord(geometry.x, 0)}
          cy={resolveCoord(geometry.y, 0)}
          r={resolveCoord(geometry.radius, 0)}
        />
        <text x={resolveCoord(geometry.x, 0) + 28} y={resolveCoord(geometry.y, 0) + 4}>
          {geometry.label}
        </text>
      </g>
    );
  }

  return "text" in geometry ? (
    <text
      className={className}
      x={resolveCoord(geometry.x, 0)}
      y={resolveCoord(geometry.y, 0)}
    >
      {geometry.text}
    </text>
  ) : null;
}

function PrimitiveSvgDefs() {
  return (
    <defs>
      <marker
        id="primitive-arrowhead"
        markerHeight="10"
        markerWidth="10"
        orient="auto"
        refX="8"
        refY="5"
      >
        <path d="M0 0 L10 5 L0 10 Z" className="primitiveMarker" />
      </marker>
    </defs>
  );
}
