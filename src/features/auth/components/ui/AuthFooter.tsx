import Link from 'next/link'
interface AuthFooterProps {
  text: string
  href: string
  linkText: string
}

export function AuthFooter({ text, href, linkText }: AuthFooterProps) {
  return (
    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
      {text}{' '}
      <Link
        href={href}
        className={`font-semibold transition-colors hover:text-blue-500 dark:hover:text-blue-300 ${'text-primary'}`}
      >
        {linkText}
      </Link>
    </p>
  )
}
