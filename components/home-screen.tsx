"use client"

import React from "react"
import { useState, useEffect, Suspense, useCallback, useMemo } from "react"
import Store from "@/components/store"
import Collection from "@/components/collection"
import Playlist from "@/components/playlist"
import Studio from "@/components/studio"
import { useGameState } from "@/hooks/use-game-state"
import { Sparkles, ShoppingBag, Album, Music, UserIcon as User3D, User } from "lucide-react"
import AvatarCustomization from "@/components/avatar-customization"
import { useAvatarModel } from "@/hooks/use-game-state"
import { Canvas } from "@react-three/fiber"
import { Environment, OrbitControls, PerspectiveCamera, useProgress } from "@react-three/drei"
import HomeBackground from "@/components/home-background"
import { items } from "@/data/items"
import Image from "next/image"
import { motion } from "framer-motion"
import PurchaseEmeralds from "@/components/purchase-emeralds"

// Import and use the mobile hook
import { useMobile } from "@/hooks/use-mobile"

// Loading component to show loading progress
function LoadingScreen() {
  const { progress } = useProgress()
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-blue-100 to-white z-50">
      <div className="text-center">
        <div className="w-80 h-80 mb-4 mx-auto rounded-full overflow-hidden border-4 border-blue-200">
          <video src="/loading-animation.MP4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
        </div>
        <div className="w-80 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="mt-2 text-gray-600">Loading... {Math.round(progress)}%</p>
      </div>
    </div>
  )
}

export default function HomeScreen() {
  const [currentScreen, setCurrentScreen] = useState<"home" | "play" | "store" | "collection" | "studio" | "profile">(
    "home",
  )
  const { emeralds } = useGameState()
  const { preloadAvatar } = useAvatarModel()
  const { avatarSettings } = useGameState()
  const isMobile = useMobile()
  const [isLoading, setIsLoading] = useState(true)
  const [backgroundLoaded, setBackgroundLoaded] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  // Memoize the selected guitar to prevent unnecessary re-renders
  const selectedGuitar = useMemo(() => items.find((item) => item.type === "guitar"), [])

  // Preload avatar and animations only once when the avatar URL changes
  useEffect(() => {
    let isMounted = true

    if (avatarSettings.avatarUrl) {
      preloadAvatar(avatarSettings.avatarUrl)

      // Preload animations asynchronously
      const preloadAnimations = async () => {
        try {
          const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js")
          if (!isMounted) return

          const loader = new GLTFLoader()

          // Preload the idle animation
          loader.load(
            "/animations/standing-idle.glb",
            () => {
              if (isMounted) {
                console.log("Idle animation preloaded successfully")
              }
            },
            undefined,
            (error) => {
              if (isMounted) {
                console.error("Error preloading idle animation:", error)
              }
            },
          )
        } catch (error) {
          if (isMounted) {
            console.error("Error importing GLTFLoader:", error)
          }
        }
      }

      preloadAnimations()
    }

    return () => {
      isMounted = false
    }
  }, [avatarSettings.avatarUrl, preloadAvatar])

  // Set a timer to ensure loading screen shows for at least 1.5 seconds
  // and wait for background to be loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      if (backgroundLoaded) {
        setIsLoading(false)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [backgroundLoaded])

  // Handle when background is loaded
  const handleBackgroundLoaded = useCallback(() => {
    setBackgroundLoaded(true)
  }, [])

  // Handle back button - memoized to prevent recreation on each render
  const handleBack = useCallback(() => {
    setCurrentScreen("home")
  }, [])

  // Handle profile button click
  const handleProfileClick = useCallback(() => {
    console.log("Profile button clicked")
    setCurrentScreen("profile")
  }, [])

  // Handle emerald count click
  const handleEmeraldClick = useCallback(() => {
    setShowPurchaseModal(true)
  }, [])

  // Memoize menu buttons to prevent unnecessary re-renders
  const MenuButtons = useMemo(
    () => (
      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3 pointer-events-auto">
        <MenuButton
          label="Play"
          description="Choose a song to play"
          onClick={() => setCurrentScreen("play")}
          gradient="from-cyan-600 to-blue-900"
          icon={<Music className="h-5 w-5" />}
        />
        <MenuButton
          label="Store"
          description="Buy card packs for new gear and songs"
          onClick={() => setCurrentScreen("store")}
          gradient="from-blue-800 to-cyan-500"
          icon={<ShoppingBag className="h-5 w-5" />}
        />
        <MenuButton
          label="Collection"
          description="View your awesome gear and songs"
          onClick={() => setCurrentScreen("collection")}
          gradient="from-cyan-500 to-blue-800"
          icon={<Album className="h-5 w-5" />}
        />
        <MenuButton
          label="Studio"
          description="Display your gear and customize your look"
          onClick={() => setCurrentScreen("studio")}
          gradient="from-blue-900 to-cyan-600"
          icon={<User3D className="h-5 w-5" />}
        />
      </div>
    ),
    [],
  )

  // Memoize the header to prevent unnecessary re-renders
  const Header = useMemo(
    () => (
      <div className="w-full pointer-events-auto relative pt-0 pb-4">
        {/* Centered logo at the top */}
        <div className="flex justify-center w-full relative">
          <div className="w-full max-w-[240px] relative">
            <div className="w-full overflow-hidden" style={{ height: "160px", position: "relative" }}>
              <Image
                src="/home-screen-header-unscreen.png"
                alt="Amped Up Logo"
                width={400}
                height={160}
                priority
                className="w-full h-auto object-cover object-top"
                style={{ maxWidth: "100%" }}
              />
            </div>

            {/* Emerald count positioned below the logo in a pill container */}
            <div className="flex justify-center w-full">
              <motion.div
                className="absolute -bottom-11 inline-flex items-center px-14 py-2 z-10 bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full shadow-lg cursor-pointer"
                initial={{ boxShadow: "0 0 0 rgba(56, 189, 248, 0)" }}
                animate={{
                  boxShadow: [
                    "0 0 5px rgba(56, 189, 248, 0.5)",
                    "0 0 15px rgba(56, 189, 248, 0.8)",
                    "0 0 5px rgba(56, 189, 248, 0.5)",
                  ],
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
                onClick={handleEmeraldClick}
              >
                <motion.div
                  animate={{
                    rotate: [-1, 1, -1],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                >
                  <Sparkles className="mr-2 h-5 w-5 text-white" />
                </motion.div>
                <motion.span
                  className="text-2xl font-bold text-white"
                  animate={{
                    textShadow: [
                      "0 0 0px rgba(255,255,255,0)",
                      "0 0 8px rgba(255,255,255,0.8)",
                      "0 0 0px rgba(255,255,255,0)",
                    ],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                >
                  {emeralds}
                </motion.span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    ),
    [emeralds, handleEmeraldClick],
  )

  // Render the current screen - memoized based on currentScreen
  const renderScreen = useCallback(() => {
    switch (currentScreen) {
      case "play":
        return <Playlist onBack={handleBack} />
      case "store":
        return <Store onBack={handleBack} />
      case "collection":
        return <Collection onBack={handleBack} />
      case "studio":
        return <Studio onBack={handleBack} />
      case "profile":
        return <AvatarCustomization onBack={handleBack} />
      default:
        return (
          <>
            {/* Header */}
            {Header}
            {/* Menu options - positioned at the bottom */}
            {MenuButtons}
          </>
        )
    }
  }, [currentScreen, handleBack, Header, MenuButtons])

  // Always render the 3D canvas but only show it when not loading
  const BackgroundCanvas = useMemo(
    () => (
      <div
        className="fixed inset-0 z-0 max-w-md mx-auto"
        style={{
          touchAction: "none",
          visibility: currentScreen === "home" && !isLoading ? "visible" : "hidden",
          opacity: currentScreen === "home" && !isLoading ? 1 : 0,
          transition: "opacity 0.5s ease-in-out",
        }}
      >
        <Canvas shadows style={{ pointerEvents: "auto" }}>
          {/* Set the background color directly on the Canvas */}
          <color attach="background" args={["#f0f4f8"]} />
          {/* Adjusted camera position to look down more at the avatar */}
          <PerspectiveCamera makeDefault position={[0, 0.5, 5]} fov={45} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2}
            minDistance={3}
            maxDistance={10}
            makeDefault
          />
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
          {/* Change the environment preset to a lighter one */}
          <Environment preset="park" />

          <Suspense fallback={null}>
            <HomeBackground
              avatarUrl={avatarSettings.avatarUrl}
              selectedGuitar={selectedGuitar}
              isMobile={isMobile}
              onLoaded={handleBackgroundLoaded}
            />
          </Suspense>
        </Canvas>
      </div>
    ),
    [currentScreen, avatarSettings.avatarUrl, selectedGuitar, isMobile, isLoading, handleBackgroundLoaded],
  )

  return (
    <div className="w-full max-w-md mx-auto h-full relative">
      {/* Always render the background canvas to preload it */}
      {BackgroundCanvas}

      {/* Show loading screen while loading */}
      {isLoading && <LoadingScreen />}

      {/* Profile button - positioned relative to the container */}
      {currentScreen === "home" && !isLoading && (
        <div className="absolute top-4 left-4 z-50 pointer-events-auto">
          <button
            onClick={handleProfileClick}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-lg"
          >
            <User className="h-6 w-6 text-white" />
          </button>
        </div>
      )}

      <div className="relative z-10 pt-0 px-4 h-full min-h-screen pointer-events-none">
        <div className="pointer-events-auto">{!isLoading && renderScreen()}</div>
      </div>
      {/* Purchase Emeralds Modal */}
      {showPurchaseModal && <PurchaseEmeralds onClose={() => setShowPurchaseModal(false)} />}
    </div>
  )
}

// Menu button component
interface MenuButtonProps {
  label: string
  description: string
  onClick: () => void
  gradient: string
  icon?: React.ReactNode
}

// Memoize the MenuButton component to prevent unnecessary re-renders
const MenuButton = React.memo(function MenuButton({ label, description, onClick, gradient, icon }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center rounded-2xl bg-gradient-to-r ${gradient} p-3 text-left text-white shadow-lg transition-transform hover:scale-105 active:scale-95`}
    >
      <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-white bg-opacity-20">
        {icon || <Sparkles className="h-5 w-5" />}
      </div>
      <div>
        <h3 className="text-lg font-bold">{label}</h3>
        <p className="text-xs text-white text-opacity-80">{description}</p>
      </div>
    </button>
  )
})
