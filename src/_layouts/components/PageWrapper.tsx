import React from 'react'
import Navbar from '../Navbar'
import Footer from '../Footer'
import ScrollToggle from './ScrollToggle'

interface PageWrapperProps {
  children: React.ReactNode
  showNavbar?: boolean
  showFooter?: boolean
  className?: string
  withPadding?: boolean
}

const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  showNavbar = true,
  showFooter = true,
  className = '',
  withPadding = true
}) => {
  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 ${className}`}>
      {showNavbar && <Navbar />}

      <main className={`flex-1 ${showNavbar && withPadding ? 'pt-14' : ''}`}>
        {children}
      </main>

      {showFooter && <Footer />}
      <ScrollToggle />
    </div>
  )
}

export default PageWrapper
