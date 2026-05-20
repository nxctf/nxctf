"use client";

import { useEffect, useState } from "react";

type Props = {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
  rounded?: boolean;
  fallbackBg?: string;
};

export default function ImageWithFallback({
  src,
  alt = "",
  size = 36,
  className = "",
  rounded = true,
  fallbackBg = "bg-gray-200 dark:bg-gray-800",
}: Props) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  const showImg = !!src && !error;

  const initials = alt ? alt.trim().charAt(0).toUpperCase() : "";

  return (
    <div style={{ width: size, height: size }} className={className}>
      {showImg ? (
        <img
          src={src as string}
          alt={alt}
          onError={() => setError(true)}
          onLoad={() => setError(false)}
          style={{
            width: size,
            height: size,
            borderRadius: rounded ? "9999px" : undefined,
            objectFit: "cover",
          }}
          // className="shadow"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`flex items-center justify-center overflow-hidden ${fallbackBg} text-gray-700 dark:text-gray-200 shadow`}
          style={{
            width: size,
            height: size,
            borderRadius: rounded ? 9999 : undefined,
          }}
          aria-hidden
        >
          {initials || (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-1/2 h-1/2 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
              <path d="M6 20c0-3.31 2.69-6 6-6s6 2.69 6 6" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}
