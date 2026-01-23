import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
  AbsoluteFill,
  Easing,
} from "remotion";

// Snack logo SVG path (pretzel shape)
const SNACK_LOGO_PATH =
  "M58.5064 70.6484C52.1697 70.6484 37.5611 70.6961 37.5611 70.6961C37.5611 70.6961 36.7845 71.9912 36.1615 73.0367C34.7565 75.3918 33.3576 76.8799 30.414 75.423C27.7802 74.1216 26.7838 72.3093 28.2968 69.6402C29.5594 67.4081 28.9232 66.0446 27.0964 64.3014C18.7448 56.3308 15.4403 46.2395 17.7636 35.1552C20.3864 22.6424 32.1372 16.0472 44.7828 22.8678C46.6249 23.8621 48.0147 24.8897 50.3871 23.4099C56.9948 19.2902 64.0464 18.5019 70.6354 23.2841C77.7742 28.466 79.6723 36.1917 78.7436 44.4562C77.8516 52.3998 74.4399 59.3373 68.393 64.8691C67.5632 65.6276 66.999 67.5105 67.3309 68.5477C68.2775 71.5189 69.0637 74.0711 65.2482 75.5668C61.1775 77.1641 60.4176 73.9854 59.1266 71.5002C58.9952 71.2492 58.7892 71.0342 58.5064 70.6484ZM32.9566 57.3452C33.2256 57.2885 39.5891 42.285 42.5217 34.9609C42.8633 34.107 42.5217 32.5532 41.9076 31.8168C38.5921 27.8457 31.629 28.3664 28.6957 32.6673C23.751 39.916 25.7224 50.3406 32.9566 57.3452ZM62.8149 57.6639C69.0319 51.1137 71.3186 44.2156 69.1668 36.1475C67.2659 29.0157 59.4053 26.7774 53.9842 31.7753C53.3909 32.3223 52.8792 33.6651 53.1385 34.3137C56.1782 41.9026 59.3728 49.4285 62.8149 57.6639ZM40.7723 61.8017H55.188C52.7015 55.7818 50.5151 50.4851 47.9393 44.2501C45.3325 50.6338 43.2125 55.8295 40.7723 61.8017Z";

const SnackLogo = ({ size = 80, color = "#fafafa" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
    <rect x="4" y="4" width="88" height="88" rx="20" stroke={color} strokeWidth="8" />
    <path d={SNACK_LOGO_PATH} fill={color} />
  </svg>
);

const darkStyle: React.CSSProperties = {
  fontFamily: "Geist, -apple-system, BlinkMacSystemFont, sans-serif",
  backgroundColor: "#0a0a0a",
};

const whiteStyle: React.CSSProperties = {
  fontFamily: "Geist, -apple-system, BlinkMacSystemFont, sans-serif",
  backgroundColor: "#fff",
};

// === LOGO INTRO ===
const LogoIntro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = interpolate(frame, [0, fps * 0.25], [3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const opacity = interpolate(frame, [0, fps * 0.1], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...darkStyle, justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `scale(${scale})`, opacity }}>
        <SnackLogo size={160} color="#fafafa" />
      </div>
    </AbsoluteFill>
  );
};

// === TEXT FLASH ===
const TextFlash = ({ text, dark = true }: { text: string; dark?: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = interpolate(frame, [0, fps * 0.18], [1.4, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const opacity = interpolate(frame, [0, fps * 0.08], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...(dark ? darkStyle : whiteStyle), justifyContent: "center", alignItems: "center" }}>
      <h1 style={{ fontSize: 110, fontWeight: 500, color: dark ? "#fafafa" : "#0a0a0a", margin: 0, letterSpacing: "-0.04em", transform: `scale(${scale})`, opacity }}>
        {text}
      </h1>
    </AbsoluteFill>
  );
};

// ============================================================
// STEP 1: PASTE LINKS TO A LIST
// ============================================================

// Empty list → user creates "Best AI Resources"
const EmptyListUI = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom = interpolate(frame, [0, fps * 0.3], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Title typing
  const title = "Best AI Resources";
  const typedTitle = Math.floor(interpolate(frame, [fps * 0.3, fps * 1.2], [0, title.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));

  return (
    <AbsoluteFill style={{ ...darkStyle, justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `scale(${zoom})`, width: 580, textAlign: "center" }}>
        {/* Emoji */}
        <div style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 56 }}>🤖</span>
        </div>

        {/* Title typing */}
        <h1 style={{ fontSize: 38, fontWeight: 600, color: "#fafafa", margin: "0 0 24px", minHeight: 48 }}>
          {title.slice(0, typedTitle)}
          {frame < fps * 1.3 && <span style={{ color: "#71717a", opacity: Math.floor(frame / 8) % 2 }}>|</span>}
        </h1>

        {/* Stats + paste button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#71717a", fontSize: 15 }}>
            <span>🔗</span>
            <span>0 links</span>
          </div>
          <div style={{ padding: "10px 18px", backgroundColor: "#27272a", color: "#fafafa", borderRadius: 8, fontSize: 15, fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
            Paste links
            <div style={{ display: "flex", gap: 4 }}>
              <span style={{ padding: "2px 6px", backgroundColor: "#3f3f46", borderRadius: 4, fontSize: 12 }}>⌘</span>
              <span style={{ padding: "2px 6px", backgroundColor: "#3f3f46", borderRadius: 4, fontSize: 12 }}>V</span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Pasting links into the list - combined paste + full list view
const PasteLinksUI = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom = interpolate(frame, [0, fps * 0.25], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Paste input typing (faster for 2s scene)
  const pasteText = "chatgpt.com, claude.ai, gemini.google.com, perplexity.ai";
  const typedLength = Math.floor(interpolate(frame, [fps * 0.1, fps * 0.6], [0, pasteText.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));

  // All 8 links
  const links = [
    { emoji: "💬", title: "ChatGPT", url: "chatgpt.com" },
    { emoji: "🟣", title: "Claude", url: "claude.ai" },
    { emoji: "✨", title: "Gemini", url: "gemini.google.com" },
    { emoji: "🔍", title: "Perplexity", url: "perplexity.ai" },
    { emoji: "🧠", title: "Hugging Face", url: "huggingface.co" },
    { emoji: "📝", title: "Notion AI", url: "notion.so/ai" },
    { emoji: "⚡", title: "Cursor", url: "cursor.com" },
    { emoji: "🎨", title: "Midjourney", url: "midjourney.com" },
  ];

  return (
    <AbsoluteFill style={{ ...darkStyle, justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `scale(${zoom})`, width: 560 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <span style={{ fontSize: 36 }}>🤖</span>
          <span style={{ fontSize: 24, fontWeight: 600, color: "#fafafa" }}>Best AI Resources</span>
        </div>

        {/* Paste input */}
        <div style={{ marginBottom: 16, padding: "12px 16px", backgroundColor: "#18181b", borderRadius: 8, border: "2px solid #fafafa" }}>
          <span style={{ fontSize: 13, color: "#fafafa", fontFamily: "Geist Mono, monospace" }}>
            {pasteText.slice(0, typedLength)}
            {frame < fps * 0.65 && <span style={{ opacity: Math.floor(frame / 6) % 2 }}>|</span>}
          </span>
        </div>

        {/* Links appearing */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {links.map((link, i) => {
            const delay = fps * 0.65 + i * 2;
            const itemOpacity = interpolate(frame, [delay, delay + 3], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const itemScale = interpolate(frame, [delay, delay + 4], [0.9, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.back(1.5)),
            });

            return (
              <div
                key={i}
                style={{
                  opacity: itemOpacity,
                  transform: `scale(${itemScale})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "11px 14px",
                  backgroundColor: "#18181b",
                  borderRadius: 7,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <span style={{ fontSize: 16 }}>{link.emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#fafafa" }}>{link.title}</span>
                </div>
                <span style={{ fontSize: 12, color: "#71717a" }}>{link.url}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================
// STEP 2: SHARE THAT LIST
// ============================================================

// Share URL
const ShareURLUI = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom = interpolate(frame, [0, fps * 0.25], [0.75, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const url = "snack.xyz/charles/ai-resources";
  const typedLength = Math.floor(interpolate(frame, [fps * 0.2, fps * 0.8], [0, url.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));

  return (
    <AbsoluteFill style={{ ...darkStyle, justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center", transform: `scale(${zoom})` }}>
        <div style={{ backgroundColor: "#18181b", borderRadius: 12, padding: "22px 36px", border: "1px solid #27272a", marginBottom: 32, display: "inline-block" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 12, height: 12, backgroundColor: "#22c55e", borderRadius: 6 }} />
            <span style={{ fontSize: 26, fontFamily: "Geist Mono, monospace", fontWeight: 500, color: "#fafafa" }}>
              {url.slice(0, typedLength)}
              {frame < fps * 0.9 && <span style={{ opacity: Math.floor(frame / 6) % 2 }}>|</span>}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          {[
            { icon: "𝕏", label: "Tweet" },
            { icon: "🔗", label: "Copy" },
            { icon: "💬", label: "Message" },
          ].map((btn, i) => {
            const btnDelay = fps * 0.9 + i * 3;
            const btnScale = interpolate(frame, [btnDelay, btnDelay + 5], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.back(2)),
            });
            return (
              <div key={i} style={{ transform: `scale(${btnScale})`, padding: "14px 24px", backgroundColor: i === 0 ? "#fafafa" : "#27272a", color: i === 0 ? "#0a0a0a" : "#fafafa", borderRadius: 8, fontSize: 15, fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
                <span>{btn.icon}</span>
                <span>{btn.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// iMessage showing the shared list
const TextMessageUI = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom = interpolate(frame, [0, fps * 0.3], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const msg1X = interpolate(frame, [0, fps * 0.2], [-80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const msg2X = interpolate(frame, [fps * 0.2, fps * 0.4], [80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const cardScale = interpolate(frame, [fps * 0.5, fps * 0.7], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.5)),
  });
  const cardOpacity = interpolate(frame, [fps * 0.5, fps * 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ ...whiteStyle, justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `scale(${zoom})`, width: 420 }}>
        {/* Incoming */}
        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12, transform: `translateX(${msg1X}px)` }}>
          <div style={{ backgroundColor: "#e5e5ea", borderRadius: 22, borderBottomLeftRadius: 6, padding: "14px 18px", maxWidth: "85%" }}>
            <p style={{ fontSize: 19, color: "#000", margin: 0, lineHeight: 1.4 }}>
              do you have any good ai resources?
            </p>
          </div>
        </div>

        {/* Outgoing */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10, transform: `translateX(${msg2X}px)` }}>
          <div style={{ backgroundColor: "#007aff", borderRadius: 22, borderBottomRightRadius: 6, padding: "14px 18px", maxWidth: "85%" }}>
            <p style={{ fontSize: 19, color: "#fff", margin: 0, lineHeight: 1.4 }}>
              yeah here's my snack
            </p>
          </div>
        </div>

        {/* OG Preview Card */}
        <div style={{ display: "flex", justifyContent: "flex-end", opacity: cardOpacity, transform: `scale(${cardScale})`, transformOrigin: "right center" }}>
          <div style={{ width: 280, backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #e5e5e5" }}>
            <div style={{ backgroundColor: "#fff", padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", borderBottom: "1px solid #e5e5e5" }}>
              <span style={{ fontSize: 48, marginBottom: 10 }}>🤖</span>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: "#0a0a0a", margin: 0, textAlign: "center" }}>Best AI Resources</h3>
              <p style={{ fontSize: 13, color: "#a1a1aa", margin: "4px 0 0" }}>charles</p>
            </div>
            <div style={{ padding: "10px 14px", backgroundColor: "#fafafa" }}>
              <p style={{ fontSize: 11, color: "#71717a", margin: 0, textTransform: "uppercase", letterSpacing: "0.03em" }}>snack.xyz</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0a0a0a", margin: "2px 0 0" }}>Best AI Resources | Snack</p>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================
// STEP 3: SEE STATS
// ============================================================

const StatsPageUI = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom = interpolate(frame, [0, fps * 0.3], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const stats = [
    { icon: "🔗", label: "Links", value: 170 },
    { icon: "👁", label: "Views", value: 424 },
    { icon: "⭐", label: "Stars", value: 12 },
  ];

  const lists = [
    { emoji: "🤖", title: "Best AI Resources", links: 8, views: 156, stars: 8 },
    { emoji: "📄", title: "Must-Read Articles", links: 13, views: 81, stars: 3 },
    { emoji: "🏢", title: "Cool Websites", links: 8, views: 45, stars: 1 },
    { emoji: "☁️", title: "Must-Have Software", links: 5, views: 44, stars: 0 },
    { emoji: "🎧", title: "Must-Listen Mixes", links: 4, views: 36, stars: 0 },
    { emoji: "💻", title: "Must-Have Hardware", links: 3, views: 35, stars: 0 },
  ];

  const formatNum = (n: number, delay: number) => {
    const progress = interpolate(frame, [delay, delay + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return Math.floor(n * progress);
  };

  return (
    <AbsoluteFill style={{ ...darkStyle, justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `scale(${zoom})`, width: 650 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#27272a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14 }}>👤</span>
          </div>
          <span style={{ fontSize: 18, color: "#fafafa", fontWeight: 500 }}>charles</span>
          <span style={{ fontSize: 18, color: "#71717a" }}>/</span>
          <span style={{ fontSize: 18, color: "#fafafa", fontWeight: 500 }}>Stats</span>
        </div>

        {/* Stats cards */}
        <div style={{ display: "flex", gap: 14, marginBottom: 28 }}>
          {stats.map((stat, i) => {
            const delay = fps * 0.2 + i * 4;
            const cardScale = interpolate(frame, [delay, delay + 6], [0.9, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.back(1.5)),
            });
            const cardOpacity = interpolate(frame, [delay, delay + 4], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div key={i} style={{ flex: 1, opacity: cardOpacity, transform: `scale(${cardScale})`, padding: "18px 22px", backgroundColor: "#18181b", borderRadius: 10, border: "1px solid #27272a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#71717a", marginBottom: 10 }}>
                  <span style={{ fontSize: 15 }}>{stat.icon}</span>
                  <span style={{ fontSize: 13 }}>{stat.label}</span>
                </div>
                <p style={{ fontSize: 34, fontWeight: 700, color: "#fafafa", margin: 0 }}>
                  {formatNum(stat.value, delay)}
                </p>
              </div>
            );
          })}
        </div>

        {/* List header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, color: "#71717a", fontSize: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>☰</span>
            <span>17 lists</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span>Views</span>
            <span>↕</span>
          </div>
        </div>

        {/* List stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {lists.map((list, i) => {
            const delay = fps * 0.5 + i * 2;
            const rowOpacity = interpolate(frame, [delay, delay + 4], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const rowX = interpolate(frame, [delay, delay + 4], [-15, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });

            return (
              <div key={i} style={{ opacity: rowOpacity, transform: `translateX(${rowX}px)`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", backgroundColor: "#18181b", borderRadius: 7 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <span style={{ fontSize: 16 }}>{list.emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#fafafa" }}>{list.title}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 18, color: "#71717a", fontSize: 13 }}>
                  <span>🔗 {list.links}</span>
                  <span>👁 {formatNum(list.views, delay)}</span>
                  <span>⭐ {list.stars}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// === FINAL CTA ===
const FinalCTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = interpolate(frame, [0, fps * 0.2], [2, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const logoOpacity = interpolate(frame, [0, fps * 0.1], [0, 1], { extrapolateRight: "clamp" });

  const textOpacity = interpolate(frame, [fps * 0.3, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [fps * 0.3, fps * 0.5], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ ...whiteStyle, justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ transform: `scale(${logoScale})`, opacity: logoOpacity, marginBottom: 40 }}>
          <SnackLogo size={100} color="#0a0a0a" />
        </div>
        <div style={{ opacity: textOpacity, transform: `translateY(${textY}px)` }}>
          <h1 style={{ fontSize: 72, fontWeight: 500, color: "#0a0a0a", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
            Your{" "}
            <span style={{ color: "#551A8B", textDecoration: "underline", textUnderlineOffset: 6, textDecorationThickness: 4 }}>
              favorite links
            </span>
            <br />
            all in one{" "}
            <span style={{ color: "#0000FF", textDecoration: "underline", textUnderlineOffset: 6, textDecorationThickness: 4 }}>
              place
            </span>
            .
          </h1>
        </div>
      </div>
      <p style={{ fontSize: 36, fontWeight: 400, color: "#71717a", position: "absolute", bottom: 120, margin: 0, opacity: textOpacity }}>
        snack.xyz
      </p>
    </AbsoluteFill>
  );
};

// === MAIN COMPOSITION ===
export const LaunchVideo = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Fade to black in the last 1 second
  const fadeToBlack = interpolate(frame, [durationInFrames - fps, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={darkStyle}>
      {/* 0-0.5s: Logo */}
      <Sequence from={0} durationInFrames={Math.floor(fps * 0.5)}>
        <LogoIntro />
      </Sequence>

      {/* 0.5-0.85s: "All of your" */}
      <Sequence from={Math.floor(fps * 0.5)} durationInFrames={Math.floor(fps * 0.35)}>
        <TextFlash text="All of your" dark={false} />
      </Sequence>

      {/* 0.85-1.2s: "favorite links" */}
      <Sequence from={Math.floor(fps * 0.85)} durationInFrames={Math.floor(fps * 0.35)}>
        <TextFlash text="favorite links" />
      </Sequence>

      {/* 1.2-1.55s: "in one place" */}
      <Sequence from={Math.floor(fps * 1.2)} durationInFrames={Math.floor(fps * 0.35)}>
        <TextFlash text="in one place" dark={false} />
      </Sequence>

      {/* --- STEP 1: PASTE LINKS --- */}

      {/* 1.55-3.5s: Create list + type title */}
      <Sequence from={Math.floor(fps * 1.55)} durationInFrames={Math.floor(fps * 1.95)}>
        <EmptyListUI />
      </Sequence>

      {/* 3.5-5.5s: Paste links + full list */}
      <Sequence from={Math.floor(fps * 3.5)} durationInFrames={Math.floor(fps * 2)}>
        <PasteLinksUI />
      </Sequence>

      {/* --- STEP 2: SHARE --- */}

      {/* 5.5-7.5s: Share URL */}
      <Sequence from={Math.floor(fps * 5.5)} durationInFrames={Math.floor(fps * 2)}>
        <ShareURLUI />
      </Sequence>

      {/* 7.5-10s: Text message with OG preview */}
      <Sequence from={Math.floor(fps * 7.5)} durationInFrames={Math.floor(fps * 2.5)}>
        <TextMessageUI />
      </Sequence>

      {/* --- STEP 3: STATS --- */}

      {/* 10-12.7s: Stats page */}
      <Sequence from={Math.floor(fps * 10)} durationInFrames={Math.floor(fps * 2.7)}>
        <StatsPageUI />
      </Sequence>

      {/* --- OUTRO --- */}

      {/* 12.7-13s: "Curate" */}
      <Sequence from={Math.floor(fps * 12.7)} durationInFrames={Math.floor(fps * 0.3)}>
        <TextFlash text="Curate" dark={false} />
      </Sequence>

      {/* 13-13.3s: "Share" */}
      <Sequence from={Math.floor(fps * 13)} durationInFrames={Math.floor(fps * 0.3)}>
        <TextFlash text="Share" />
      </Sequence>

      {/* 13.3-13.6s: "Grow" */}
      <Sequence from={Math.floor(fps * 13.3)} durationInFrames={Math.floor(fps * 0.3)}>
        <TextFlash text="Grow" dark={false} />
      </Sequence>

      {/* 13.6-16.6s: Final CTA */}
      <Sequence from={Math.floor(fps * 13.6)} durationInFrames={Math.floor(fps * 3)}>
        <FinalCTA />
      </Sequence>

      {/* Fade to black overlay */}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fadeToBlack, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
