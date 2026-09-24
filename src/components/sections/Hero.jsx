import React, { useEffect, useMemo, useState } from "react";
import { contentApi } from "../../apis";

export default function Hero({
  homeData,
  onShowNews,
  onPrimaryAction,
  onSecondaryAction,
}) {
  const [apiData, setApiData] = useState(homeData || null);

  const payload =
    apiData && typeof apiData === "object" && "data" in apiData
      ? apiData.data || {}
      : apiData || {};

  const heroes = (payload.heroes || []).filter(
    (hero) => hero.is_active !== false
  );

  const stats = (payload.stats || []).filter(
    (stat) => stat.is_active !== false
  );

  const [activeIndex, setActiveIndex] = useState(0);

  const activeHero = useMemo(() => {
    if (!heroes.length) return null;
    return heroes[activeIndex] || heroes[0];
  }, [heroes, activeIndex]);

  useEffect(() => {
    setApiData(homeData || null);
  }, [homeData]);

  useEffect(() => {
    if (homeData) return;

    let mounted = true;

    async function fetchHome() {
      try {
        const res = await contentApi.getHome({
          page: 1,
          per_page: 12,
        });

        if (!mounted) return;

        setApiData(res?.data || res || null);
      } catch (err) {
        console.error("Failed to fetch home data", err);
      }
    }

    fetchHome();

    return () => {
      mounted = false;
    };
  }, [homeData]);

  useEffect(() => {
    if (!heroes.length) {
      setActiveIndex(0);
      return;
    }

    if (activeIndex >= heroes.length) {
      setActiveIndex(0);
    }
  }, [heroes, activeIndex]);

  useEffect(() => {
    if (heroes.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroes.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [heroes.length]);

  const handlePrimary = () => {
    if (onPrimaryAction) {
      onPrimaryAction(activeHero);
      return;
    }

    if (onShowNews) {
      onShowNews();
    }
  };

  const handleSecondary = () => {
    if (onSecondaryAction) {
      onSecondaryAction(activeHero);
    }
  };

  return (
    <section
      className="hero"
      style={{
        position: "relative",
        minHeight: "78vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        background: activeHero?.image
          ? `linear-gradient(90deg, rgba(8,15,30,0.90) 0%, rgba(8,15,30,0.78) 38%, rgba(8,15,30,0.40) 100%), url(${activeHero.image}) center/cover no-repeat`
          : "linear-gradient(135deg, #08111f 0%, #0f2744 48%, #16395e 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 80% 20%, rgba(212,175,55,0.16), transparent 22%), radial-gradient(circle at 20% 80%, rgba(59,130,246,0.16), transparent 24%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="hero-inner"
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "72px 24px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 420px)",
          gap: "28px",
          alignItems: "end",
        }}
      >
        <div>
          <h1 style={{ color: "#fff", fontSize: "56px", margin: 0 }}>
            {activeHero?.title || "Kilifi County Government"}
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,.8)",
              fontSize: "18px",
              marginTop: "18px",
            }}
          >
            {activeHero?.description ||
              "Citizen-first public service supported by digital systems."}
          </p>

          <div
            style={{
              display: "flex",
              gap: "14px",
              marginTop: "24px",
              flexWrap: "wrap",
            }}
          >
            <button onClick={handlePrimary}>
              {activeHero?.cta_primary_label || "Explore"}
            </button>

            <button onClick={handleSecondary}>
              {activeHero?.cta_secondary_label || "Learn More"}
            </button>
          </div>

          {!!stats.length && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
                gap: "14px",
                marginTop: "34px",
              }}
            >
              {stats.map((stat) => (
                <div
                  key={stat.id}
                  style={{
                    background: "rgba(255,255,255,.08)",
                    padding: "16px",
                    borderRadius: "16px",
                    color: "#fff",
                  }}
                >
                  <div>{stat.icon}</div>
                  <div style={{ fontSize: "24px", fontWeight: "700" }}>
                    {stat.value}
                  </div>
                  <div>{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {heroes.length > 1 &&
            heroes.map((hero, index) => (
              <button
                key={hero.id}
                onClick={() => setActiveIndex(index)}
                style={{
                  width: activeIndex === index ? 28 : 10,
                  height: 10,
                  borderRadius: 999,
                  marginRight: 8,
                  border: "none",
                  cursor: "pointer",
                  background:
                    activeIndex === index
                      ? "gold"
                      : "rgba(255,255,255,.3)",
                }}
              />
            ))}
        </div>
      </div>
    </section>
  );
}