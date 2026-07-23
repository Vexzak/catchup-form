import React, { Suspense, createContext, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import {
  Database,
  LayoutGrid,
  Sun,
  Moon,
  Users,
  MapPin,
  Folder,
  BarChart3,
  GitCompareArrows,
  History,
  FileText,
  TrendingUp,
  SlidersHorizontal,
  ShieldCheck,
  ArrowRight,
  Globe,
  PlayCircle,
  Mail,
  Phone,
} from "lucide-react";

/**
 * South Cotabato CATCH-UP — Convergence Data Bank
 * Landing page recreation, with working light/dark theme toggle
 */

// ---------------------------------------------------------------------------
// THEME
// ---------------------------------------------------------------------------
// Everything that used to be a hardcoded hex constant is now derived from the
// active theme, via `getPalette(dark)`. Components read the palette (and the
// `dark` flag) from ThemeContext instead of importing fixed colors, so the
// whole page can repaint itself when the toggle is pressed.

const GOLD = "#F6C445";

function getPalette(dark) {
  return {
    dark,

    // Core brand blues stay roughly the same in both themes so the identity
    // of the site doesn't change — only the neutrals shift.
    navy: dark ? "#1B2740" : "#14276e",
    blue: "#1E4E8C",
    blueLight: dark ? "#6C9EE8" : "#3E6FB8",
    gold: GOLD,

    // Neutrals / surfaces — softer slate/navy, not near-black
    navyFooter: dark ? "#1A2338" : "#0D1B4C",
    pageBg: dark ? "#1A2338" : "#0D1B4C",
    slate: dark ? "#A9B4C9" : "#5B6472",
    panelBg: dark ? "#212C46" : "#eaf0fb",
    chipBg: dark ? "#2D3A57" : "#E7EEFB",
    border: dark ? "#3A4863" : "#E4E8F0",

    // Surfaces that were plain white in light mode
    surface: dark ? "#232F4B" : "#ffffff",
    surfaceAlt: dark ? "#1D2740" : "#f2f3fa",

    // Text
    textPrimary: dark ? "#EEF1F7" : "#14276e",
    textInverse: "#ffffff",

    // Hero background gradient stops
    heroGradient: dark
      ? "radial-gradient(130% 130% at 82% 18%, #3A4F8F 0%, #2C3D78 35%, "
        + "#243063 65%, #1E2957 100%)"
      : "radial-gradient(130% 130% at 82% 18%, #3E5CFF 0%, #2547E0 35%, #1531AD 65%, #0F2490 100%)",

    // CTA banner
    ctaBg: dark ? "#263764" : "#1E40D9",

    shadow: dark ? "0 1px 2px rgba(0,0,0,0.4)" : "0 1px 2px rgba(0,0,0,0.04)",
    shadowCard: dark
      ? "0 4px 16px rgba(0,0,0,0.45)"
      : "0 4px 16px rgba(15,31,51,0.08)",
  };
}

// Applied to any element whose colors change between themes, so the switch
// animates instead of snapping.
const THEME_TRANSITION =
  "background-color 0.45s ease, background 0.45s ease, color 0.45s ease, border-color 0.45s ease, box-shadow 0.45s ease";

const ThemeContext = createContext({ dark: false, toggleTheme: () => {} });
function useTheme() {
  return useContext(ThemeContext);
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
// Built as a function of the palette so every value can react to theme
// changes. Layout-only properties are unaffected; only colors move.

function getStyles(p) {
  return {
    page: {
      minHeight: "100vh",
      background: p.pageBg,
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: p.textPrimary,
      WebkitFontSmoothing: "antialiased",
      transition: THEME_TRANSITION,
    },
    header: {
      width: "100%",
      background: p.navy,
      position: "sticky",
      top: 0,
      zIndex: 30,
      transition: THEME_TRANSITION,
    },
    headerInner: {
      maxWidth: 1180,
      margin: "0 auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 24px",
    },
    logoRow: { display: "flex", alignItems: "center", gap: 12 },
    logoCircle: {
      width: 44,
      height: 44,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      overflow: "hidden",
    },
    logoImg: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    logoTitle: { fontWeight: 700, fontSize: 15, lineHeight: 1.2, color: "#fff" },
    logoSubtitle: {
      fontSize: 12,
      color: "rgba(255,255,255,0.7)",
      marginTop: -1,
    },
    headerActions: { display: "flex", alignItems: "center", gap: 16 },

    // theme toggle pill
    themeToggle: {
      display: "flex",
      alignItems: "center",
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.15)",
      borderRadius: 999,
      padding: 4,
      gap: 2,
    },
    themeToggleBtn: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      border: "none",
      background: "transparent",
      color: "rgba(255,255,255,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "background 0.3s ease, color 0.3s ease",
    },
    themeToggleBtnActive: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      border: "none",
      background: "rgba(255,255,255,0.18)",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "background 0.3s ease, color 0.3s ease",
    },
    themeToggleDivider: {
      width: 1,
      height: 18,
      background: "rgba(255,255,255,0.2)",
    },

    dashboardBtn: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 18px",
      borderRadius: 8,
      border: "none",
      background: p.surface,
      color: p.textPrimary,
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      boxShadow: p.shadow,
      transition: THEME_TRANSITION,
    },

    heroModelWrap: {
      position: "absolute",
      top: "50%",
      right: "5%",
      width: 620,
      height: 620,
      transform: "translateY(-50%)",
      zIndex: 1,
      pointerEvents: "none",
    },
    heroModelGlow: {
      position: "absolute",
      top: "50%",
      right: "5%",
      width: 620,
      height: 620,
      transform: "translateY(-50%)",
      borderRadius: "50%",
      background:
        "radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.12) 55%, rgba(255,255,255,0) 75%)",
      zIndex: 0,
      pointerEvents: "none",
    },
    heroModelShadow: {
      position: "absolute",
      right: "12%",
      bottom: 40,
      width: 380,
      height: 60,
      background:
        "radial-gradient(ellipse, rgba(5,10,40,0.45) 0%, rgba(5,10,40,0.2) 45%, rgba(5,10,40,0) 75%)",
      borderRadius: "50%",
      zIndex: 1,
      pointerEvents: "none",
    },

    // decorative dot grid on the left
    heroDotGrid: {
      position: "absolute",
      top: 0,
      left: 0,
      width: 460,
      height: "100%",
      backgroundImage:
        "radial-gradient(rgba(255,255,255,0.18) 1.5px, transparent 1.5px)",
      backgroundSize: "24px 24px",
      maskImage:
        "linear-gradient(to right, black 0%, black 55%, transparent 100%)",
      WebkitMaskImage:
        "linear-gradient(to right, black 0%, black 55%, transparent 100%)",
      pointerEvents: "none",
      zIndex: 0,
    },

    // concentric rings behind the 3D model
    heroRings: {
      position: "absolute",
      right: "0%",
      top: "50%",
      transform: "translateY(-50%)",
      width: 680,
      height: 680,
      pointerEvents: "none",
      zIndex: 0,
    },

    heroSparkle: {
      position: "absolute",
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "#fff",
      boxShadow: "0 0 14px 4px rgba(255,255,255,0.55)",
      pointerEvents: "none",
      zIndex: 0,
    },

    heroShadowWrap: {
      position: "relative",
      zIndex: 2,
      background: p.surfaceAlt,
      transition: THEME_TRANSITION,
    },
    hero: {
      background: p.heroGradient,
      position: "relative",
      overflow: "visible",
      paddingBottom: 100,
      transition: THEME_TRANSITION,
      clipPath: `polygon(
      0% 0%,
      100% 0%,
      100% calc(100% - 27.8px),
      96.88% calc(100% - 32.1px),
      93.75% calc(100% - 35.4px),
      90.62% calc(100% - 37.8px),
      87.5% calc(100% - 39.4px),
      84.37% calc(100% - 40.3px),
      81.25% calc(100% - 40.5px),
      78.12% calc(100% - 40.2px),
      75% calc(100% - 39.5px),
      71.88% calc(100% - 38.4px),
      68.75% calc(100% - 37.1px),
      65.63% calc(100% - 35.6px),
      62.5% calc(100% - 34px),
      59.38% calc(100% - 32.5px),
      56.25% calc(100% - 31.1px),
      53.12% calc(100% - 29.9px),
      50% calc(100% - 29px),
      46.88% calc(100% - 28.5px),
      43.75% calc(100% - 28.6px),
      40.62% calc(100% - 29.2px),
      37.5% calc(100% - 30.5px),
      34.38% calc(100% - 32.6px),
      31.25% calc(100% - 35.5px),
      28.12% calc(100% - 39.5px),
      25% calc(100% - 44.4px),
      23.44% calc(100% - 46.9px),
      21.88% calc(100% - 48.8px),
      20.31% calc(100% - 50.2px),
      18.75% calc(100% - 51.2px),
      17.19% calc(100% - 51.8px),
      15.62% calc(100% - 52px),
      14.06% calc(100% - 51.8px),
      12.5% calc(100% - 51.2px),
      10.94% calc(100% - 50.4px),
      9.38% calc(100% - 49.3px),
      7.81% calc(100% - 48px),
      6.25% calc(100% - 46.5px),
      4.69% calc(100% - 44.8px),
      3.12% calc(100% - 42.9px),
      1.56% calc(100% - 40.9px),
      0% calc(100% - 38.9px)
    )`,
    },
    heroWave: {
      position: "absolute",
      left: 0,
      bottom: -89,
      width: "100%",
      height: 90,
      display: "block",
      zIndex: 3,
      pointerEvents: "none",
    },
    heroInner: {
      maxWidth: 1100,
      margin: "0",
      padding: "90px 24px 70px 80px",
      textAlign: "left",
      position: "relative",
      zIndex: 1,
    },
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
      lineHeight: 1.15,
      margin: 0,
    },
    h1Line1: { display: "block", fontSize: 60, color: "#fff" },
    h1Line2: {
      display: "block",
      fontSize: 60,
      marginTop: 6,
      paddingBottom: 8,
      color: "#fff",
    },
    heroP: {
      maxWidth: 420,
      margin: "28px 0 0",
      fontSize: 18,
      color: "rgba(255,255,255,0.85)",
      lineHeight: 1.6,
    },
    heroBtn: {
      marginTop: 28,
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "16px 26px",
      borderRadius: 10,
      border: "none",
      background: p.gold,
      color: "#1A2E6B",
      fontWeight: 700,
      fontSize: 16,
      cursor: "pointer",
      boxShadow: "0 10px 24px rgba(246,196,69,0.35)",
    },
    heroBtnOutline: {
      marginTop: 28,
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "16px 26px",
      borderRadius: 10,
      border: `1.5px solid rgba(255,255,255,0.85)`,
      background: "transparent",
      color: "#fff",
      fontWeight: 700,
      fontSize: 16,
      cursor: "pointer",
    },
    heroBtnRow: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      flexWrap: "wrap",
    },
    heroTextRow: {
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      flexWrap: "wrap",
      rowGap: 32,
    },
    heroTextCol: {
      flex: "0.4 1 420px",
    },
    heroStatCard: {
      background: p.surface,
      borderRadius: 10,
      borderLeft: `3px solid ${p.blue}`,
      boxShadow: p.dark
        ? "0 14px 28px rgba(0,0,0,0.55)"
        : "0 14px 28px rgba(8,16,50,0.3)",
      padding: "14px 18px",
      width: 240,
      flexShrink: 0,
      marginTop: 32,
      position: "relative",
      zIndex: 2,
      transition: THEME_TRANSITION,
    },
    heroStatHeader: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 10,
    },
    heroStatIconWrap: {
      width: 22,
      height: 22,
      borderRadius: 6,
      background: p.chipBg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      transition: THEME_TRANSITION,
    },
    heroStatEyebrow: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.06em",
      color: p.slate,
      transition: THEME_TRANSITION,
    },
    heroStatRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "5px 0",
      borderBottom: `1px solid ${p.border}`,
      transition: THEME_TRANSITION,
    },
    heroStatRowLast: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "5px 0",
    },
    heroStatLabel: {
      fontSize: 12,
      color: p.slate,
      transition: THEME_TRANSITION,
    },
    heroStatValue: {
      fontSize: 14,
      fontWeight: 800,
      color: p.textPrimary,
      transition: THEME_TRANSITION,
    },

    section: { padding: "96px 24px" },
    sectionBlue: {
      padding: "100px 24px 80px",
      background: p.surfaceAlt,
      transition: THEME_TRANSITION,
    },
    sectionPanel: {
      padding: "96px 24px",
      background: p.panelBg,
      transition: THEME_TRANSITION,
    },
    sectionInnerWide: { maxWidth: 1080, margin: "0 auto" },
    sectionInnerNarrow: { maxWidth: 940, margin: "0 auto" },

    sectionHeadWrap: { textAlign: "center", marginBottom: 56 },
    sectionHeadWrapNarrow: {
      textAlign: "center",
      marginBottom: 56,
      maxWidth: 640,
      marginLeft: "auto",
      marginRight: "auto",
    },
    h2: {
      fontSize: 32,
      fontWeight: 800,
      color: p.textPrimary,
      margin: 0,
      transition: THEME_TRANSITION,
    },
    h2Sub: { color: p.slate, marginTop: 12, fontSize: 16, transition: THEME_TRANSITION },

    statGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 24,
      marginBottom: 80,
    },
    statCard: {
      background: p.surface,
      border: `1px solid ${p.border}`,
      borderRadius: 16,
      padding: "32px 24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      boxShadow: p.shadow,
      transition: THEME_TRANSITION,
    },
    statIconWrap: {
      width: 56,
      height: 56,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      background: p.chipBg,
      transition: THEME_TRANSITION,
    },
    statValue: { fontSize: 36, fontWeight: 800, color: p.textPrimary, transition: THEME_TRANSITION },
    statLabel: { color: p.slate, marginTop: 8, fontSize: 15, transition: THEME_TRANSITION },

    proseWrap: { textAlign: "center", maxWidth: 720, margin: "0 auto" },
    h3: { fontSize: 30, fontWeight: 800, color: p.textPrimary, marginBottom: 24, transition: THEME_TRANSITION },
    prose: { color: p.slate, fontSize: 17, lineHeight: 1.7, transition: THEME_TRANSITION },

    featureGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 24,
    },
    featureCard: {
      borderRadius: 16,
      padding: 32,
      background: p.surface,
      border: `1px solid ${p.border}`,
      transition: THEME_TRANSITION,
    },
    featureCardHighlighted: {
      borderRadius: 16,
      padding: 32,
      background: p.surface,
      border: `1.5px solid ${p.blueLight}`,
      boxShadow: p.shadow,
      transition: THEME_TRANSITION,
    },
    featureIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
      background: p.chipBg,
      transition: THEME_TRANSITION,
    },
    featureTitle: {
      fontSize: 18,
      fontWeight: 700,
      color: p.textPrimary,
      marginBottom: 12,
      transition: THEME_TRANSITION,
    },
    featureDesc: { color: p.slate, fontSize: 15, lineHeight: 1.6, transition: THEME_TRANSITION },

    toolGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 24,
    },
    toolCard: {
      background: p.surface,
      border: `1px solid ${p.border}`,
      borderRadius: 16,
      padding: 32,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      boxShadow: p.shadowCard,
      transition: THEME_TRANSITION,
    },
    toolIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 16,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    toolTitle: { fontWeight: 700, fontSize: 17, color: p.textPrimary, marginBottom: 12, transition: THEME_TRANSITION },
    toolDesc: { color: p.slate, fontSize: 15, lineHeight: 1.6, transition: THEME_TRANSITION },
    ctaBanner: {
      background: p.ctaBg,
      padding: "80px 24px 100px",
      position: "relative",
      zIndex: 1,
      transition: THEME_TRANSITION,
    },
    ctaBannerInner: {
      maxWidth: 1080,
      margin: "0 auto",
      textAlign: "center",
    },
    ctaBannerEyebrow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      color: "#FFD84D",
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: "0.12em",
      marginBottom: 20,
    },
    ctaBannerEyebrowLine: {
      width: 32,
      height: 1,
      background: "rgba(255,216,77,0.6)",
    },
    ctaBannerTitle: {
      color: "#fff",
      fontSize: 44,
      fontWeight: 800,
      margin: 0,
      lineHeight: 1.2,
    },
    ctaBannerTitleAccent: {
      display: "block",
      color: "#FFD84D",
      fontStyle: "italic",
    },
    ctaBannerText: {
      color: "rgba(255,255,255,0.85)",
      fontSize: 17,
      marginTop: 20,
      maxWidth: 560,
      marginLeft: "auto",
      marginRight: "auto",
      lineHeight: 1.6,
    },
    ctaBannerBtnRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      marginTop: 36,
      flexWrap: "wrap",
    },
    ctaBannerBtnPrimary: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "14px 28px",
      borderRadius: 999,
      border: "none",
      background: "#fff",
      color: p.ctaBg,
      fontWeight: 700,
      fontSize: 14,
      letterSpacing: "0.03em",
      cursor: "pointer",
      transition: THEME_TRANSITION,
    },
    ctaBannerBtnOutline: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "14px 28px",
      borderRadius: 999,
      border: "1.5px solid rgba(255,255,255,0.6)",
      background: "transparent",
      color: "#fff",
      fontWeight: 700,
      fontSize: 14,
      letterSpacing: "0.03em",
      cursor: "pointer",
    },

    footer: {
      background: p.navyFooter,
      paddingTop: 160,
      paddingBottom: 32,
      marginTop: -70,
      borderTop: "none",
      position: "relative",
      zIndex: 2,
      transition: THEME_TRANSITION,
      clipPath:
        "polygon(0% 18px, 5% 10px, 10% 4px, 15% 0px, 20% 1px, 25% 5px, 30% 12px, 35% 21px, 40% 28px, 45% 33px, 50% 35px, 55% 33px, 60% 28px, 65% 21px, 70% 12px, 75% 5px, 80% 1px, 85% 0px, 90% 4px, 95% 10px, 100% 18px, 100% 100%, 0% 100%)",
    },

    footerInner: {
      maxWidth: 1080,
      margin: "0 auto",
      padding: "0 24px",
      display: "grid",
      gridTemplateColumns: "1.2fr 1fr 1fr",
      gap: 48,
      position: "relative",
      zIndex: 1,
    },
    footerAbout: {
      color: "#fff",
      fontSize: 14,
      lineHeight: 1.6,
      marginTop: 20,
      maxWidth: 320,
    },
    footerHeading: { fontWeight: 700, marginBottom: 16, color: "#fff" },
    footerList: { listStyle: "none", margin: 0, padding: 0 },
    footerListItem: { marginBottom: 12, fontSize: 14 },
    footerLink: { color: "#67E8F9", textDecoration: "none" },
    contactList: {
      listStyle: "none",
      margin: 0,
      padding: 0,
      color: "#fff",
      fontSize: 14,
    },
    contactItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: 8,
      marginBottom: 12,
    },
    socialRow: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      marginTop: 20,
      color: "#fff",
    },
    footerBottom: {
      maxWidth: 1080,
      margin: "48px auto 0",
      padding: "24px 24px 0",
      borderTop: "1px solid rgba(255,255,255,0.3)",
      textAlign: "center",
      fontSize: 14,
      color: "#fff",
    },
  };
}

function Logo({ inverse = false, size = 44 }) {
  const { palette: p } = useTheme();
  const styles = getStyles(p);
  return (
    <div style={styles.logoRow}>
      <div style={{ ...styles.logoCircle, width: size, height: size }}>
        <img src="/logo.png" alt="South Cotabato CATCH-UP logo" style={styles.logoImg} />
      </div>
      <div>
        <div style={{ ...styles.logoTitle, color: inverse ? "#fff" : p.textPrimary }}>
          South Cotabato CATCH-UP
        </div>
        <div style={{ ...styles.logoSubtitle, color: inverse ? "#fff" : p.slate }}>
          Convergence Data Bank
        </div>
      </div>
    </div>
  );
}

function NavBar() {
  const navigate = useNavigate();
  const { palette: p, dark, toggleTheme } = useTheme();
  const styles = getStyles(p);

  return (
    <header style={styles.header}>
      <div style={styles.headerInner}>
        <Logo inverse />
        <div style={styles.headerActions}>
          <div style={styles.themeToggle}>
            <button
              aria-label="Light mode"
              aria-pressed={!dark}
              onClick={() => dark && toggleTheme()}
              style={!dark ? styles.themeToggleBtnActive : styles.themeToggleBtn}
            >
              <Sun size={16} />
            </button>
            <div style={styles.themeToggleDivider} />
            <button
              aria-label="Dark mode"
              aria-pressed={dark}
              onClick={() => !dark && toggleTheme()}
              style={dark ? styles.themeToggleBtnActive : styles.themeToggleBtn}
            >
              <Moon size={16} />
            </button>
          </div>
          <button style={styles.dashboardBtn} onClick={() => navigate("/dashboard")}>
            <LayoutGrid size={16} />
            Dashboard
          </button>
        </div>
      </div>
    </header>
  );
}

function CatchUpModel(props) {
  const { scene } = useGLTF("/catch_up.glb");
  return <primitive object={scene} {...props} />;
}

useGLTF.preload("/catch_up.glb");

function Hero() {
  const navigate = useNavigate();
  const { palette: p } = useTheme();
  const styles = getStyles(p);

  return (
    <div style={styles.heroShadowWrap}>
      <section style={styles.hero}>
        {/* decorative background layers */}
        <div style={styles.heroDotGrid} />
        <svg style={styles.heroRings} viewBox="0 0 700 700" aria-hidden>
          <circle cx="350" cy="350" r="150" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <circle cx="350" cy="350" r="230" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <circle cx="350" cy="350" r="310" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        </svg>
        <div style={{ ...styles.heroSparkle, top: 110, left: "40%" }} />
        <div style={{ ...styles.heroSparkle, top: 250, right: "10%", width: 4, height: 4 }} />
        <div style={{ ...styles.heroSparkle, top: 60, left: "18%", width: 4, height: 4 }} />

        <div style={styles.heroModelGlow} />
        <div style={styles.heroModelShadow} />
        <div style={styles.heroModelWrap}>
          <Canvas camera={{ position: [0, 0, 5], fov: 35 }}>
            <ambientLight intensity={1.4} />
            <hemisphereLight skyColor="#ffffff" groundColor="#3355aa" intensity={1.2} />
            <directionalLight position={[5, 5, 5]} intensity={2} />
            <directionalLight position={[-5, 3, -5]} intensity={0.8} />
            <directionalLight position={[0, -4, 2]} intensity={0.5} />
            <Suspense
              fallback={
                <mesh>
                  <sphereGeometry args={[0.3, 8, 8]} />
                  <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
                </mesh>
              }
            >
              <CatchUpModel scale={0.36} position={[0, 0.1, 0]} />
            </Suspense>
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.5} />
          </Canvas>
        </div>

        <div style={{ ...styles.heroInner, position: "relative", zIndex: 1 }}>
          <h1 style={styles.h1}>
            <span style={styles.h1Line1}>South Cotabato</span>
            <span style={styles.h1Line2}>Convergence Data Bank</span>
          </h1>

          <div style={styles.heroTextRow}>
            <div style={styles.heroTextCol}>
              <p style={styles.heroP}>
                Empowering communities through accessible data. Explore comprehensive profiles of
                vulnerable communities to support data-driven development programs, projects, and
                activities.
              </p>

              <div style={styles.heroBtnRow}>
                <button style={styles.heroBtn} onClick={() => navigate("/dashboard")}>
                  <Database size={18} />
                  Explore Community Data
                  <ArrowRight size={16} />
                </button>
                <button style={styles.heroBtnOutline} onClick={() => navigate("/dashboard")}>
                  <GitCompareArrows size={18} />
                  Compare Sitios
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div style={styles.heroStatCard}>
              <div style={styles.heroStatHeader}>
                <div style={styles.heroStatIconWrap}>
                  <BarChart3 size={13} color={p.blue} />
                </div>
                <span style={styles.heroStatEyebrow}>ON THE PLATFORM</span>
              </div>
              <div style={styles.heroStatRow}>
                <span style={styles.heroStatLabel}>Total Sitios</span>
                <span style={styles.heroStatValue}>2,350</span>
              </div>
              <div style={styles.heroStatRow}>
                <span style={styles.heroStatLabel}>Municipalities</span>
                <span style={styles.heroStatValue}>10</span>
              </div>
              <div style={styles.heroStatRow}>
                <span style={styles.heroStatLabel}>Communities Profiled</span>
                <span style={styles.heroStatValue}>448</span>
              </div>
              <div style={styles.heroStatRowLast}>
                <span style={styles.heroStatLabel}>Projects Implemented</span>
                <span style={styles.heroStatValue}>560</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, iconColor, value, label }) {
  const { palette: p } = useTheme();
  const styles = getStyles(p);
  return (
    <div style={styles.statCard}>
      <div style={styles.statIconWrap}>
        <Icon size={22} color={iconColor} />
      </div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function ByTheNumbers() {
  const { palette: p } = useTheme();
  const styles = getStyles(p);
  return (
    <section style={{ ...styles.sectionPanel, position: "relative", zIndex: 1 }}>
      <div style={styles.sectionInnerWide}>
        <div style={styles.sectionHeadWrap}>
          <h2 style={styles.h2}>By The Numbers</h2>
          <p style={styles.h2Sub}>Real-time data across South Cotabato</p>
        </div>

        <div style={styles.statGrid}>
          <StatCard icon={Users} iconColor={p.blue} value="2,350" label="Total Sitios" />
          <StatCard icon={MapPin} iconColor="#1E9E62" value="10" label="Municipalities" />
          <StatCard icon={Database} iconColor={p.blue} value="448" label="Communities Profiled" />
          <StatCard icon={Folder} iconColor={p.blue} value="560" label="Projects Implemented" />
        </div>

        <div style={styles.proseWrap}>
          <h3 style={styles.h3}>Empowering Communities Through Data</h3>
          <p style={styles.prose}>
            The Convergence Data Bank provides comprehensive, transparent, and accessible
            information about vulnerable communities to guide evidence-based development
            initiatives across South Cotabato. Our system combines detailed community profiling,
            project tracking, and powerful analytics to support data-driven decision-making.
          </p>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  const { palette: p } = useTheme();
  const styles = getStyles(p);
  const [hovered, setHovered] = useState(false);

  const cardStyle = {
    ...styles.featureCard,
    border: `1.5px solid ${hovered ? p.blueLight : p.border}`,
    boxShadow: hovered ? styles.featureCardHighlighted.boxShadow : "none",
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.featureIconWrap}>
        <Icon size={20} color={p.blue} />
      </div>
      <h3 style={styles.featureTitle}>{title}</h3>
      <p style={styles.featureDesc}>{description}</p>
    </div>
  );
}

function FeatureGrid() {
  const { palette: p } = useTheme();
  const styles = getStyles(p);
  const features = [
    {
      icon: Database,
      title: "Comprehensive Sitio Profiles",
      description:
        "Access detailed demographic, infrastructure, and socioeconomic data about vulnerable communities across South Cotabato.",
    },
    {
      icon: BarChart3,
      title: "Interactive Data Visualization",
      description:
        "Explore data through interactive charts, maps, and dashboards with filtering by municipality and barangay.",
    },
    {
      icon: GitCompareArrows,
      title: "Community Comparison",
      description:
        "Compare multiple sitios side-by-side across key indicators to identify patterns and prioritize interventions.",
    },
    {
      icon: Folder,
      title: "Project Tracking",
      description:
        "Monitor development projects and their impact across communities with detailed information and photo documentation.",
    },
    {
      icon: History,
      title: "Historical Trends",
      description:
        "Track changes over time with yearly data snapshots to measure progress and identify emerging needs.",
    },
    {
      icon: FileText,
      title: "Comprehensive Reports",
      description:
        "Generate downloadable PDF reports with aggregated statistics and visualizations for evidence-based planning.",
    },
  ];

  return (
    <section style={styles.sectionBlue}>
      <div style={{ ...styles.sectionInnerWide, ...styles.featureGrid }}>
        {features.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </section>
  );
}

function ToolCard({ icon: Icon, bg, darkBg, iconColor, title, description }) {
  const { palette: p } = useTheme();
  const styles = getStyles(p);
  return (
    <div style={styles.toolCard}>
      <div style={{ ...styles.toolIconWrap, background: p.dark ? darkBg : bg }}>
        <Icon size={22} color={iconColor} />
      </div>
      <h4 style={styles.toolTitle}>{title}</h4>
      <p style={styles.toolDesc}>{description}</p>
    </div>
  );
}

function PowerfulTools() {
  const { palette: p } = useTheme();
  const styles = getStyles(p);
  return (
    <section
      style={{
        ...styles.sectionPanel,
        background: p.surface,
        borderTop: `2px solid ${p.border}`,
      }}
    >
      <div style={styles.sectionInnerWide}>
        <div style={styles.sectionHeadWrapNarrow}>
          <h2 style={styles.h2}>Powerful Tools for Data-Driven Development</h2>
          <p style={styles.h2Sub}>
            Built with transparency and accountability at its core, the system provides
            comprehensive tools for community development planning and monitoring.
          </p>
        </div>

        <div style={styles.toolGrid}>
          <ToolCard
            icon={MapPin}
            bg="#E4EEFC"
            darkBg="#2E3F63"
            iconColor={p.blueLight}
            title="Interactive Maps"
            description="Visualize sitio locations, boundaries, and project sites on interactive maps"
          />
          <ToolCard
            icon={TrendingUp}
            bg="#DEF5E9"
            darkBg="#264A3D"
            iconColor="#5FDBA0"
            title="Progress Tracking"
            description="Monitor changes across multiple years with historical data snapshots"
          />
          <ToolCard
            icon={SlidersHorizontal}
            bg="#EFE6FB"
            darkBg="#3A2F5C"
            iconColor="#BB99F5"
            title="Custom Fields"
            description="Flexible data collection with administrator-defined custom fields"
          />
          <ToolCard
            icon={ShieldCheck}
            bg="#FBEEDC"
            darkBg="#4A3A21"
            iconColor="#F3BE6C"
            title="Audit Trail"
            description="Complete accountability with comprehensive tracking of all system actions"
          />
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  const navigate = useNavigate();
  const { palette: p } = useTheme();
  const styles = getStyles(p);
  return (
    <section style={styles.ctaBanner}>
      <div style={styles.ctaBannerInner}>
        <div style={styles.ctaBannerEyebrow}>
          <span style={styles.ctaBannerEyebrowLine} />
          TWO WAYS TO EXPLORE
          <span style={styles.ctaBannerEyebrowLine} />
        </div>
        <h3 style={styles.ctaBannerTitle}>
          Ready to explore the data?
          <span style={styles.ctaBannerTitleAccent}>Or compare sitios?</span>
        </h3>
        <p style={styles.ctaBannerText}>
          Whether you're researching one community or comparing several, you're in the right
          place. Built for South Cotabato — free and open for everyone.
        </p>
        <div style={styles.ctaBannerBtnRow}>
          <button style={styles.ctaBannerBtnPrimary} onClick={() => navigate("/dashboard")}>
            Explore Community Data
            <ArrowRight size={16} />
          </button>
          <button style={styles.ctaBannerBtnOutline} onClick={() => navigate("/dashboard")}>
            Compare Sitios
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { palette: p } = useTheme();
  const styles = getStyles(p);
  return (
    <footer style={styles.footer}>
      <div style={styles.footerInner}>
        <div>
          <Logo inverse size={120} />
          <p style={styles.footerAbout}>
            Convergence Approach for Transformation and CHange - Unification Program. A government
            transparency portal for tracking development projects in vulnerable communities.
          </p>
        </div>

        <div>
          <h5 style={styles.footerHeading}>Quick Links</h5>
          <ul style={styles.footerList}>
            {["Explore Sitios", "Compare", "Admin Portal", "Province of South Cotabato"].map(
              (link) => (
                <li key={link} style={styles.footerListItem}>
                  <a href="#" style={styles.footerLink}>
                    {link}
                  </a>
                </li>
              )
            )}
          </ul>
        </div>

        <div>
          <h5 style={styles.footerHeading}>Contact</h5>
          <ul style={styles.contactList}>
            <li style={styles.contactItem}>
              <MapPin size={16} style={{ marginTop: 2, flexShrink: 0 }} />
              Capitol Compound, Alunan Avenue, City of Koronadal, 9506
            </li>
            <li style={styles.contactItem}>
              <Phone size={16} style={{ flexShrink: 0 }} />
              09150717076 / 09654666571
            </li>
            <li style={styles.contactItem}>
              <Mail size={16} style={{ flexShrink: 0 }} />
              catchupsouthcotabato@gmail.com
            </li>
          </ul>
          <div style={styles.socialRow}>
            <Globe size={20} />
            <PlayCircle size={20} />
            <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
              <path d="M16.6 5.82c-1.02-.88-1.67-2.11-1.79-3.5h-3.13v13.3c0 1.62-1.32 2.94-2.94 2.94a2.94 2.94 0 01-2.94-2.94 2.94 2.94 0 012.94-2.94c.28 0 .55.04.8.11v-3.18a6.1 6.1 0 00-.8-.05A6.09 6.09 0 002.75 15.6 6.09 6.09 0 008.84 21.7a6.09 6.09 0 006.09-6.09V9.01a8.15 8.15 0 004.68 1.48V7.35c-1.06 0-2.06-.32-2.99-1.53z" />
            </svg>
          </div>
        </div>
      </div>

      <div style={styles.footerBottom}>
        © 2026 Province of South Cotabato CATCH-UP Program. All rights reserved.
      </div>
    </footer>
  );
}

export default function CatchUpLandingPage() {
  const [dark, setDark] = useState(false);
  const palette = useMemo(() => getPalette(dark), [dark]);
  const themeValue = useMemo(
    () => ({ dark, palette, toggleTheme: () => setDark((d) => !d) }),
    [dark, palette]
  );
  const styles = getStyles(palette);

  return (
    <ThemeContext.Provider value={themeValue}>
      <div style={styles.page}>
        <NavBar />
        <Hero />
        <FeatureGrid />
        <PowerfulTools />
        <CtaBanner />
        <Footer />
      </div>
    </ThemeContext.Provider>
  );
}