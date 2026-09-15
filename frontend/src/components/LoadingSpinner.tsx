'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  className,
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-blue-600', sizeClasses[size])} />
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-300 animate-pulse">{text}</p>
      )}
    </div>
  )
}

// Full page loader
export function FullPageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900 backdrop-blur-sm flex items-center justify-center z-50">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}