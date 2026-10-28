import type { Project } from "@/lib/portfolioData";

const ART: Record<string, { eyebrow: string; title: string; accent: string; motif: string }> = {
  "shopify-product-classifier": { eyebrow: "ML / CATALOG TOOLS", title: "Products,\nclassified", accent: "#c0de8a", motif: "taxonomy" },
  "temple-pooja-booking": { eyebrow: "BOOKING / CALENDAR", title: "A better way\nto make a visit", accent: "#e2aa67", motif: "calendar" },
  "3d-island-portfolio": { eyebrow: "INTERACTIVE / THREE.JS", title: "A world\nto explore", accent: "#9de1db", motif: "island" },
  "texfix-mobile-app": { eyebrow: "FIELD OPS / MOBILE", title: "Tools for\nwork in the field", accent: "#c2a5f1", motif: "mobile" },
  "natuvipani-farmer-app": { eyebrow: "MOBILE / AGRICULTURE", title: "Tools for\nfield work", accent: "#a9d784", motif: "field" },
  "movie-booking-system": { eyebrow: "WEB APP / BOOKING", title: "Find your\nnext show", accent: "#f3838c", motif: "screen" },
  "movie-wishlist": { eyebrow: "WEB APP / PERSONAL LIBRARY", title: "Keep your\nfilms close", accent: "#bba7f4", motif: "screen" },
  "image-to-3d-surface-visualizer": { eyebrow: "WEBGL / IMAGE TOOL", title: "An image,\nwith depth", accent: "#75c8d9", motif: "surface" },
  "worker-inventory-api": { eyebrow: "API / FIELD OPERATIONS", title: "Stock in\ngood hands", accent: "#f1b57a", motif: "inventory" },
  eventmaster: { eyebrow: "WEB APP / EVENTS", title: "Every event,\nin one place", accent: "#f5bd6b", motif: "event" },
  kandakalankavu: { eyebrow: "WEB / COMMUNITY", title: "A place with\na story to tell", accent: "#c89b79", motif: "place" },
};

export default function ProjectArtwork({ project, compact = false }: { project: Project; compact?: boolean }) {
  const art = ART[project.slug] ?? ART.eventmaster;
  return (
    <div className={`project-artwork${compact ? " project-artwork-compact" : ""}`} style={{ "--art-accent": art.accent } as React.CSSProperties} aria-label={`${project.title} project illustration`} role="img">
      <div className="artwork-grid" />
      <div className={`artwork-motif motif-${art.motif}`} aria-hidden="true">
        {art.motif === "calendar" && <div className="mini-calendar"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>}
        {art.motif === "island" && <><span className="island-sun" /><span className="island-hill" /><span className="island-water" /></>}
        {art.motif === "mobile" && <div className="mini-phone"><b /><i /><i /><i /></div>}
        {art.motif === "field" && <><span /><span /><span /><span /><span /></>}
        {art.motif === "screen" && <div className="mini-screen"><i /><i /><i /></div>}
        {art.motif === "event" && <><span className="event-orbit" /><span className="event-core">E</span></>}
        {art.motif === "place" && <><span className="place-roof" /><span className="place-body" /></>}
        {art.motif === "taxonomy" && <div className="mini-taxonomy"><b>14,606</b><i /><i /><i /><i /></div>}
        {art.motif === "surface" && <div className="mini-surface"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>}
        {art.motif === "inventory" && <div className="mini-inventory"><i /><i /><i /><i /><i /><i /></div>}
      </div>
      <div className="artwork-copy"><span>{art.eyebrow}</span><strong>{art.title.split("\n").map((line) => <span key={line}>{line}</span>)}</strong></div>
      <span className="artwork-index">{project.featured ? "SELECTED" : "PROJECT"}</span>
    </div>
  );
}
