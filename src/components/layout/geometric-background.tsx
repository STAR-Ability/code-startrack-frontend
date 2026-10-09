"use client";

import { usePathname } from "next/navigation";

type BackgroundCategory =
  | "public"
  | "overview"
  | "insight"
  | "training"
  | "collaboration"
  | "account"
  | "auth";

function backgroundCategory(pathname: string): BackgroundCategory {
  if (/^\/(login|register|reset-password)(\/|$)/.test(pathname)) return "auth";
  if (/^\/(teams|coach)(\/|$)/.test(pathname)) return "collaboration";
  if (
    /^\/(profile|analysis|data|learning-profile)(\/|$)/.test(pathname) ||
    /^\/accounts\/(profile|analysis)(\/|$)/.test(pathname)
  )
    return "insight";
  if (
    /^\/(problems|submissions|training|practice|learning-recommendations)(\/|$)/.test(
      pathname,
    )
  )
    return "training";
  if (/^\/(accounts|security|privacy|notifications)(\/|$)/.test(pathname))
    return "account";
  if (pathname === "/" || /^\/(product|about|demo)(\/|$)/.test(pathname))
    return "public";
  return "overview";
}

/** Static viewport artwork: content scrolls independently of this composition. */
export function GeometricBackground() {
  const pathname = usePathname();

  return (
    <div
      className="geometric-background"
      data-category={backgroundCategory(pathname)}
      aria-hidden="true"
    >
      <div className="geometry-glow geometry-glow-primary" />
      <div className="geometry-glow geometry-glow-complement" />
      <svg
        className="geometry-orbits"
        viewBox="0 0 640 640"
        fill="none"
        focusable="false"
      >
        <circle cx="320" cy="320" r="128" className="geometry-orbit-core" />
        <circle cx="320" cy="320" r="176" />
        <circle cx="320" cy="320" r="224" />
        <circle cx="320" cy="320" r="272" />
        <circle cx="320" cy="320" r="316" />
        <path
          d="M96 320a224 224 0 0 1 224-224"
          className="geometry-orbit-emphasis"
        />
        <path
          d="M320 592a272 272 0 0 0 272-272"
          className="geometry-orbit-secondary"
        />
        <circle cx="96" cy="320" r="6" className="geometry-node" />
        <circle cx="592" cy="320" r="4" className="geometry-node-secondary" />
      </svg>
      <svg
        className="geometry-structure"
        viewBox="0 0 480 560"
        fill="none"
        focusable="false"
      >
        <path
          d="M32 48H448M32 112H448M32 176H448M32 240H448M32 304H448M32 368H448M32 432H448M32 496H448M48 32V528M112 32V528M176 32V528M240 32V528M304 32V528M368 32V528M432 32V528"
          className="geometry-grid"
        />
        <rect
          x="48"
          y="48"
          width="320"
          height="384"
          rx="40"
          className="geometry-grid-frame"
        />
        <path
          d="M32 48h32M48 32v32M416 496h32M432 480v32M224 304h32M240 288v32"
          className="geometry-grid-cross"
        />
      </svg>
      <svg
        className="geometry-shape"
        viewBox="0 0 480 480"
        fill="none"
        focusable="false"
      >
        <path
          d="M110 36h180c28 0 45 13 59 36l95 166c12 22 12 43-1 65l-78 134c-12 21-31 31-56 31H126c-27 0-45-11-58-35L9 328c-13-23-12-46 1-69L67 77c10-27 19-41 43-41Z"
          className="geometry-shape-fill"
        />
        <rect
          x="104"
          y="112"
          width="256"
          height="256"
          rx="54"
          className="geometry-shape-inset"
        />
        <path d="M104 242h256M232 112v256" className="geometry-shape-detail" />
      </svg>
      <svg
        className="geometry-accent"
        viewBox="0 0 180 180"
        fill="none"
        focusable="false"
      >
        <circle cx="90" cy="90" r="72" />
        <circle cx="90" cy="90" r="48" />
        <path d="M18 90h144M90 18v144" />
        <circle cx="90" cy="90" r="16" className="geometry-accent-center" />
      </svg>
    </div>
  );
}
