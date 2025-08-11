"use client"

import { useState, useRef, useEffect } from "react"
import { useGameState, STORE_ITEMS, type Item } from "@/hooks/use-game-state"
import { ArrowLeft, Sparkles, Guitar, Shirt, Speaker, Layers, Music } from "lucide-react"
import PackCarousel from "@/components/pack-carousel"
import Collection from "@/components/collection"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Center } from "@react-three/drei"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { useLoader } from "@react-three/fiber"
import { useFrame } from "@react-three/fiber"

// Card pack prices
const PACK_PRICES = {
  basic: 50,
  premium: 100,
  ultimate: 200,
}

// Function to get the icon for the item type
const getTypeIcon = (type: string) => {
  switch (type) {
    case "guitar":
      return <Guitar className="h-4 w-4 text-white" />
    case "clothing":
      return <Shirt className="h-4 w-4 text-white" />
    case "amp":
      return <Speaker className="h-4 w-4 text-white" />
    case "fretboard":
      return <Layers className="h-4 w-4 text-white" />
    case "song":
      return <Music className="h-4 w-4 text-white" />
    default:
      return <Music className="h-4 w-4 text-white" />
  }
}

export default function Store({ onBack }: { onBack: () => void }) {
  const { emeralds, spendEmeralds, addItems } = useGameState()
  const [openingPack, setOpeningPack] = useState(false)
  const [packItems, setPackItems] = useState<Item[]>([])
  const [packType, setPackType] = useState<"basic" | "premium" | "ultimate" | null>(null)
  const [showCarousel, setShowCarousel] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showCollection, setShowCollection] = useState(false)
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  // Add a new state to track the selected pack
  const [selectedPackType, setSelectedPackType] = useState<"basic" | "premium" | "ultimate" | null>(null)
  const [basicPackSelected, setBasicPackSelected] = useState(false)
  const [premiumPackSelected, setPremiumPackSelected] = useState(false)
  const [ultimatePackSelected, setUltimatePackSelected] = useState(false)
  const cardContainerRef = useRef(null)

  // Start the pack selection process
  const startPackSelection = (type: "basic" | "premium" | "ultimate") => {
    const price = PACK_PRICES[type]

    if (spendEmeralds(price)) {
      setPackType(type)
      setShowCarousel(true)
    } else {
      alert("Not enough emeralds!")
    }
  }

  // Complete the pack selection and open it
  const completePackSelection = () => {
    if (!packType) return

    setShowCarousel(false)
    setOpeningPack(true)
    setCurrentCardIndex(0)

    // Generate random items based on pack type
    const items = generatePackItems(packType)
    setPackItems(items)

    // Add items to collection
    addItems(items)
  }

  // Cancel pack selection and refund emeralds
  const cancelPackSelection = () => {
    if (packType) {
      // Refund the emeralds
      const price = PACK_PRICES[packType]
      spendEmeralds(-price) // Negative spending = adding
    }

    setShowCarousel(false)
    setPackType(null)
  }

  // Generate random items for a pack
  const generatePackItems = (type: "basic" | "premium" | "ultimate"): Item[] => {
    const items: Item[] = []
    const rarityChances = getRarityChances(type)

    // Generate 5 items
    for (let i = 0; i < 5; i++) {
      // Determine rarity
      const rarity = determineRarity(rarityChances)

      // Filter items by rarity
      const possibleItems = STORE_ITEMS.filter((item) => item.rarity === rarity)

      // Select random item
      const randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)]

      // Add to pack with a unique ID to avoid duplicates
      items.push({
        ...randomItem,
        id: `${randomItem.id}-${Date.now()}-${i}`,
      })
    }

    return items
  }

  // Get rarity chances based on pack type
  const getRarityChances = (type: "basic" | "premium" | "ultimate") => {
    switch (type) {
      case "basic":
        return { common: 70, rare: 25, epic: 4, legendary: 1 }
      case "premium":
        return { common: 40, rare: 40, epic: 15, legendary: 5 }
      case "ultimate":
        return { common: 20, rare: 40, epic: 30, legendary: 10 }
    }
  }

  // Determine rarity based on chances
  const determineRarity = (chances: { common: number; rare: number; epic: number; legendary: number }) => {
    const roll = Math.random() * 100

    if (roll < chances.legendary) return "legendary"
    if (roll < chances.legendary + chances.epic) return "epic"
    if (roll < chances.legendary + chances.epic + chances.rare) return "rare"
    return "common"
  }

  // Close pack opening and return to store
  const closePack = () => {
    setOpeningPack(false)
    setPackItems([])
    setPackType(null)
    setCurrentCardIndex(0)
  }

  // Handle card click to advance to next card
  const handleCardClick = () => {
    if (isAnimating) return

    // If we're on the last card, go to collection
    if (currentCardIndex === packItems.length - 1) {
      setShowCollection(true)
      return
    }

    // Otherwise, advance to the next card with animation
    setIsAnimating(true)
    setSlideDirection("left")

    // Apply slide left animation to current card
    if (cardContainerRef.current) {
      cardContainerRef.current.classList.add("animate-slide-left")

      setTimeout(() => {
        setCurrentCardIndex((prev) => prev + 1)
        setSlideDirection(null)

        // Reset animation classes
        if (cardContainerRef.current) {
          cardContainerRef.current.classList.remove("animate-slide-left")
        }

        setIsAnimating(false)
      }, 300) // Match this with the animation duration in CSS
    }
  }

  // Get background color based on rarity
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "from-gray-600 to-gray-800"
      case "rare":
        return "from-blue-600 to-blue-800"
      case "epic":
        return "from-purple-600 to-purple-800"
      case "legendary":
        return "from-yellow-500 to-yellow-700"
      default:
        return "from-gray-600 to-gray-800"
    }
  }

  // Get border color based on rarity
  const getRarityBorderColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "border-gray-400"
      case "rare":
        return "border-blue-400"
      case "epic":
        return "border-purple-400"
      case "legendary":
        return "border-yellow-400"
      default:
        return "border-gray-400"
    }
  }

  // Get text color based on rarity
  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "text-gray-200"
      case "rare":
        return "text-blue-200"
      case "epic":
        return "text-purple-200"
      case "legendary":
        return "text-yellow-200"
      default:
        return "text-gray-200"
    }
  }

  // Get glow color based on rarity
  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "0 0 15px rgba(255, 255, 255, 0.5)"
      case "rare":
        return "0 0 20px rgba(59, 130, 246, 0.7)"
      case "epic":
        return "0 0 25px rgba(168, 85, 247, 0.7)"
      case "legendary":
        return "0 0 30px rgba(234, 179, 8, 0.8)"
      default:
        return "none"
    }
  }

  // Handle back from collection
  const handleBackFromCollection = () => {
    setShowCollection(false)
    closePack()
  }

  // If showing collection, render the collection component
  if (showCollection) {
    return <Collection onBack={handleBackFromCollection} />
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center text-white">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Home
        </button>
        <div className="flex items-center rounded-full bg-emerald-900 bg-opacity-30 px-4 py-2">
          <Sparkles className="mr-2 h-5 w-5 text-emerald-400" />
          <span className="text-lg font-bold text-emerald-400">{emeralds} Emeralds</span>
        </div>
      </div>

      {/* 3D Pack Carousel */}
      {showCarousel && packType && (
        <PackCarousel packType={packType} onSelect={completePackSelection} onCancel={cancelPackSelection} />
      )}

      {/* Store content */}
      {openingPack ? (
        <div className="flex flex-col items-center">
          <h2 className="mb-6 text-3xl font-bold text-white">
            {packType === "basic" ? "Basic" : packType === "premium" ? "Premium" : "Ultimate"} Pack
          </h2>

          {/* 3D Card Stack */}
          <div className="relative h-[450px] w-[320px] mb-8">
            {packItems.map((item, index) => {
              // Only render current card and a few cards behind it for performance
              if (index < currentCardIndex || index > currentCardIndex + 3) return null

              // Calculate z-index and position for stack effect
              const isCurrentCard = index === currentCardIndex
              const zIndex = packItems.length - index
              const offset = isCurrentCard ? 0 : (index - currentCardIndex) * 4

              // Only apply animation to the current card that's sliding out
              let animationClass = ""
              if (isCurrentCard && slideDirection === "left") {
                animationClass = "animate-slide-left"
              }

              return (
                <div
                  key={item.id}
                  ref={isCurrentCard ? cardContainerRef : undefined}
                  className={`absolute inset-0 ${animationClass}`}
                  style={{
                    zIndex,
                    transform: `translateX(${offset}px) translateY(${offset}px)`,
                  }}
                  onClick={isCurrentCard ? handleCardClick : undefined}
                >
                  <div className="relative h-full w-full" style={{ aspectRatio: "1500/2100" }}>
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
              )
            })}

            {/* Card count indicator */}
            <div className="absolute bottom-4 right-4 rounded-full bg-black bg-opacity-70 px-3 py-1 text-sm text-white">
              {currentCardIndex + 1} / {packItems.length}
            </div>
          </div>

          {/* Navigation controls */}
          <div className="flex gap-4">
            {currentCardIndex < packItems.length - 1 ? (
              <button
                onClick={() => {
                  if (isAnimating) return
                  setIsAnimating(true)
                  setSlideDirection("left")
                  setTimeout(() => {
                    setCurrentCardIndex((prev) => prev + 1)
                    setSlideDirection(null)
                    setIsAnimating(false)
                  }, 300) // Match this with the animation duration
                }}
                className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-8 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105"
              >
                Next Card
              </button>
            ) : (
              <button
                onClick={() => setShowCollection(true)}
                className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-8 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105"
              >
                Collection
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <h2 className="mb-6 text-3xl font-bold text-white">Card Packs</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic Pack */}
            <div className="flex flex-col items-center">
              <div className="relative h-[280px] w-full mb-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Store3DPack
                    packType="basic"
                    onClick={() => {
                      setSelectedPackType(selectedPackType === "basic" ? null : "basic")
                      setBasicPackSelected(!basicPackSelected)
                      setPremiumPackSelected(false)
                      setUltimatePackSelected(false)
                    }}
                    disabled={emeralds < PACK_PRICES.basic}
                    isSelected={basicPackSelected}
                    legendaryChance="1%"
                    price={PACK_PRICES.basic}
                    onBuy={() => startPackSelection("basic")}
                    canBuy={emeralds >= PACK_PRICES.basic}
                  />
                </div>
              </div>
            </div>

            {/* Premium Pack */}
            <div className="flex flex-col items-center">
              <div className="relative h-[280px] w-full mb-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Store3DPack
                    packType="premium"
                    onClick={() => {
                      setSelectedPackType(selectedPackType === "premium" ? null : "premium")
                      setPremiumPackSelected(!premiumPackSelected)
                      setBasicPackSelected(false)
                      setUltimatePackSelected(false)
                    }}
                    disabled={emeralds < PACK_PRICES.premium}
                    isSelected={premiumPackSelected}
                    legendaryChance="5%"
                    price={PACK_PRICES.premium}
                    onBuy={() => startPackSelection("premium")}
                    canBuy={emeralds >= PACK_PRICES.premium}
                  />
                </div>
              </div>
            </div>

            {/* Ultimate Pack */}
            <div className="flex flex-col items-center">
              <div className="relative h-[280px] w-full mb-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Store3DPack
                    packType="ultimate"
                    onClick={() => {
                      setSelectedPackType(selectedPackType === "ultimate" ? null : "ultimate")
                      setUltimatePackSelected(!ultimatePackSelected)
                      setBasicPackSelected(false)
                      setPremiumPackSelected(false)
                    }}
                    disabled={emeralds < PACK_PRICES.ultimate}
                    isSelected={ultimatePackSelected}
                    legendaryChance="10%"
                    price={PACK_PRICES.ultimate}
                    onBuy={() => startPackSelection("ultimate")}
                    canBuy={emeralds >= PACK_PRICES.ultimate}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Replace the Store3DPack component with this updated version that resets rotation when not hovered/selected
function Store3DPack({ packType, onClick, disabled, isSelected, legendaryChance, price, onBuy, canBuy }) {
  const [isHovered, setIsHovered] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [modelError, setModelError] = useState(false)
  const [rotation, setRotation] = useState(0)
  const animationRef = useRef(null)

  // Load the appropriate 3D model based on pack type
  const { scene, nodes, materials } = useLoader(GLTFLoader, `/models/${packType}-pack.glb`, undefined, (error) => {
    console.error(`Error loading ${packType} model:`, error)
    setModelError(true)
  })

  // Animation for continuous rotation when hovered
  useEffect(() => {
    // Clear any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    if (isHovered || isSelected) {
      // Start rotation animation
      const animate = () => {
        setRotation((prev) => prev + 0.005)
        animationRef.current = requestAnimationFrame(animate)
      }
      animate()
    } else {
      // Reset rotation to default position when not hovered or selected
      setRotation(0)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isHovered, isSelected])

  // Get pack color for glow effect based on type
  const getPackColor = () => {
    switch (packType) {
      case "basic":
        return "#cccccc"
      case "premium":
        return "#3b82f6"
      case "ultimate":
        return "#a855f7"
    }
  }

  // Get text color based on pack type
  const getTextColor = () => {
    switch (packType) {
      case "basic":
        return "text-gray-400"
      case "premium":
        return "text-blue-200"
      case "ultimate":
        return "text-purple-200"
      default:
        return "text-gray-400"
    }
  }

  // Get button gradient based on pack type
  const getButtonGradient = () => {
    switch (packType) {
      case "basic":
        return "from-gray-500 to-gray-700"
      case "premium":
        return "from-blue-500 to-blue-700"
      case "ultimate":
        return "from-purple-500 to-purple-700"
      default:
        return "from-gray-500 to-gray-700"
    }
  }

  // Set model as loaded when it's available
  useEffect(() => {
    if (scene) {
      setModelLoaded(true)
    }
  }, [scene])

  return (
    <div
      className={`relative w-full h-full ${disabled ? "opacity-50" : "cursor-pointer"} transition-all duration-300 ${isSelected ? "scale-110" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={disabled ? undefined : onClick}
    >
      <Canvas shadows>
        {/* Match lighting with carousel */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} castShadow />
        <pointLight position={[0, 3, 0]} intensity={0.5} />
        <pointLight position={[0, -3, 0]} intensity={0.3} />

        {/* Environment lighting for better reflections */}
        <Environment preset="apartment" />

        {/* Use a separate component for the pack model that uses useFrame */}
        <BobbingPackModel
          scene={scene}
          modelLoaded={modelLoaded}
          modelError={modelError}
          rotation={rotation}
          isHovered={isHovered}
          isSelected={isSelected}
          packType={packType}
        />

        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>

      {/* Pack info - positioned above the pack name */}
      {isSelected && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onBuy()
            }}
            disabled={!canBuy}
            className={`flex items-center justify-center rounded-full bg-gradient-to-r ${getButtonGradient()} px-6 py-2 font-bold text-white shadow-lg transition-transform hover:scale-105 animate-fade-in ${
              !canBuy ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            <Sparkles className="mr-2 h-5 w-5 text-emerald-400" />
            <span className="font-bold text-emerald-400">{price}</span>
          </button>
        </div>
      )}

      {/* Pack name label */}
      <div className="absolute bottom-0 left-0 right-0 text-center">
        <h3 className={`text-sm font-bold text-white transition-all duration-300 ${isSelected ? "text-lg" : ""}`}>
          {packType.charAt(0).toUpperCase() + packType.slice(1)} Pack
        </h3>
      </div>
    </div>
  )
}

// Create a separate component for the pack model that uses useFrame
function BobbingPackModel({ scene, modelLoaded, modelError, rotation, isHovered, isSelected, packType }) {
  const groupRef = useRef()

  // Add bobbing animation using useFrame - now safely inside the Canvas
  useFrame((state) => {
    if (groupRef.current) {
      // Calculate bobbing motion - a gentle sine wave with increased speed (changed from 1.5 to 2.5)
      const bobAmount = Math.sin(state.clock.getElapsedTime() * 2.5) * 0.05

      // Apply bobbing to the group's y position
      groupRef.current.position.y = bobAmount

      // If selected or hovered, increase the bobbing amplitude
      if (isSelected || isHovered) {
        groupRef.current.position.y = bobAmount * 1.5
      }
    }
  })

  // Get pack color for glow effect based on type
  const getPackColor = () => {
    switch (packType) {
      case "basic":
        return "#cccccc"
      case "premium":
        return "#3b82f6"
      case "ultimate":
        return "#a855f7"
    }
  }

  // Create a container that's positioned at x=0 but doesn't rotate
  return (
    <group position={[0, 0, 0]}>
      {/* This group handles the bobbing animation */}
      <group ref={groupRef}>
        {/* This group handles the rotation and scaling */}
        <group rotation={[0, rotation, 0]} scale={isHovered || isSelected ? 1.1 : 1}>
          {modelLoaded && !modelError ? (
            // Center the model to ensure it rotates around its center
            <Center scale={[2, 2, 2]}>
              <primitive
                object={scene.clone()}
                position={[0, 0, 0]}
                rotation={[Math.PI * 1.5, Math.PI / 2, 0]}
                castShadow
                receiveShadow
              />
            </Center>
          ) : (
            // Fallback to simple box representation
            <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.8, 2.6, 0.25]} />
              <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
            </mesh>
          )}

          {/* Glow effect - still using color for the glow only */}
          <pointLight
            position={[0, 0, 2]}
            distance={5}
            intensity={isHovered || isSelected ? 3 : 1.5}
            color={getPackColor()}
          />
        </group>
      </group>
    </group>
  )
}

