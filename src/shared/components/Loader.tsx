export default function Loader({
  size = 48,
  color = 'text-primary',
  fullscreen = false,
}) {
  const containerClass = fullscreen
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/90 backdrop-blur-md"
    : "flex items-center justify-center"

  return (
    <div className={containerClass}>
      <div className="relative">
        {/* Soft depth for fullscreen loader */}
        {fullscreen && (
          <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-md" />
        )}

        <svg
          className={`animate-spin ${color} relative z-10`}
          width={size}
          height={size}
          viewBox="0 0 50 50"
        >
          <circle
            className="opacity-20"
            cx="25"
            cy="25"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <circle
            className="opacity-80"
            cx="25"
            cy="25"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="80 150"
            strokeDashoffset="0"
          />
        </svg>
      </div>

      {fullscreen && (
        <div className="mt-4">
          <span className={`text-xs font-bold uppercase tracking-[0.2em] ${color}`}>
            Loading Arena
          </span>
        </div>
      )}
    </div>
  )
}
