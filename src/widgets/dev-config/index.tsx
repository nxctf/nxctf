import dynamic from 'next/dynamic'

const DevConfigWidget = dynamic(() => import('./DevConfigWidget'), {
  ssr: false
})

export default function DevConfig() {
  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') return null

  return <DevConfigWidget />
}
