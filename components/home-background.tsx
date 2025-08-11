"use client"

import { useRef, useState, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { useAvatarModel } from "@/hooks/use-game-state"
import type * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { AnimationMixer } from "three"
import type { Item } from "@/hooks/use-game-state"
import { Html } from "@react-three/drei"

interface HomeBackgroundProps {
  avatarUrl: string
  selectedGuitar?: Item | null
  isMobile?: boolean
  onLoaded?: () => void
}

export default function HomeBackground({ avatarUrl, selectedGuitar, isMobile = false, onLoaded }: HomeBackgroundProps) {
  const group = useRef<THREE.Group>(null)
  const [modelError, setModelError] = useState(false)
  const { cachedModel, isLoading, preloadAvatar } = useAvatarModel()
  const [loadingProgress, setLoadingProgress] = useState(0)
  const mixerRef = useRef<AnimationMixer | null>(null)
  const animationActionsRef = useRef<THREE.AnimationAction[]>([])
  const loaderRef = useRef<GLTFLoader | null>(null)
  const loadingRef = useRef(false)

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
      // Clean up any pending loads
      loadingRef.current = false
    }
  }, [])

  // Preload the avatar if it's not already cached - with proper dependency tracking
  useEffect(() => {
    if (validUrl && !cachedModel && !isLoading && !loadingRef.current) {
      preloadAvatar(validUrl)
    }
  }, [validUrl, cachedModel, isLoading, preloadAvatar])

  // Use the cached model if available - with memoization to prevent unnecessary state updates
  useEffect(() => {
    if (cachedModel && validUrl) {
      setGltf(cachedModel)
      setLoadError(false)
      setLoadingProgress(100)

      // Notify parent component that background is loaded
      if (onLoaded) {
        onLoaded()
      }
    }
  }, [cachedModel, validUrl, onLoaded])

  // If no cached model, load it directly - with better state management
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
        if (loadingRef.current) {
          // Only update state if we're still loading this URL
          setGltf(loadedGltf)
          setLoadError(false)
          setLoadingProgress(100)
          loadingRef.current = false

          // Notify parent component that background is loaded
          if (onLoaded) {
            onLoaded()
          }
        }
      },
      (progress) => {
        // Update loading progress
        if (progress.total > 0 && loadingRef.current) {
          setLoadingProgress(Math.round((progress.loaded / progress.total) * 100))
        }
      },
      (error) => {
        if (loadingRef.current) {
          console.error("Error loading avatar model:", error)
          setLoadError(true)
          setGltf(null)
          setLoadingProgress(0)
          loadingRef.current = false

          // Notify parent component that background failed to load
          if (onLoaded) {
            onLoaded()
          }
        }
      },
    )

    return () => {
      loadingRef.current = false
    }
  }, [validUrl, cachedModel, isLoading, onLoaded])

  // Load and apply the idle animation when the model is loaded - with cleanup and memoization
  useEffect(() => {
    if (!gltf || !gltf.scene) return

    // Clean up previous mixer if it exists
    if (mixerRef.current) {
      mixerRef.current.stopAllAction()
    }

    // Create a new animation mixer for the avatar
    const mixer = new AnimationMixer(gltf.scene)
    mixerRef.current = mixer

    let isComponentMounted = true

    // Use the existing loader or create a new one
    const loader = loaderRef.current || new GLTFLoader()

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

  // Animate the avatar
  useFrame((state, delta) => {
    // Update the animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }
  })

  return (
    <group ref={group} position={[0, -1.5, 0]} rotation={[0, 0, 0]}>
      {/* Set the background color of the scene */}
      <color attach="background" args={["#f0f4f8"]} />
      {/* Add ambient light to brighten the entire scene */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
      {/* Show the Ready Player Me avatar if it loaded successfully */}
      {hasModel && <primitive object={gltf.scene} scale={1.3} position={[0, 0, 0]} rotation={[0, 0, 0]} />}

      {/* Show fallback avatar if no URL or loading failed */}
      {(!validUrl || loadError || modelError) && (
        <group>
          {/* Use a fallback GLB model instead of geometric shapes */}
          <FallbackAvatar position={[0, 0, 0]} rotation={[0, 0, 0]} onLoaded={onLoaded} />
        </group>
      )}

      {/* Guitar if selected */}
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

      {/* Add a floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>

      {/* Add a spotlight on the floor */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3, 32]} />
        <meshStandardMaterial color="#a3d9ff" emissive="#a3d9ff" emissiveIntensity={0.15} transparent opacity={0.25} />
      </mesh>
    </group>
  )
}

function FallbackAvatar({
  position,
  rotation,
  onLoaded,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  onLoaded?: () => void
}) {
  const [model, setModel] = useState<any>(null)
  const [loadError, setLoadError] = useState(false)
  const [loading, setLoading] = useState(true)
  const mixerRef = useRef<AnimationMixer | null>(null)
  const fallbackUrl = "https://models.readyplayer.me/67ec942bc6ff736b3d42eba6.glb"
  const groupRef = useRef<THREE.Group>(null)
  const loadingRef = useRef(true)

  useEffect(() => {
    const loader = new GLTFLoader()
    let isComponentMounted = true

    loader.load(
      fallbackUrl,
      (gltf) => {
        if (!isComponentMounted) return

        setModel(gltf)
        setLoading(false)
        loadingRef.current = false

        // Notify parent component that fallback avatar is loaded
        if (onLoaded) {
          onLoaded()
        }

        // Create a new animation mixer for the avatar
        const mixer = new AnimationMixer(gltf.scene)
        mixerRef.current = mixer

        // Try to load the idle animation
        new GLTFLoader().load(
          "/animations/standing-idle.glb",
          (animationGltf) => {
            if (!isComponentMounted) return

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
            if (isComponentMounted) {
              console.error("Error loading idle animation:", error)
            }
          },
        )
      },
      undefined,
      (error) => {
        if (!isComponentMounted) return

        console.error("Error loading fallback avatar:", error)
        setLoadError(true)
        setLoading(false)
        loadingRef.current = false

        // Notify parent component even if fallback avatar failed to load
        if (onLoaded) {
          onLoaded()
        }
      },
    )

    return () => {
      isComponentMounted = false
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
      }
    }
  }, [onLoaded])

  useFrame((state, delta) => {
    // Update animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }
  })

  if (loadError || loading) {
    return (
      <group position={position} rotation={rotation}>
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

  return model ? <primitive object={model.scene} position={position} rotation={rotation} scale={1.3} /> : null
}

