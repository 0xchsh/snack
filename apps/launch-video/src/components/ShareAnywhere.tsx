import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";

export const ShareAnywhere = () => {
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

  // URL bar animation
  const urlBarScale = spring({
    frame: frame - fps * 0.4,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  // URL typing animation
  const urlText = "snack.xyz/carlos/dev-resources";
  const typedLength = Math.floor(
    interpolate(frame, [fps * 1, fps * 3], [0, urlText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const displayedUrl = urlText.slice(0, typedLength);

  // Cursor blink
  const cursorVisible = Math.floor(frame / 15) % 2 === 0 && frame < fps * 3.5;

  // Share buttons animation
  const shareButtonsVisible = frame > fps * 3.5;

  const platforms = [
    { name: "Twitter", icon: "𝕏" },
    { name: "Copy", icon: "🔗" },
    { name: "Share", icon: "↗" },
  ];

  // Social preview card
  const previewScale = spring({
    frame: frame - fps * 4.5,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

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
          Share anywhere
        </h2>
        <p
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: "#71717a",
            marginTop: 16,
          }}
        >
          Beautiful, memorable links
        </p>
      </div>

      {/* URL Bar - clean browser-like style */}
      <div
        style={{
          transform: `scale(${Math.max(0, urlBarScale)})`,
          backgroundColor: "#fafafa",
          borderRadius: 8,
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          border: "1px solid #e5e5e5",
          marginBottom: 40,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            backgroundColor: "#22c55e",
            borderRadius: 5,
          }}
        />
        <span
          style={{
            fontSize: 20,
            fontFamily: "Geist Mono, monospace",
            color: "#0a0a0a",
            fontWeight: 500,
          }}
        >
          {displayedUrl}
          {cursorVisible && (
            <span style={{ color: "#0a0a0a", marginLeft: 2 }}>|</span>
          )}
        </span>
      </div>

      {/* Share Buttons */}
      {shareButtonsVisible && (
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 50,
          }}
        >
          {platforms.map((platform, index) => {
            const buttonScale = spring({
              frame: frame - fps * 3.5 - index * 5,
              fps,
              config: { damping: 12, stiffness: 120 },
            });

            return (
              <div
                key={platform.name}
                style={{
                  transform: `scale(${Math.max(0, buttonScale)})`,
                  backgroundColor: "#fafafa",
                  borderRadius: 8,
                  padding: "12px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: "1px solid #e5e5e5",
                }}
              >
                <span style={{ fontSize: 16 }}>{platform.icon}</span>
                <span
                  style={{ fontSize: 16, fontWeight: 500, color: "#0a0a0a" }}
                >
                  {platform.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Social Preview Card - matches Snack's OG image style */}
      {frame > fps * 4.5 && (
        <div
          style={{
            transform: `scale(${Math.max(0, previewScale)})`,
            backgroundColor: "#fff",
            borderRadius: 8,
            overflow: "hidden",
            width: 480,
            border: "1px solid #e5e5e5",
          }}
        >
          {/* Preview Header - neutral gray, no gradient */}
          <div
            style={{
              height: 140,
              backgroundColor: "#fafafa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderBottom: "1px solid #e5e5e5",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                backgroundColor: "#fff",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                border: "1px solid #e5e5e5",
              }}
            >
              🚀
            </div>
          </div>
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 13, color: "#71717a", margin: 0 }}>
              snack.xyz
            </p>
            <h4
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#0a0a0a",
                margin: 0,
                marginTop: 6,
                letterSpacing: "-0.02em",
              }}
            >
              Dev Resources
            </h4>
            <p style={{ fontSize: 15, color: "#71717a", margin: 0, marginTop: 6 }}>
              A curated list of essential developer tools
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
