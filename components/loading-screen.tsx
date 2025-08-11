"use client"

import { useState, useEffect } from "react"

interface CustomLoadingScreenProps {
  message?: string
  onLoadComplete?: () => void
  timeout?: number
  showProgress?: boolean
  className?: string
}

export default function CustomLoadingScreen({
  message = "Loading...",
  onLoadComplete,
  timeout = 3000,
  showProgress = true,
  className = "",
}: CustomLoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  // Simulate loading progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + 1
        if (newProgress >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsLoaded(true)
            // Add a delay equal to the fade-out duration before calling onLoadComplete
            setTimeout(() => {
              if (onLoadComplete) onLoadComplete()
            }, 500) // This should match the duration-500 in the className
            return 100
          }, 500) // Small delay after reaching 100%
          return 100
        }
        return newProgress
      })
    }, timeout / 100)

    return () => clearInterval(interval)
  }, [timeout, onLoadComplete])

  return (
    <div
      className={`fixed inset-0 bg-white flex flex-col items-center justify-center z-50 transition-opacity duration-500 ease-in-out ${isLoaded ? "opacity-0" : "opacity-100"} ${className}`}
    >
      <div className="w-full max-w-xs sm:max-w-sm flex flex-col items-center px-4">
        {/* Video container with fixed aspect ratio - smaller on mobile */}
        <div className="w-3/4 sm:w-4/5 relative mb-6 sm:mb-8" style={{ aspectRatio: "1/1" }}>
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-contain">
            <source src="/loading-animation.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Loading text - darker for white background */}
        <h2 className="text-xl font-medium text-gray-800 mb-4">{message}</h2>

        {/* Progress bar */}
        {showProgress && (
          <>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Progress percentage - darker for white background */}
            <p className="mt-2 text-sm text-gray-600">{progress}%</p>
          </>
        )}
      </div>
    </div>
  )
}

