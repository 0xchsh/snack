import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";

export const AnalyticsDashboard = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header animation
  const headerOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });
  const headerY = interpolate(frame, [0, fps * 0.5], [-30, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Dashboard card animation
  const dashboardScale = spring({
    frame: frame - fps * 0.3,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  // Stats data - matches Snack's dashboard
  const stats = [
    { label: "Links", value: 847, icon: "🔗" },
    { label: "Views", value: 12847, icon: "👁️" },
    { label: "Stars", value: 892, icon: "⭐" },
  ];

  // Animated counter
  const getAnimatedValue = (targetValue: number, delay: number) => {
    const progress = interpolate(
      frame,
      [delay, delay + fps * 1.5],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      }
    );
    return Math.floor(targetValue * progress);
  };

  // Format number with K suffix
  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // List stats - matches Snack's per-list stats
  const listStats = [
    { emoji: "🚀", title: "Dev Resources", links: 24, views: 3421, stars: 156 },
    { emoji: "📚", title: "Reading List", links: 18, views: 2847, stars: 89 },
    { emoji: "🎨", title: "Design Tools", links: 12, views: 1923, stars: 67 },
  ];

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Geist, -apple-system, BlinkMacSystemFont, sans-serif",
        padding: 80,
      }}
    >
      {/* Section Header */}
      <div
        style={{
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
          marginBottom: 60,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: 64,
            fontWeight: 600,
            color: "#0a0a0a",
            margin: 0,
            letterSpacing: "-0.04em",
          }}
        >
          Track your impact
        </h2>
        <p
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: "#71717a",
            marginTop: 16,
          }}
        >
          Detailed analytics for every list
        </p>
      </div>

      {/* Dashboard - matches Snack's stats layout */}
      <div
        style={{
          transform: `scale(${Math.max(0, dashboardScale)})`,
          width: 560,
        }}
      >
        {/* Summary Stats Row - matches Snack's border-based stat cards */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {stats.map((stat, index) => {
            const cardDelay = fps * 0.8 + index * fps * 0.2;
            const cardOpacity = interpolate(
              frame,
              [cardDelay, cardDelay + fps * 0.3],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const cardY = interpolate(
              frame,
              [cardDelay, cardDelay + fps * 0.3],
              [20, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.quad),
              }
            );

            return (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  opacity: cardOpacity,
                  transform: `translateY(${cardY}px)`,
                  border: "1px solid #e5e5e5",
                  borderRadius: 8,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 100,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#71717a",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{stat.icon}</span>
                  <span style={{ fontSize: 14 }}>{stat.label}</span>
                </div>
                <p
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#0a0a0a",
                    margin: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatCount(getAnimatedValue(stat.value, cardDelay))}
                </p>
              </div>
            );
          })}
        </div>

        {/* Per-list stats header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
            color: "#71717a",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
          </svg>
          <span style={{ fontSize: 16 }}>3 lists</span>
        </div>

        {/* Per-list stats - matches Snack's list row style */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {listStats.map((list, index) => {
            const itemDelay = fps * 2 + index * fps * 0.15;
            const itemOpacity = interpolate(
              frame,
              [itemDelay, itemDelay + fps * 0.3],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <div
                key={list.title}
                style={{
                  opacity: itemOpacity,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  backgroundColor: "#fafafa",
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{list.emoji}</span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      color: "#0a0a0a",
                    }}
                  >
                    {list.title}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    color: "#71717a",
                    fontSize: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span>🔗</span>
                    <span>{list.links}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span>👁️</span>
                    <span>{formatCount(getAnimatedValue(list.views, itemDelay))}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span>⭐</span>
                    <span>{getAnimatedValue(list.stars, itemDelay)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
