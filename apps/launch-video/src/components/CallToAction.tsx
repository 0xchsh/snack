import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";

export const CallToAction = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo animation
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // CTA text animation
  const textOpacity = interpolate(frame, [fps * 0.5, fps * 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [fps * 0.5, fps * 1], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Button animation
  const buttonScale = spring({
    frame: frame - fps * 1.2,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  // URL animation
  const urlOpacity = interpolate(frame, [fps * 2, fps * 2.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            backgroundColor: "#0a0a0a",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Snack logo */}
          <svg
            width="66"
            height="66"
            viewBox="0 0 96 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M58.5064 70.6484C52.1697 70.6484 37.5611 70.6961 37.5611 70.6961C37.5611 70.6961 36.7845 71.9912 36.1615 73.0367C34.7565 75.3918 33.3576 76.8799 30.414 75.423C27.7802 74.1216 26.7838 72.3093 28.2968 69.6402C29.5594 67.4081 28.9232 66.0446 27.0964 64.3014C18.7448 56.3308 15.4403 46.2395 17.7636 35.1552C20.3864 22.6424 32.1372 16.0472 44.7828 22.8678C46.6249 23.8621 48.0147 24.8897 50.3871 23.4099C56.9948 19.2902 64.0464 18.5019 70.6354 23.2841C77.7742 28.466 79.6723 36.1917 78.7436 44.4562C77.8516 52.3998 74.4399 59.3373 68.393 64.8691C67.5632 65.6276 66.999 67.5105 67.3309 68.5477C68.2775 71.5189 69.0637 74.0711 65.2482 75.5668C61.1775 77.1641 60.4176 73.9854 59.1266 71.5002C58.9952 71.2492 58.7892 71.0342 58.5064 70.6484ZM32.9566 57.3452C33.2256 57.2885 39.5891 42.285 42.5217 34.9609C42.8633 34.107 42.5217 32.5532 41.9076 31.8168C38.5921 27.8457 31.629 28.3664 28.6957 32.6673C23.751 39.916 25.7224 50.3406 32.9566 57.3452ZM62.8149 57.6639C69.0319 51.1137 71.3186 44.2156 69.1668 36.1475C67.2659 29.0157 59.4053 26.7774 53.9842 31.7753C53.3909 32.3223 52.8792 33.6651 53.1385 34.3137C56.1782 41.9026 59.3728 49.4285 62.8149 57.6639ZM40.7723 61.8017H55.188C52.7015 55.7818 50.5151 50.4851 47.9393 44.2501C45.3325 50.6338 43.2125 55.8295 40.7723 61.8017Z"
              fill="#fafafa"
            />
          </svg>
        </div>
      </div>

      {/* CTA Text */}
      <div
        style={{
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        <h2
          style={{
            fontSize: 72,
            fontWeight: 600,
            color: "#0a0a0a",
            margin: 0,
            letterSpacing: "-0.04em",
          }}
        >
          Start curating
        </h2>
        <p
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: "#71717a",
            marginTop: 16,
          }}
        >
          Your links deserve a better home
        </p>
      </div>

      {/* CTA Button - matches Snack's primary button style */}
      <div
        style={{
          transform: `scale(${Math.max(0, buttonScale)})`,
        }}
      >
        <div
          style={{
            backgroundColor: "#0a0a0a",
            color: "#fafafa",
            padding: "16px 40px",
            borderRadius: 8,
            fontSize: 20,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          Get started free
          <span style={{ fontSize: 18 }}>→</span>
        </div>
      </div>

      {/* URL */}
      <div
        style={{
          opacity: urlOpacity,
          marginTop: 28,
        }}
      >
        <p
          style={{
            fontSize: 20,
            color: "#71717a",
            margin: 0,
            fontWeight: 500,
          }}
        >
          snack.xyz
        </p>
      </div>
    </div>
  );
};
