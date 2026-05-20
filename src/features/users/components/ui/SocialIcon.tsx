import {
  Link2,
  Camera,
  Globe,
} from 'lucide-react';

function DiscordIcon({
  size = 16,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.078.037c-.21.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.249.077.077 0 0 0-.078-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.045-.32 13.579.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.201 13.201 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.125-.094.25-.192.369-.291a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.062 0a.073.073 0 0 1 .078.01c.12.099.246.197.372.291a.077.077 0 0 1-.006.128 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.106c.36.699.772 1.364 1.225 1.994a.076.076 0 0 0 .084.028 19.876 19.876 0 0 0 5.993-3.03.077.077 0 0 0 .031-.056c.5-5.177-.838-9.673-3.548-13.66a.061.061 0 0 0-.031-.028zM8.02 15.331c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.175 1.094 2.156 2.418 0 1.334-.946 2.419-2.156 2.419zm7.974 0c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.175 1.094 2.156 2.418 0 1.334-.946 2.419-2.156 2.419z" />
    </svg>
  );
}

type SocialIconProps = {
  type: 'linkedin' | 'instagram' | 'web' | 'discord';
  href?: string;
  label?: string;
  className?: string;
  size?: number;
  hideLabelOnMobile?: boolean;
  alwaysShowLabel?: boolean;
};

export default function SocialIcon({
  type,
  href,
  label,
  className = '',
  size = 16,
  hideLabelOnMobile = false,
  alwaysShowLabel = false,
}: SocialIconProps) {
  const icons = {
    linkedin: Link2,
    instagram: Camera,
    web: Globe,
    discord: DiscordIcon,
  };
  const colorClasses: Record<string, string> = {
    linkedin:
        'bg-transparent text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:text-blue-600 dark:hover:text-blue-400',

    instagram:
        'bg-transparent text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:text-pink-500',

    web:
        'bg-transparent text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:text-gray-900 dark:hover:text-white',

    discord:
        'bg-transparent text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:text-indigo-500',
  }
  const Icon = icons[type];
  const baseClass = `
    inline-flex items-center gap-2
    px-2 py-1
    rounded-md
    text-xs font-medium
    border
    transition-colors
    hover:bg-gray-100 dark:hover:bg-gray-700
    ${colorClasses[type]} ${className}
  `;
  const labelClass = alwaysShowLabel
    ? ''
    : hideLabelOnMobile
      ? 'hidden sm:inline'
      : '';

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClass}
        title={label || type.charAt(0).toUpperCase() + type.slice(1)}
      >
        <Icon size={size} />
        {label && <span className={labelClass}>{label}</span>}
      </a>
    );
  }

  return (
    <span className={baseClass} title={label || type.charAt(0).toUpperCase() + type.slice(1)}>
      <Icon size={size} />
      {label && <span className={labelClass}>{label}</span>}
    </span>
  );
}
