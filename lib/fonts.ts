import localFont from "next/font/local";

/**
 * Brand typeface used by both Arabic and English public pages.
 * The family includes Arabic and Latin glyphs, so one consistent type system
 * can be used across locales.
 */
export const pingARLT = localFont({
  src: [
    {
      path: "../app/fonts/PingARLT-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../app/fonts/PingARLT-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../app/fonts/PingARLT-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../app/fonts/PingARLT-Heavy.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../app/fonts/PingARLT-Black.otf",
      weight: "900",
      style: "normal",
    },
  ],
  display: "swap",
  fallback: ["Arial", "sans-serif"],
  variable: "--font-ping-ar-lt",
});
