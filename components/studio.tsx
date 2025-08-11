"use client"

import { useState, useRef, useEffect, Suspense, useMemo, useCallback } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Environment, Text, Html } from "@react-three/drei"
import { ArrowLeft, Sparkles } from "lucide-react"
import { useGameState, type Item } from "@/hooks/use-game-state"
import { useAvatarModel } from "@/hooks/use-game-state"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { AnimationMixer } from "three"
import type * as THREE from "three"

interface StudioProps {
  onBack: () => void
  isBackground?: boolean // New prop to indicate when used as background
}

// Dummy components to resolve the errors. Replace with actual implementations.
const InteractiveGuitarStand = ({ position, rotation, selectedGuitar, onClick }) => null
const InteractiveClothingDisplay = ({ position, displayedClothes, onClick }) => null
const AvatarOverlay = ({
  guitars,
  clothing,
  selectedGuitar,
  selectedClothing,
  onSelectGuitar,
  onSelectClothing,
  onClose,
}) => null
const GuitarStandOverlay = ({ guitars, selectedGuitar, standPosition, onSelectGuitar, onClose }) => null
const ClothingRackOverlay = ({ clothing, displayedClothes, onAddToRack, onRemoveFromRack, onClose }) => null

export default function Studio({ onBack, isBackground = false }: StudioProps) {
  const { emeralds, items, avatarSettings } = useGameState()
  const [activeOverlay, setActiveOverlay] = useState<"avatar" | "guitarStand" | "clothingRack" | null>(null)
  const [activeGuitarStand, setActiveGuitarStand] = useState<"left" | "right" | null>(null)
  const [selectedGuitar, setSelectedGuitar] = useState<Item | null>(null)
  const [selectedGuitarLeft, setSelectedGuitarLeft] = useState<Item | null>(null)
  const [selectedGuitarRight, setSelectedGuitarRight] = useState<Item | null>(null)
  const [selectedClothing, setSelectedClothing] = useState<Item | null>(null)
  const [displayedClothes, setDisplayedClothes] = useState<Item[]>([])

  // Get items from collection - memoized to prevent recalculation on every render
  const guitars = useMemo(() => items.filter((item) => item.type === "guitar"), [items])
  const clothing = useMemo(() => items.filter((item) => item.type === "clothing"), [items])

  // Memoize handlers to prevent recreation on every render
  const handleCloseOverlay = useCallback(() => {
    setActiveOverlay(null)
    setActiveGuitarStand(null)
  }, [])

  const handleSelectGuitar = useCallback(
    (guitar: Item | null) => {
      if (activeGuitarStand === "left") {
        setSelectedGuitarLeft(guitar)
      } else if (activeGuitarStand === "right") {
        setSelectedGuitarRight(guitar)
      } else {
        setSelectedGuitar(guitar)
      }
    },
    [activeGuitarStand],
  )

  const handleSelectClothing = useCallback((clothing: Item) => {
    setSelectedClothing(clothing)
  }, [])

  const handleAddToRack = useCallback(
    (clothing: Item) => {
      if (!displayedClothes.some((item) => item.id === clothing.id)) {
        setDisplayedClothes((prev) => {
          const newClothes = [...prev, clothing]
          return newClothes.slice(0, 3) // Only show up to 3 items on the rack
        })
      }
    },
    [displayedClothes],
  )

  const handleRemoveFromRack = useCallback((clothingId: string) => {
    setDisplayedClothes((prev) => prev.filter((item) => item.id !== clothingId))
  }, [])

  // Memoize the header to prevent unnecessary re-renders
  const Header = useMemo(
    () =>
      !isBackground && (
        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full bg-black bg-opacity-50 px-4 py-2">
              <Sparkles className="mr-2 h-5 w-5 text-emerald-400" />
              <span className="text-lg font-bold text-emerald-400">{emeralds} Emeralds</span>
            </div>
          </div>
        </div>
      ),
    [isBackground, onBack, emeralds],
  )

  // Memoize the 3D canvas content to prevent unnecessary re-renders
  const StudioScene = useMemo(
    () => (
      <Canvas shadows>
        {/* Adjust camera for background mode */}
        <PerspectiveCamera
          makeDefault
          position={isBackground ? [0, 1.8, 3.5] : [0, 1.5, 5]}
          fov={isBackground ? 55 : 45}
        />

        {/* Disable controls when used as background */}
        {!isBackground && (
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2}
            minDistance={3}
            maxDistance={10}
          />
        )}

        {/* Studio Environment */}
        <Environment preset="apartment" />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} castShadow />

        {/* Studio Room */}
        <StudioRoom isBackground={isBackground} />

        {/* Interactive Avatar - Clickable only when not background */}
        <Suspense fallback={<AvatarFallback position={[0, 0, 0]} />}>
          <ReadyPlayerMeAvatar
            position={[0, 0, 0]}
            avatarUrl={avatarSettings.avatarUrl}
            avatarName={avatarSettings.avatarName}
            selectedGuitar={selectedGuitar}
            onClick={!isBackground ? () => setActiveOverlay("avatar") : undefined}
          />
        </Suspense>

        {/* Only show interactive elements when not used as background */}
        {!isBackground && (
          <>
            {/* Guitar Display Stands - Clickable */}
            <InteractiveGuitarStand
              position={[-2.5, 0, -2]}
              rotation={[0, Math.PI / 4, 0]}
              selectedGuitar={selectedGuitarLeft}
              onClick={() => {
                setActiveOverlay("guitarStand")
                setActiveGuitarStand("left")
              }}
            />

            <InteractiveGuitarStand
              position={[2.5, 0, -2]}
              rotation={[0, -Math.PI / 4, 0]}
              selectedGuitar={selectedGuitarRight}
              onClick={() => {
                setActiveOverlay("guitarStand")
                setActiveGuitarStand("right")
              }}
            />

            {/* Clothing Display - Clickable */}
            <InteractiveClothingDisplay
              position={[0, 1.5, -3]}
              displayedClothes={displayedClothes}
              onClick={() => setActiveOverlay("clothingRack")}
            />
          </>
        )}

        {/* Studio name floating above - only when not background */}
        {!isBackground && (
          <Text
            position={[0, 3, -4]}
            fontSize={0.4}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#000"
          >
            ROCK STAR STUDIO
          </Text>
        )}
      </Canvas>
    ),
    [
      isBackground,
      avatarSettings.avatarUrl,
      avatarSettings.avatarName,
      selectedGuitar,
      selectedGuitarLeft,
      selectedGuitarRight,
      displayedClothes,
    ],
  )

  // Memoize the overlays to prevent unnecessary re-renders
  const Overlays = useMemo(
    () =>
      !isBackground && (
        <>
          {activeOverlay === "avatar" && (
            <AvatarOverlay
              guitars={guitars}
              clothing={clothing}
              selectedGuitar={selectedGuitar}
              selectedClothing={selectedClothing}
              onSelectGuitar={handleSelectGuitar}
              onSelectClothing={handleSelectClothing}
              onClose={handleCloseOverlay}
            />
          )}

          {activeOverlay === "guitarStand" && (
            <GuitarStandOverlay
              guitars={guitars}
              selectedGuitar={activeGuitarStand === "left" ? selectedGuitarLeft : selectedGuitarRight}
              standPosition={activeGuitarStand || "left"}
              onSelectGuitar={handleSelectGuitar}
              onClose={handleCloseOverlay}
            />
          )}

          {activeOverlay === "clothingRack" && (
            <ClothingRackOverlay
              clothing={clothing}
              displayedClothes={displayedClothes}
              onAddToRack={handleAddToRack}
              onRemoveFromRack={handleRemoveFromRack}
              onClose={handleCloseOverlay}
            />
          )}
        </>
      ),
    [
      isBackground,
      activeOverlay,
      activeGuitarStand,
      guitars,
      clothing,
      selectedGuitar,
      selectedClothing,
      selectedGuitarLeft,
      selectedGuitarRight,
      displayedClothes,
      handleSelectGuitar,
      handleSelectClothing,
      handleAddToRack,
      handleRemoveFromRack,
      handleCloseOverlay,
    ],
  )

  return (
    <div
      className={`${isBackground ? "flex flex-col w-full h-full pointer-events-none" : "fixed inset-0 z-50 w-full h-full"}`}
    >
      {Header}
      <div className={`${isBackground ? "w-full h-full pointer-events-none" : "w-full h-full"}`}>{StudioScene}</div>
      {Overlays}
    </div>
  )
}

// Update the ReadyPlayerMeAvatar component to handle the idle animation
function ReadyPlayerMeAvatar({ position, avatarUrl, avatarName, selectedGuitar, onClick }) {
  const group = useRef<THREE.Group>()
  const [modelError, setModelError] = useState(false)
  const { cachedModel, isLoading, preloadAvatar } = useAvatarModel()
  const [loadingProgress, setLoadingProgress] = useState(0)
  const mixerRef = useRef<AnimationMixer | null>(null)
  const animationActionsRef = useRef<THREE.AnimationAction[]>([])
  const loaderRef = useRef<GLTFLoader | null>(null)
  const loadingRef = useRef(false)
  const mountedRef = useRef(true)

  // Only try to load the model if we have a valid URL
  const validUrl = avatarUrl && avatarUrl.trim() !== "" && typeof avatarUrl === "string" ? avatarUrl : null

  // Use the cached model if available, otherwise load it
  const [gltf, setGltf] = useState<any>(null)
  const [loadError, setLoadError] = useState(false)

  // Initialize the loader once
  useEffect(() => {
    if (!loaderRef.current) {
      loaderRef.current = new GLTFLoader()
    }

    return () => {
      mountedRef.current = false
      loadingRef.current = false
    }
  }, [])

  // Preload the avatar if it's not already cached
  useEffect(() => {
    if (validUrl && !cachedModel && !isLoading && !loadingRef.current) {
      preloadAvatar(validUrl)
    }
  }, [validUrl, cachedModel, isLoading, preloadAvatar])

  // Use the cached model if available
  useEffect(() => {
    if (cachedModel && validUrl && mountedRef.current) {
      setGltf(cachedModel)
      setLoadError(false)
      setLoadingProgress(100)
    }
  }, [cachedModel, validUrl])

  // If no cached model, load it directly
  useEffect(() => {
    if (!validUrl || cachedModel || isLoading || loadingRef.current) {
      return
    }

    loadingRef.current = true
    setLoadingProgress(0)

    if (!loaderRef.current) {
      loaderRef.current = new GLTFLoader()
    }

    loaderRef.current.load(
      validUrl,
      (loadedGltf) => {
        if (mountedRef.current) {
          setGltf(loadedGltf)
          setLoadError(false)
          setLoadingProgress(100)
        }
        loadingRef.current = false
      },
      (progress) => {
        // Update loading progress
        if (progress.total > 0 && mountedRef.current) {
          setLoadingProgress(Math.round((progress.loaded / progress.total) * 100))
        }
      },
      (error) => {
        if (mountedRef.current) {
          console.error("Error loading avatar model:", error)
          setLoadError(true)
          setGltf(null)
          setLoadingProgress(0)
        }
        loadingRef.current = false
      },
    )

    return () => {
      loadingRef.current = false
    }
  }, [validUrl, cachedModel, isLoading])

  // Load and apply the idle animation when the model is loaded
  useEffect(() => {
    if (!gltf || !gltf.scene) return

    // Clean up previous mixer if it exists
    if (mixerRef.current) {
      mixerRef.current.stopAllAction()
    }

    // Create a new animation mixer for the avatar
    const mixer = new AnimationMixer(gltf.scene)
    mixerRef.current = mixer

    // Use the existing loader or create a new one
    const loader = loaderRef.current || new GLTFLoader()

    let isComponentMounted = true

    loader.load(
      "/animations/standing-idle.glb",
      (animationGltf) => {
        if (!isComponentMounted) return

        if (animationGltf.animations && animationGltf.animations.length > 0) {
          // Clear previous actions
          animationActionsRef.current.forEach((action) => action.stop())
          animationActionsRef.current = []

          // Apply all animations from the file
          animationGltf.animations.forEach((clip) => {
            if (mixer) {
              const action = mixer.clipAction(clip)
              action.play()
              animationActionsRef.current.push(action)
            }
          })
        } else {
          console.warn("No animations found in the loaded GLB")
        }
      },
      undefined,
      (error) => {
        if (isComponentMounted) {
          console.error("Error loading idle animation:", error)
        }
      },
    )

    // Cleanup function
    return () => {
      isComponentMounted = false
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
      }
    }
  }, [gltf])

  // Track if we have a valid model
  const hasModel = validUrl && gltf && !loadError && !modelError

  useFrame((state, delta) => {
    // Update the animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }
  })

  return (
    <group
      ref={group}
      position={position}
      onClick={onClick ? onClick : undefined}
      className={onClick ? "cursor-pointer" : ""}
    >
      {/* Show the Ready Player Me avatar if it loaded successfully */}
      {hasModel && <primitive object={gltf.scene} scale={1.2} position={[0, 0, 0]} rotation={[0, 0, 0]} />}

      {/* Show fallback avatar if no URL or loading failed */}
      {(!validUrl || loadError || modelError) && (
        <FallbackAvatar position={[0, 0, 0]} rotation={[0, 0, 0]} onClick={onClick} />
      )}

      {/* Guitar if selected - shown regardless of avatar type */}
      {selectedGuitar && (
        <group position={[0.5, 0.6, 0.2]} rotation={[0, -Math.PI / 4, Math.PI / 2]}>
          {/* Guitar Body */}
          <mesh castShadow>
            <boxGeometry args={[0.1, 0.4, 0.15]} />
            <meshStandardMaterial
              color={
                selectedGuitar.name.toLowerCase().includes("dragon")
                  ? "#e74c3c"
                  : selectedGuitar.name.toLowerCase().includes("neon")
                    ? "#2ecc71"
                    : selectedGuitar.name.toLowerCase().includes("flying")
                      ? "#f39c12"
                      : "#3498db"
              }
            />
          </mesh>

          {/* Guitar Neck */}
          <mesh position={[0, -0.4, 0]} castShadow>
            <boxGeometry args={[0.05, 0.5, 0.05]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>

          {/* Guitar Head */}
          <mesh position={[0, -0.7, 0]} castShadow>
            <boxGeometry args={[0.08, 0.1, 0.08]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>

          {/* Strings */}
          <mesh position={[0, -0.2, 0.08]} castShadow>
            <boxGeometry args={[0.05, 0.8, 0.01]} />
            <meshStandardMaterial color="#ccc" />
          </mesh>
        </group>
      )}

      {/* Name Tag with Loading Progress */}
      <Html position={[0, 2.3, 0]} center>
        <div className="bg-black bg-opacity-50 px-3 py-2 rounded text-white text-xs whitespace-nowrap">
          {hasModel ? (
            <span className="animate-bounce">{avatarName} - Click to customize</span>
          ) : validUrl && !loadError && !modelError ? (
            <div>
              <div className="mb-1">Loading avatar... {loadingProgress}%</div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
          ) : validUrl && (loadError || modelError) ? (
            "Failed to load avatar - Click to fix"
          ) : (
            "Create your avatar!"
          )}
        </div>
      </Html>
    </group>
  )
}

// Update the AvatarFallback component to show loading progress
function AvatarFallback({ position }) {
  const group = useRef<THREE.Group>()
  const { isLoading } = useAvatarModel()

  useFrame((state) => {
    if (group.current) {
      // Subtle idle animation for the loading indicator
      group.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.03
    }
  })

  return (
    <group ref={group} position={position}>
      <Html position={[0, 1.5, 0]} center>
        <div className="bg-black bg-opacity-50 px-4 py-3 rounded text-white text-sm">
          <div className="flex items-center justify-center">
            <div className="animate-spin mr-2 h-5 w-5 border-t-2 border-blue-500 rounded-full"></div>
            <span>Loading avatar...</span>
          </div>
        </div>
      </Html>
    </group>
  )
}

// Studio Room Component
function StudioRoom({ isBackground = false }) {
  // Adjust room size for background mode
  const roomScale = isBackground ? 0.85 : 1

  return (
    <group scale={[roomScale, roomScale, roomScale]}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 4, -7]} receiveShadow>
        <boxGeometry args={[15, 8, 0.1]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      <mesh position={[-7.5, 4, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[15, 8, 0.1]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      <mesh position={[8, 0.1, 0]}>
        <meshStandardMaterial color="#222" />
      </mesh>

      <mesh position={[7.5, 4, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[15, 8, 0.1]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Studio Sign - only when not background */}
      {!isBackground && (
        <mesh position={[0, 6, -6.9]} receiveShadow>
          <planeGeometry args={[6, 1.5]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      )}

      {/* Speakers */}
      <mesh position={[-5, 0.5, -6.5]} castShadow>
        <boxGeometry args={[1, 1.5, 0.7]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      <mesh position={[5, 0.5, -6.5]} castShadow>
        <boxGeometry args={[1, 1.5, 0.7]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Amp */}
      <mesh position={[0, 0.5, -6.5]} castShadow>
        <boxGeometry args={[2, 1, 0.8]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Spotlights on the floor */}
      <SpotlightCircle position={[0, 0.01, 0]} color="#5768e3" />
      <SpotlightCircle position={[-2.5, 0.01, -2]} color="#e35757" />
      <SpotlightCircle position={[2.5, 0.01, -2]} color="#57e374" />
    </group>
  )
}

// Spotlight circle on floor
function SpotlightCircle({ position, color }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[1, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
    </mesh>
  )
}

function FallbackAvatar({ position, rotation, onClick }) {
  const [model, setModel] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [loading, setLoading] = useState(true)
  const mixerRef = useRef<AnimationMixer | null>(null)
  const fallbackUrl = "https://models.readyplayer.me/67ec942bc6ff736b3d42eba6.glb"
  const groupRef = useRef<THREE.Group>()
  const mountedRef = useRef(true)
  const loaderRef = useRef<GLTFLoader | null>(null)

  useEffect(() => {
    // Initialize the loader once
    if (!loaderRef.current) {
      loaderRef.current = new GLTFLoader()
    }

    const loader = loaderRef.current

    loader.load(
      fallbackUrl,
      (gltf) => {
        if (!mountedRef.current) return

        setModel(gltf)
        setLoading(false)

        // Create a new animation mixer for the avatar
        const mixer = new AnimationMixer(gltf.scene)
        mixerRef.current = mixer

        // Try to load the idle animation
        new GLTFLoader().load(
          "/animations/standing-idle.glb",
          (animationGltf) => {
            if (!mountedRef.current) return

            if (animationGltf.animations && animationGltf.animations.length > 0) {
              // Apply animations to the fallback model
              animationGltf.animations.forEach((clip) => {
                if (mixer) {
                  const action = mixer.clipAction(clip)
                  action.play()
                }
              })
            }
          },
          undefined,
          (error) => {
            if (mountedRef.current) {
              console.error("Error loading idle animation:", error)
            }
          },
        )
      },
      undefined,
      (error) => {
        if (!mountedRef.current) return

        console.error("Error loading fallback avatar:", error)
        setLoadError(true)
        setLoading(false)
      },
    )

    return () => {
      mountedRef.current = false
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
      }
    }
  }, [])

  useFrame((state, delta) => {
    // Update animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }
  })

  if (loadError || loading) {
    return (
      <group ref={groupRef} position={position} rotation={rotation}>
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-black bg-opacity-50 px-4 py-3 rounded text-white text-sm">
            <div className="flex items-center justify-center">
              <div className="animate-spin mr-2 h-5 w-5 border-t-2 border-blue-500 rounded-full"></div>
              <span>Loading avatar...</span>
            </div>
          </div>
        </Html>
      </group>
    )
  }

  return model ? (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={onClick ? onClick : undefined}
      className={onClick ? "cursor-pointer" : ""}
    >
      <primitive object={model.scene} scale={1.2} />
    </group>
  ) : null
}

