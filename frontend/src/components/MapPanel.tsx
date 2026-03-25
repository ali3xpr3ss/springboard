import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import type { Opportunity } from "../types";

const defaultCenter: [number, number] = [55.751244, 37.618423]; // Москва

const iconDefault = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const iconFavorite = new L.DivIcon({
  className: "tramplin-fav-marker",
  html:
    '<div style="width:18px;height:18px;border-radius:999px;background:#22c55e;box-shadow:0 0 0 5px rgba(34,197,94,0.22), 0 12px 30px rgba(0,0,0,0.35);border:2px solid rgba(255,255,255,0.85)"></div>',
  iconAnchor: [9, 9],
});

const TYPE_LABELS: Record<string, string> = {
  internship: "Стажировка",
  vacancy: "Вакансия",
  mentoring: "Менторство",
  event: "Мероприятие",
};

function salaryText(o: Opportunity): string | null {
  if (o.salary_from && o.salary_to) return `${o.salary_from.toLocaleString("ru")} – ${o.salary_to.toLocaleString("ru")} ₽`;
  if (o.salary_from) return `от ${o.salary_from.toLocaleString("ru")} ₽`;
  if (o.salary_to) return `до ${o.salary_to.toLocaleString("ru")} ₽`;
  return null;
}

export function MapPanel(props: {
  opportunities: Opportunity[];
  favoriteIds: Set<number>;
  onSelect: (o: Opportunity) => void;
  onOpenModal?: (o: Opportunity) => void;
}) {
  const { opportunities, favoriteIds, onSelect, onOpenModal } = props;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
      <MapContainer
        center={defaultCenter}
        zoom={10}
        style={{ height: 520, width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {opportunities
          .filter((o) => typeof o.lat === "number" && typeof o.lng === "number")
          .map((o) => {
            const fav = favoriteIds.has(o.id);
            const salary = salaryText(o);
            return (
              <Marker
                key={o.id}
                position={[o.lat as number, o.lng as number]}
                icon={fav ? iconFavorite : iconDefault}
              >
                <Popup>
                  <div style={{ minWidth: 240 }}>
                    {o.company_name && (
                      <div style={{ fontSize: 11, color: "rgba(0,0,0,0.5)", marginBottom: 2 }}>{o.company_name}</div>
                    )}
                    <div style={{ fontWeight: 700 }}>{o.title}</div>
                    <div style={{ marginTop: 4, fontSize: 12, opacity: 0.75 }}>
                      {TYPE_LABELS[o.opportunity_type] ?? o.opportunity_type}
                      {" · "}
                      {o.city ?? "—"}
                      {o.address ? `, ${o.address}` : ""}
                    </div>
                    {salary && (
                      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600 }}>{salary}</div>
                    )}
                    {o.tags?.length ? (
                      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {o.tags.slice(0, 4).map((t) => (
                          <span
                            key={t.id}
                            style={{
                              fontSize: 11,
                              border: "1px solid rgba(0,0,0,0.12)",
                              background: "rgba(0,0,0,0.04)",
                              borderRadius: 999,
                              padding: "2px 6px",
                            }}
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {onOpenModal && (
                      <button
                        type="button"
                        style={{
                          marginTop: 8,
                          width: "100%",
                          padding: "7px 0",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                          border: "1px solid rgba(59,130,246,0.5)",
                          borderRadius: 8,
                          color: "#fff",
                          boxShadow: "0 2px 8px rgba(59,130,246,0.25)",
                        }}
                        onClick={(e) => { e.stopPropagation(); onOpenModal(o); }}
                      >
                        Подробнее
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
