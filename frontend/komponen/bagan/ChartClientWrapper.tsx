'use client'

import { memo, useMemo } from 'react'
import { ResponsiveContainer } from 'recharts'

interface ChartClientWrapperProps {
  children: React.ReactNode
  height: number
}

/**
 * Bulletproof wrapper for Recharts components
 * - Forces fixed height to prevent ResizeObserver loops
 * - Adds debounce to ResponsiveContainer
 * - Memoized to prevent unnecessary re-renders
 */
export const ChartClientWrapper = memo(function ChartClientWrapper({ 
  children, 
  height 
}: ChartClientWrapperProps) {
  return (
    <div 
      style={{ 
        width: '100%', 
        height: `${height}px`,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <ResponsiveContainer width="100%" height="100%" debounce={1}>
        {children}
      </ResponsiveContainer>
    </div>
  )
})

export default ChartClientWrapper
