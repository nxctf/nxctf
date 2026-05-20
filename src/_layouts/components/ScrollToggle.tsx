"use client";

import { useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/shared/ui";

export default function ScrollToggle() {
  const [atBottom, setAtBottom] = useState(false);
  const pathname = usePathname();

  useLayoutEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const viewportHeight = window.innerHeight;
      const documentHeight = document.body.offsetHeight;
      const isAtTop = scrollY < 20;
      const isAtBottom = viewportHeight + scrollY >= documentHeight - 20;
      setAtBottom(isAtTop ? false : isAtBottom);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleScrollToggle = () => {
    if (atBottom) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

  if (pathname === "/" || pathname === "/info" || pathname === "/rules") return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleScrollToggle}
      aria-label={atBottom ? "Scroll to top" : "Scroll to bottom"}
      className="group fixed right-6 bottom-6 z-10 rounded-full bg-card text-card-foreground shadow-lg transition-all duration-200 hover:scale-105"
    >
      <span className="flex items-center justify-center">
        {atBottom ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:-translate-y-1">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-y-1">
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
      </span>
    </Button>
  );
}
