import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";

const mockLinks = [
  { emoji: "📚", title: "React Documentation", url: "react.dev" },
  { emoji: "🎨", title: "Tailwind CSS", url: "tailwindcss.com" },
  { emoji: "⚡", title: "Vercel", url: "vercel.com" },
  { emoji: "🔥", title: "Next.js", url: "nextjs.org" },
];

export const CreateLists = () => {
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

  // Mock list card
  const cardScale = spring({
    frame: frame - fps * 0.3,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  // Cursor animation (simulating paste action)
  const cursorVisible = frame > fps * 2;
  const cursorX = interpolate(frame, [fps * 2, fps * 3], [800, 650], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const cursorY = interpolate(frame, [fps * 2, fps * 3], [280, 280], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Typing animation for paste
  const pasteText = "snack.xyz, tailwindcss.com";
  const typedLength = Math.floor(
    interpolate(frame, [fps * 3.2, fps * 4.5], [0, pasteText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const displayedPaste = pasteText.slice(0, typedLength);

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
          Create beautiful lists
        </h2>
        <p
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: "#71717a",
            marginTop: 16,
          }}
        >
          Paste links, organize instantly
        </p>
      </div>

      {/* Mock List Editor - matches Snack's actual UI */}
      <div
        style={{
          transform: `scale(${Math.max(0, cardScale)})`,
          backgroundColor: "#fff",
          borderRadius: 8,
          padding: 32,
          width: 560,
          border: "1px solid #e5e5e5",
        }}
      >
        {/* List Header with emoji */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 48 }}>🚀</span>
          <div>
            <h3
              style={{
                fontSize: 30,
                fontWeight: 500,
                color: "#0a0a0a",
                margin: 0,
                letterSpacing: "-0.04em",
              }}
            >
              Dev Resources
            </h3>
          </div>
        </div>

        {/* Stats row with paste button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span style={{ fontSize: 16 }}>{mockLinks.length} links</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              border: "1px solid #e5e5e5",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              color: "#0a0a0a",
            }}
          >
            <span>Paste links</span>
            <div style={{ display: "flex", gap: 4 }}>
              <span
                style={{
                  padding: "2px 6px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: 4,
                  fontSize: 12,
                  color: "#71717a",
                }}
              >
                ⌘
              </span>
              <span
                style={{
                  padding: "2px 6px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: 4,
                  fontSize: 12,
                  color: "#71717a",
                }}
              >
                V
              </span>
            </div>
          </div>
        </div>

        {/* Paste input field */}
        {frame > fps * 3 && (
          <div
            style={{
              marginBottom: 20,
              padding: "12px 16px",
              backgroundColor: "#fafafa",
              borderRadius: 6,
              border: "1px solid #e5e5e5",
            }}
          >
            <span style={{ fontSize: 16, color: "#0a0a0a", fontFamily: "monospace" }}>
              {displayedPaste}
              {frame < fps * 4.5 && (
                <span style={{ color: "#0a0a0a", marginLeft: 2 }}>|</span>
              )}
            </span>
          </div>
        )}

        {/* Links - matches Snack's list row style */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {mockLinks.map((link, index) => {
            const itemDelay = fps * 0.8 + index * fps * 0.15;
            const itemOpacity = interpolate(
              frame,
              [itemDelay, itemDelay + fps * 0.3],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const itemX = interpolate(
              frame,
              [itemDelay, itemDelay + fps * 0.3],
              [20, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.quad),
              }
            );

            return (
              <div
                key={index}
                style={{
                  opacity: itemOpacity,
                  transform: `translateX(${itemX}px)`,
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
                  <span style={{ fontSize: 16 }}>{link.emoji}</span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      color: "#0a0a0a",
                    }}
                  >
                    {link.title}
                  </span>
                </div>
                <span style={{ fontSize: 14, color: "#71717a" }}>
                  {link.url}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cursor */}
      {cursorVisible && frame < fps * 3.2 && (
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            width: 24,
            height: 24,
            pointerEvents: "none",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
              fill="#0a0a0a"
              stroke="#fff"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
