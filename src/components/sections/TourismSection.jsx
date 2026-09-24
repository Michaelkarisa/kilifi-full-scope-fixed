import React, { useEffect, useMemo, useState } from "react";
import { contentApi } from "../../apis";

const categoryOptions = [
  { key: "all", label: "All" },
  { key: "beaches", label: "🏖️ Beaches" },
  { key: "marine-parks", label: "🐠 Marine Parks" },
  { key: "heritage", label: "🏛️ Heritage" },
  { key: "safaris", label: "🦓 Safaris" },
  { key: "stays", label: "🛏️ Stays" },
];

const BASE_IMAGE = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600";

function getImageUrl(image) {
  if (!image) return null;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  const base = import.meta.env.VITE_MEDIA_URL || "https://api.klfcounty.org/storage";
  return image.startsWith("/") ? `${base}${image}` : `${base}/${image}`;
}

function getInitials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function TourismSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [data, setData] = useState({
    destinations: [],
    experiences: [],
    accommodations: [],
    stats: [],
  });

  useEffect(() => {
    let mounted = true;
    async function fetchTourismData() {
      try {
        setLoading(true);
        setError("");
        const res = await contentApi.getTourism({ page: 1, per_page: 100 });
        const d = res?.data?.data || res?.data || {};
        if (mounted) {
          setData({
            destinations: d.destinations || [],
            experiences: d.experiences || [],
            accommodations: d.accommodations || [],
            stats: d.stats || [],
          });
        }
      } catch (err) {
        if (mounted) setError(err?.message || "Failed to load tourism data");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchTourismData();
    return () => { mounted = false; };
  }, []);

  const filteredDestinations = useMemo(() => {
    if (activeCat === "all") return data.destinations;
    return data.destinations.filter((d) => d.category?.slug === activeCat);
  }, [activeCat, data.destinations]);

  const showDestinations = activeCat !== "stays";
  const showExperiences = activeCat !== "stays";

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <p style={{ color: "var(--color-text-secondary)", marginTop: 12, fontSize: 14 }}>
          Loading tourism data…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorWrap}>
        <p style={{ color: "var(--color-text-danger)", fontSize: 14 }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* ── Hero ── */}
      <div style={styles.hero}>
        <p style={styles.heroEyebrow}>Kilifi County</p>
        <h1 style={styles.heroTitle}>Discover the Kenyan Coast</h1>
        <p style={styles.heroSub}>
          Marine parks, heritage ruins, wide beaches and vibrant cultural experiences
          along one of East Africa's most beautiful coastlines.
        </p>
        {data.stats.length > 0 && (
          <div style={styles.statsRow}>
            {data.stats.map((s) => (
              <div key={s.id} style={styles.statCard}>
                <span style={styles.statIcon}>{s.icon}</span>
                <span style={styles.statVal}>{s.value}</span>
                <span style={styles.statLbl}>{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Category pills ── */}
      <div style={styles.pillsRow}>
        {categoryOptions.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCat(cat.key)}
            style={{
              ...styles.pill,
              ...(activeCat === cat.key ? styles.pillActive : {}),
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Destinations ── */}
      {showDestinations && (
        <section style={styles.section}>
          <p style={styles.sectionLabel}>Destinations</p>
          {filteredDestinations.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
              No destinations in this category.
            </p>
          ) : (
            <div style={styles.destGrid}>
              {filteredDestinations.map((d) => {
                const imgUrl = getImageUrl(d.image) || BASE_IMAGE;
                return (
                  <div key={d.id} style={styles.destCard}>
                    <img
                      src={imgUrl}
                      alt={d.title}
                      style={styles.destImg}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.src = BASE_IMAGE; }}
                    />
                    <div style={styles.destBody}>
                      <div style={styles.destMeta}>
                        <span style={styles.catBadge}>{d.category?.name}</span>
                        {d.is_featured && <span style={styles.featuredBadge}>Featured</span>}
                      </div>
                      <h3 style={styles.destTitle}>{d.title}</h3>
                      <p style={styles.destLocation}>📍 {d.location}</p>
                      <p style={styles.destVibe}>{d.vibe}</p>
                      {d.badges?.length > 0 && (
                        <div style={styles.badgesRow}>
                          {d.badges.map((b) => (
                            <span key={b.id} style={styles.badge}>{b.name}</span>
                          ))}
                        </div>
                      )}
                      <div style={styles.destFooter}>
                        {d.best_time && (
                          <span style={styles.destMini}>⏰ {d.best_time}</span>
                        )}
                        {d.distance_from_kilifi && (
                          <span style={styles.destMini}>🗺 {d.distance_from_kilifi} from Kilifi</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Experiences ── */}
      {showExperiences && data.experiences.length > 0 && (
        <section style={styles.section}>
          <p style={styles.sectionLabel}>Experiences</p>
          <div style={styles.expGrid}>
            {data.experiences.map((e) => {
              const imgUrl = getImageUrl(e.image);
              return (
                <div key={e.id} style={styles.expCard}>
                  {imgUrl ? (
                    <img src={imgUrl} alt={e.title} style={styles.expImg} loading="lazy" />
                  ) : (
                    <div style={styles.expImgPlaceholder} />
                  )}
                  <div style={styles.expBody}>
                    <h4 style={styles.expTitle}>{e.title}</h4>
                    <p style={styles.expDesc}>{e.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Accommodations ── */}
      {data.accommodations.length > 0 && (
        <section style={styles.section}>
          <p style={styles.sectionLabel}>Where to stay</p>
          <div style={styles.accGrid}>
            {data.accommodations.map((a) => (
              <div key={a.id} style={styles.accCard}>
                <div style={styles.accTop}>
                  <div style={styles.accInitials}>{getInitials(a.name)}</div>
                  <div>
                    <p style={styles.accName}>{a.name}</p>
                    <p style={styles.accLoc}>📍 {a.location}</p>
                  </div>
                  <span style={styles.accRating}>★ {parseFloat(a.rating).toFixed(1)}</span>
                </div>
                <p style={styles.accStyle}>{a.style_description}</p>
                {a.website_url && (
                  <a href={a.website_url} target="_blank" rel="noreferrer" style={styles.accLink}>
                    Visit website →
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "24px 20px 48px",
    fontFamily: "var(--font-sans, system-ui, sans-serif)",
  },
  loadingWrap: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "60px 24px",
  },
  errorWrap: {
    padding: "24px", background: "var(--color-background-danger)",
    borderRadius: 12, margin: "24px",
  },

  /* Hero */
  hero: {
    background: "linear-gradient(160deg, #0c447c 0%, #185fa5 50%, #1d9e75 100%)",
    borderRadius: 16, padding: "2.5rem 2rem 2rem", marginBottom: "1.5rem", color: "#fff",
  },
  heroEyebrow: {
    fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
    opacity: 0.7, marginBottom: 8,
  },
  heroTitle: {
    fontSize: "2rem", fontWeight: 500, lineHeight: 1.2, marginBottom: 10,
  },
  heroSub: {
    fontSize: 14, opacity: 0.85, maxWidth: 520, lineHeight: 1.6,
  },
  statsRow: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 12, marginTop: "1.5rem",
  },
  statCard: {
    background: "rgba(255,255,255,0.15)", borderRadius: 10,
    padding: "0.75rem 1rem", textAlign: "center",
    display: "flex", flexDirection: "column", gap: 4,
  },
  statIcon: { fontSize: 16 },
  statVal: { fontSize: "1.2rem", fontWeight: 500 },
  statLbl: { fontSize: 11, opacity: 0.8 },

  /* Pills */
  pillsRow: {
    display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "1.5rem",
  },
  pill: {
    padding: "6px 14px", borderRadius: 999, fontSize: 13, cursor: "pointer",
    border: "0.5px solid var(--color-border-secondary)",
    background: "var(--color-background-primary)",
    color: "var(--color-text-primary)",
    fontFamily: "inherit",
  },
  pillActive: {
    background: "var(--color-text-primary)",
    color: "var(--color-background-primary)",
    borderColor: "var(--color-text-primary)",
  },

  /* Section */
  section: { marginBottom: "2.5rem" },
  sectionLabel: {
    fontSize: 11, fontWeight: 500, letterSpacing: "0.08em",
    textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: 12,
  },

  /* Destinations */
  destGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
  },
  destCard: {
    background: "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: 14, overflow: "hidden",
    display: "flex", flexDirection: "column",
  },
  destImg: { width: "100%", height: 180, objectFit: "cover", display: "block" },
  destBody: {
    padding: "1rem", flex: 1,
    display: "flex", flexDirection: "column", gap: 6,
  },
  destMeta: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" },
  catBadge: {
    fontSize: 11, padding: "3px 8px", borderRadius: 999,
    background: "var(--color-background-secondary)",
    color: "var(--color-text-secondary)",
    border: "0.5px solid var(--color-border-tertiary)",
  },
  featuredBadge: {
    fontSize: 11, padding: "3px 8px", borderRadius: 999,
    background: "var(--color-background-warning)",
    color: "var(--color-text-warning)",
    border: "0.5px solid var(--color-border-warning)",
  },
  destTitle: { fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" },
  destLocation: { fontSize: 12, color: "var(--color-text-secondary)" },
  destVibe: { fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 },
  badgesRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  badge: {
    fontSize: 11, padding: "3px 8px", borderRadius: 999,
    background: "var(--color-background-info)",
    color: "var(--color-text-info)",
    border: "0.5px solid var(--color-border-info)",
  },
  destFooter: {
    display: "flex", flexWrap: "wrap", gap: 10,
    marginTop: "auto", paddingTop: 8,
  },
  destMini: { fontSize: 11, color: "var(--color-text-tertiary)" },

  /* Experiences */
  expGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 14,
  },
  expCard: {
    background: "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: 14, overflow: "hidden",
  },
  expImg: { width: "100%", height: 130, objectFit: "cover", display: "block" },
  expImgPlaceholder: {
    width: "100%", height: 130,
    background: "var(--color-background-secondary)",
  },
  expBody: { padding: "0.875rem" },
  expTitle: { fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4 },
  expDesc: { fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5 },

  /* Accommodations */
  accGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 14,
  },
  accCard: {
    background: "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: 14, padding: "1rem 1.125rem",
    display: "flex", flexDirection: "column", gap: 8,
  },
  accTop: { display: "flex", alignItems: "center", gap: 10 },
  accInitials: {
    width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
    background: "var(--color-background-info)",
    color: "var(--color-text-info)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 500,
  },
  accName: { fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" },
  accLoc: { fontSize: 12, color: "var(--color-text-secondary)" },
  accRating: {
    marginLeft: "auto", fontSize: 13, fontWeight: 500,
    color: "var(--color-text-success)", flexShrink: 0,
  },
  accStyle: { fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 },
  accLink: {
    fontSize: 12, color: "var(--color-text-info)",
    textDecoration: "none", marginTop: 4,
  },
};