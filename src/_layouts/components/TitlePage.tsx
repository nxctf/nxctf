"use client"

import React from "react"
import { motion } from "framer-motion"

type TitlePageProps = {
  children?: React.ReactNode
  icon?: React.ReactNode
  size?: string
  duration?: number
  className?: string
}

export default function TitlePage({
  children = "Title",
  icon,
  size = "text-3xl",
  duration = 0.4,
  className = "",
}: TitlePageProps) {
  return (
    <motion.h1
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration }}
      className={`${size} font-bold text-center text-gray-900 dark:text-white drop-shadow flex items-center justify-center gap-2 ${className}`}
    >
      {icon && (
        <span className="inline-flex items-center" style={{ fontSize: '1.5em', lineHeight: 1 }}>
          {icon}
        </span>
      )}
      {children}
    </motion.h1>
  )
}
