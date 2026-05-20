"use client";

import { useEffect, useRef, useState } from "react";

type ToolbarPosition = "left" | "right";

export default function FloatingToolbar({
  children,
  position = "right",
}: {
  children?: React.ReactNode;
  position?: ToolbarPosition;
}) {
  // Accept children from parent (layout) so layout can decide what to render
  // based on config. FloatingToolbar only handles positioning and visibility.
  const [isVisible, setIsVisible] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMouseMove = () => {
      if (!isVisible) setIsVisible(true);

      // Clear previous timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      // Hide setelah inactivity
      if (!isHovering) {
        hideTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
        }, 2500);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [isHovering, isVisible]);

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handle = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    setPrefersReducedMotion(mq.matches);
    if (mq.addEventListener) mq.addEventListener("change", handle);
    else mq.addListener(handle);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handle);
      else mq.removeListener(handle);
    };
  }, []);

  const handleToolbarMouseEnter = () => {
    setIsHovering(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  const handleToolbarMouseLeave = () => {
    setIsHovering(false);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 2500);
  };

  return (
    <div
      id="floating-toolbar"
      onMouseEnter={handleToolbarMouseEnter}
      onMouseLeave={handleToolbarMouseLeave}
      className={`fixed ${position === "left" ? "left-4 bottom-4 sm:left-6 sm:bottom-6" : "right-4 bottom-20 sm:right-6 sm:bottom-24"} z-10 flex flex-col items-end gap-3 transform ${
        prefersReducedMotion
          ? "transition-opacity duration-150"
          : "transition-all duration-400 ease-out"
      } ${
        isVisible
          ? "opacity-100 translate-x-0 translate-y-0 scale-100 blur-0"
          : `opacity-0 ${position === "left" ? "-translate-x-6" : "translate-x-6"} translate-y-4 scale-95 blur-sm pointer-events-none`
      }`}
    >
      {children}
    </div>
  );
}
