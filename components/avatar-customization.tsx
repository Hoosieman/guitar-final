"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Check, X } from "lucide-react"
import { useGameState, useAvatarModel } from "@/hooks/use-game-state"

interface AvatarCustomizationProps {
  onBack: () => void
}

export default function AvatarCustomization({ onBack }: AvatarCustomizationProps) {
  const { avatarSettings, updateAvatarSettings } = useGameState()
  const [avatarName, setAvatarName] = useState(avatarSettings.avatarName)
  const [isFrameLoaded, setIsFrameLoaded] = useState(false)
  const [iframeKey, setIframeKey] = useState(Date.now())
  const [avatarUrl, setAvatarUrl] = useState(avatarSettings.avatarUrl)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [lastEventData, setLastEventData] = useState<any>(null)
  const [showNameInput, setShowNameInput] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Add these new state variables at the top of the component
  const [isLoading, setIsLoading] = useState(false)
  const { preloadAvatar, isLoading: isAvatarLoading, cachedModel: cachedAvatarModel } = useAvatarModel()

  // Listen for messages from the Ready Player Me iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Log all messages for debugging
      console.log("Received message:", event.data)
      setLastEventData(event.data)

      // Check if the message is a direct URL string (this is how RPM actually sends the URL)
      if (typeof event.data === "string" && event.data.includes(".glb")) {
        const url = event.data
        console.log("GLB URL detected from direct string:", url)

        // Set the avatar URL
        setAvatarUrl(url)

        // Show success message
        setExportSuccess(true)

        // Show name input after successful export
        setShowNameInput(true)

        return
      }

      // Handle avatar selection events
      if (event.data && typeof event.data === "object") {
        // Check for various event types that might contain the avatar URL

        // Check for v1.avatar.exported event
        if (event.data.eventName === "v1.avatar.exported" && event.data.data && event.data.data.url) {
          handleAvatarUrl(event.data.data.url)
          return
        }

        // Check for v1.avatar.loaded event (when selecting an existing avatar)
        if (event.data.eventName === "v1.avatar.loaded" && event.data.data && event.data.data.url) {
          handleAvatarUrl(event.data.data.url)
          return
        }

        // Check for avatar.exported event (older format)
        if (event.data.type === "avatar.exported" && event.data.data && event.data.data.url) {
          handleAvatarUrl(event.data.data.url)
          return
        }

        // Check for avatar.loaded event (older format)
        if (event.data.type === "avatar.loaded" && event.data.data && event.data.data.url) {
          handleAvatarUrl(event.data.data.url)
          return
        }

        // Check for direct url property
        if (event.data.url && typeof event.data.url === "string" && event.data.url.includes(".glb")) {
          handleAvatarUrl(event.data.url)
          return
        }

        // Check for avatarUrl property
        if (event.data.avatarUrl && typeof event.data.avatarUrl === "string" && event.data.avatarUrl.includes(".glb")) {
          handleAvatarUrl(event.data.avatarUrl)
          return
        }
      }
    }

    // Helper function to handle avatar URL updates
    const handleAvatarUrl = (url: string) => {
      console.log("Avatar URL detected:", url)
      setAvatarUrl(url)
      setExportSuccess(true)
      setShowNameInput(true)
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  // Update the saveAvatar function to wait for the avatar to load before returning to home
  const saveAvatar = () => {
    // First update the avatar settings
    updateAvatarSettings({
      avatarUrl,
      avatarName,
    })

    // Show loading state
    setShowNameInput(false)
    setIsLoading(true)

    // Preload the avatar before returning to home
    preloadAvatar(avatarUrl)

    // Check loading status periodically
    const checkLoading = setInterval(() => {
      if (!isAvatarLoading && cachedAvatarModel) {
        clearInterval(checkLoading)
        setIsLoading(false)
        onBack()
      }
    }, 500)

    // Set a timeout to prevent infinite waiting
    setTimeout(() => {
      clearInterval(checkLoading)
      setIsLoading(false)
      onBack()
    }, 10000) // Max 10 seconds wait
  }

  // Check if we have a valid GLB URL
  const hasValidUrl = avatarUrl && avatarUrl.trim() !== "" && avatarUrl.includes(".glb")

  // Function to send a message to the iframe to request the current avatar URL
  const requestAvatarUrl = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      // Try to request the current avatar URL
      iframeRef.current.contentWindow.postMessage({ target: "readyplayerme", type: "get-avatar" }, "*")
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col w-full h-full max-w-md mx-auto">
      {/* Minimal floating back button instead of a full header */}
      <button
        onClick={onBack}
        className="absolute top-3 left-3 z-20 flex items-center justify-center bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70 transition-all"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      {/* Full-screen Ready Player Me iframe */}
      <div className="w-full h-full pt-12">
        {!isFrameLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-5">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-white text-sm">Loading Avatar Creator...</p>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          key={iframeKey}
          className="w-full h-full"
          src="https://demo.readyplayer.me/avatar?frameApi"
          allow="camera *; microphone *"
          onLoad={() => {
            setIsFrameLoaded(true)
            // Add a small delay before requesting the avatar URL to ensure the iframe is fully loaded
            setTimeout(requestAvatarUrl, 1000)
          }}
        ></iframe>
      </div>

      {/* Name input overlay - shown after avatar is created */}
      {showNameInput && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
          <div className="bg-gray-800 rounded-lg p-4 max-w-xs w-full mx-3">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-white">Name Your Avatar</h3>
              <button onClick={() => setShowNameInput(false)} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              value={avatarName}
              onChange={(e) => setAvatarName(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none mb-3 text-sm"
              placeholder="Enter a name for your avatar"
            />

            <button
              onClick={saveAvatar}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center text-sm"
            >
              <Check className="mr-1 h-4 w-4" />
              Save Avatar
            </button>
          </div>
        </div>
      )}

      {/* Save button overlay - shown when avatar URL is received but name input is not showing */}
      {exportSuccess && !showNameInput && (
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={() => setShowNameInput(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-lg transition-transform hover:scale-105 flex items-center text-sm"
          >
            <Check className="mr-1 h-4 w-4" />
            Save Avatar
          </button>
        </div>
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-30">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-lg font-bold">Loading Avatar...</p>
            <p className="text-gray-300 text-sm mt-2">Please wait while we prepare your avatar</p>
          </div>
        </div>
      )}
    </div>
  )
}

