"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Environment, Text, Html } from "@react-three/drei"
import { ArrowLeft, Sparkles } from "lucide-react"
import { useGameState, type Item } from "@/hooks/use-game-state"
import { useAvatarModel } from "@/hooks/use-game-state"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { AnimationMixer } from "three"
import { SpotLight } from "@react-three/drei"

interface StadiumProps {
  onBack: () => void
  isBackground?: boolean // Prop to indicate when used as background
}

// Update the Stadium component to use the simplified components and reduce complexity

export default function Stadium({ onBack, isBackground = false }: StadiumProps) {
  const { emeralds, items, avatarSettings } = useGameState()
  const [selectedGuitar, setSelectedGuitar] = useState<Item | null>(null)

  // Get guitar items from collection
  const guitars = items.filter((item) => item.type === "guitar")

  // Select first guitar by default if available
  useEffect(() => {
    if (guitars.length > 0 && !selectedGuitar) {
      setSelectedGuitar(guitars[0])
    }
  }, [guitars, selectedGuitar])

  return (
    <div
      className={`${isBackground ? "flex flex-col w-full h-full pointer-events-none" : "fixed inset-0 z-50 w-full h-full"}`}
    >
      {/* Only show header if not used as background */}
      {!isBackground && (
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
      )}

      {/* 3D Stadium Scene */}
      <div className={`${isBackground ? "w-full h-full pointer-events-none" : "w-full h-full"}`}>
        <Canvas shadows gl={{ antialias: false, powerPreference: "high-performance" }}>
          {/* Adjust camera for background mode */}
          <PerspectiveCamera
            makeDefault
            position={isBackground ? [0, 2, 8] : [0, 3, 12]}
            fov={isBackground ? 55 : 45}
          />

          {/* Disable controls when used as background */}
          {!isBackground && (
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2}
              minDistance={5}
              maxDistance={20}
            />
          )}

          {/* Stadium Environment - simplified */}
          <Environment preset="night" />
          <ambientLight intensity={0.2} />
          <fog attach="fog" args={["#000", 10, 50]} />

          {/* Stadium Room */}
          <StadiumStage isBackground={isBackground} />

          {/* Interactive Avatar */}
          <Suspense fallback={<AvatarFallback position={[0, 1.5, 0]} />}>
            <ReadyPlayerMeAvatar
              position={[0, 1.5, 0]}
              avatarUrl={avatarSettings.avatarUrl}
              avatarName={avatarSettings.avatarName}
              selectedGuitar={selectedGuitar}
            />
          </Suspense>

          {/* Stage lighting - simplified */}
          <StageLights />

          {/* Stadium name floating above - only when not background */}
          {!isBackground && (
            <Text
              position={[0, 6, -8]}
              fontSize={1.2}
              color="#ff3e3e"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.05}
              outlineColor="#500"
              font="/fonts/Rockwell-Bold.ttf"
            >
              ROCK ARENA
            </Text>
          )}
        </Canvas>
      </div>
    </div>
  )
}

// Optimize the ReadyPlayerMeAvatar component to reduce texture usage

function ReadyPlayerMeAvatar({ position, avatarUrl, avatarName, selectedGuitar }) {
  const group = useRef()
  const [modelError, setModelError] = useState(false)
  const { cachedModel, isLoading, preloadAvatar } = useAvatarModel()
  const [loadingProgress, setLoadingProgress] = useState(0)
  const mixerRef = useRef(null)
  const animationActionsRef = useRef([])

  // Only try to load the model if we have a valid URL
  const validUrl = avatarUrl && avatarUrl.trim() !== "" && typeof avatarUrl === "string" ? avatarUrl : null

  // Use the cached model if available, otherwise load it
  const [gltf, setGltf] = useState(null)
  const [loadError, setLoadError] = useState(false)

  // Preload the avatar if it's not already cached
  useEffect(() => {
    if (validUrl && !cachedModel && !isLoading) {
      preloadAvatar(validUrl)
    }
  }, [validUrl, cachedModel, isLoading, preloadAvatar])

  // Use the cached model if available
  useEffect(() => {
    if (cachedModel && validUrl) {
      // Clone the model to avoid modifying the cached one
      const clonedModel = { ...cachedModel }

      // Optimize materials to reduce texture usage
      if (clonedModel.scene) {
        clonedModel.scene.traverse((node) => {
          if (node.isMesh && node.material) {
            // Simplify materials to reduce texture usage
            if (Array.isArray(node.material)) {
              node.material.forEach((mat) => {
                if (mat.map) mat.map.anisotropy = 1 // Reduce anisotropic filtering
                mat.envMapIntensity = 0.5 // Reduce environment map intensity
                mat.needsUpdate = true
              })
            } else {
              if (node.material.map) node.material.map.anisotropy = 1
              node.material.envMapIntensity = 0.5
              node.material.needsUpdate = true
            }
          }
        })
      }

      setGltf(clonedModel)
      setLoadError(false)
      setLoadingProgress(100)
    }
  }, [cachedModel, validUrl])

  // If no cached model, load it directly with optimizations
  useEffect(() => {
    if (validUrl && !cachedModel && !isLoading) {
      setLoadingProgress(0)

      new GLTFLoader().load(
        validUrl,
        (loadedGltf) => {
          // Optimize materials to reduce texture usage
          if (loadedGltf.scene) {
            loadedGltf.scene.traverse((node) => {
              if (node.isMesh && node.material) {
                // Simplify materials to reduce texture usage
                if (Array.isArray(node.material)) {
                  node.material.forEach((mat) => {
                    if (mat.map) mat.map.anisotropy = 1
                    mat.envMapIntensity = 0.5
                    mat.needsUpdate = true
                  })
                } else {
                  if (node.material.map) node.material.map.anisotropy = 1
                  node.material.envMapIntensity = 0.5
                  node.material.needsUpdate = true
                }
              }
            })
          }

          setGltf(loadedGltf)
          setLoadError(false)
          setLoadingProgress(100)
        },
        (progress) => {
          // Update loading progress
          if (progress.total > 0) {
            setLoadingProgress(Math.round((progress.loaded / progress.total) * 100))
          }
        },
        (error) => {
          console.error("Error loading avatar model:", error)
          setLoadError(true)
          setGltf(null)
          setLoadingProgress(0)
        },
      )
    }
  }, [validUrl, cachedModel, isLoading])

  // Load and apply the idle animation when the model is loaded
  useEffect(() => {
    if (gltf && gltf.scene) {
      // Clean up previous mixer if it exists
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
      }

      // Create a new animation mixer for the avatar
      const mixer = new AnimationMixer(gltf.scene)
      mixerRef.current = mixer

      // Load the dance animation instead of idle animation
      new GLTFLoader().load(
        "/animations/M_Dances_011.glb",
        (animationGltf) => {
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
          console.error("Error loading dance animation:", error)
        },
      )
    }

    // Cleanup function
    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
      }
    }
  }, [gltf])

  // Track if we have a valid model
  const hasModel = validUrl && gltf && !loadError && !modelError

  // Add a rocking animation for the avatar on stage
  useFrame((state, delta) => {
    // Update the animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }

    // Add a slight rocking motion for the avatar on stage
    if (group.current) {
      group.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2
      // Slight head banging motion
      if (gltf && gltf.scene) {
        const headBob = Math.sin(state.clock.getElapsedTime() * 2) * 0.05
        group.current.rotation.x = headBob
      }
    }
  })

  return (
    <group ref={group} position={position} rotation={[0, 0, 0]}>
      {/* Show the Ready Player Me avatar if it loaded successfully */}
      {hasModel && <primitive object={gltf.scene} scale={1.2} position={[0, 0, 0]} rotation={[0, 0, 0]} />}

      {/* Show fallback avatar if no URL or loading failed */}
      {(!validUrl || loadError || modelError) && <FallbackAvatar position={[0, 0, 0]} rotation={[0, 0, 0]} />}

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
            <span className="animate-pulse">{avatarName} - Rock Star</span>
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
            "Failed to load avatar"
          ) : (
            "Rock Star"
          )}
        </div>
      </Html>
    </group>
  )
}

// Fallback avatar component
function FallbackAvatar({ position, rotation }) {
  const [model, setModel] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [loading, setLoading] = useState(true)
  const mixerRef = useRef(null)
  const fallbackUrl = "https://models.readyplayer.me/67ec942bc6ff736b3d42eba6.glb"
  const groupRef = useRef()

  useEffect(() => {
    const loader = new GLTFLoader()
    loader.load(
      fallbackUrl,
      (gltf) => {
        setModel(gltf)
        setLoading(false)

        // Create a new animation mixer for the avatar
        const mixer = new AnimationMixer(gltf.scene)
        mixerRef.current = mixer

        // Try to load the dance animation
        new GLTFLoader().load(
          "/animations/M_Dances_011.glb",
          (animationGltf) => {
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
          (error) => console.error("Error loading dance animation:", error),
        )
      },
      undefined,
      (error) => {
        console.error("Error loading fallback avatar:", error)
        setLoadError(true)
        setLoading(false)
      },
    )

    return () => {
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

    // Add a slight rocking motion for the avatar on stage
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2
      // Slight head banging motion
      const headBob = Math.sin(state.clock.getElapsedTime() * 2) * 0.05
      groupRef.current.rotation.x = headBob
    }
  })

  if (loadError || loading) {
    return (
      <group ref={groupRef} position={position} rotation={rotation}>
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-black bg-opacity-50 px-3 py-2 rounded text-white text-sm">
            <div className="flex items-center justify-center">
              <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-blue-500 rounded-full"></div>
              <span>Loading avatar...</span>
            </div>
          </div>
        </Html>
      </group>
    )
  }

  return model ? (
    <group ref={groupRef} position={position} rotation={rotation}>
      <primitive object={model.scene} scale={1.2} />
    </group>
  ) : null
}

// Loading fallback
function AvatarFallback({ position }) {
  const group = useRef()
  // const { isLoading } = useAvatarModel()

  // useFrame((state) => {
  //   if (group.current) {
  //     // Subtle idle animation - sway side to side and a small bounce
  //     group.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.1
  //     group.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.03
  //   }
  // })

  // return (
  //   <group ref={group} position={position}>
  //     {/* Body */}
  //     <mesh position={[0, 1, 0]} castShadow>
  //       <capsuleGeometry args={[0.3, 1, 8, 16]} />
  //       <meshStandardMaterial color="#666" />
  //     </mesh>

  //     {/* Head */}
  //     <mesh position={[0, 1.8, 0]} castShadow>
  //       <sphereGeometry args={[0.25, 32, 32]} />
  //       <meshStandardMaterial color="#666" />
  //     </mesh>

  //     {/* Arms */}
  //     <mesh position={[-0.4, 1, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
  //       <capsuleGeometry args={[0.08, 0.7, 8, 16]} />
  //       <meshStandardMaterial color="#666" />
  //     </mesh>

  //     <mesh position={[0.4, 1, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
  //       <capsuleGeometry args={[0.08, 0.7, 8, 16]} />
  //       <meshStandardMaterial color="#666" />
  //     </mesh>

  //     {/* Legs */}
  //     <mesh position={[-0.2, 0.3, 0]} castShadow>
  //       <capsuleGeometry args={[0.1, 0.7, 8, 16]} />
  //       <meshStandardMaterial color="#666" />
  //     </mesh>

  //     <mesh position={[0.2, 0.3, 0]} castShadow>
  //       <capsuleGeometry args={[0.1, 0.7, 8, 16]} />
  //       <meshStandardMaterial color="#666" />
  //     </mesh>

  //     {/* Loading indicator */}
  //     <Html position={[0, 2.3, 0]} center>
  //       <div className="bg-black bg-opacity-50 px-3 py-2 rounded text-white text-xs whitespace-nowrap">
  //         <div className="flex items-center">
  //           <div className="animate-spin mr-2 h-3 w-3 border-t-2 border-blue-500 rounded-full"></div>
  //           <span>Preparing avatar...</span>
  //         </div>
  //       </div>
  //     </Html>
  //   </group>
  // )
  return (
    <group ref={group} position={position}>
      <Html position={[0, 0, 0]} center>
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

// Simplify the Stadium component to reduce texture usage and improve performance

// In the Stadium component, reduce the complexity of the scene
function StadiumStage({ isBackground = false }) {
  // Adjust stage size based on background mode
  const stageScale = isBackground ? 0.85 : 1

  return (
    <group scale={[stageScale, stageScale, stageScale]}>
      {/* Main Stage Platform - simplified */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[15, 10]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Stage Front - elevated platform */}
      <mesh position={[0, 0.5, 0]} receiveShadow castShadow>
        <boxGeometry args={[10, 1, 6]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Back Wall/Screen - simplified */}
      <mesh position={[0, 6, -8]} receiveShadow>
        <planeGeometry args={[20, 12]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Speaker Stacks - simplified to use fewer materials */}
      <group position={[-4, 1, -3]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 3, 1.5]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </group>

      <group position={[4, 1, -3]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 3, 1.5]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </group>

      {/* Floor Monitors - simplified */}
      <mesh position={[-1.5, 1.01, 1.5]} rotation={[0, Math.PI / 6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.6, 0.8]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      <mesh position={[1.5, 1.01, 1.5]} rotation={[0, -Math.PI / 6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.6, 0.8]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Audience Area (floor) */}
      <mesh position={[0, -0.1, 8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 15]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Stage lighting spots - simplified */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3, 32]} />
        <meshStandardMaterial color="#5768e3" emissive="#5768e3" emissiveIntensity={0.2} transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

// Replace the complex StageLights component with a simplified version
function StageLights() {
  const spotlightRef1 = useRef()
  const spotlightRef2 = useRef()
  const spotlightRef3 = useRef()
  const pointLightRefs = useRef([])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    // Animate spotlight positions
    if (spotlightRef1.current) {
      spotlightRef1.current.position.x = Math.sin(t * 0.5) * 3
      spotlightRef1.current.target.position.x = Math.sin(t * 0.5) * 2
    }

    if (spotlightRef2.current) {
      spotlightRef2.current.position.x = Math.sin(t * 0.5 + Math.PI) * 3
      spotlightRef2.current.target.position.x = Math.sin(t * 0.5 + Math.PI) * 2
    }

    if (spotlightRef3.current) {
      spotlightRef3.current.position.z = Math.sin(t * 0.3) * 2
      spotlightRef3.current.target.position.z = Math.sin(t * 0.3) * 1.5
    }

    // Animate point lights for color changes
    pointLightRefs.current.forEach((light, i) => {
      if (light) {
        // Animate color
        const r = Math.sin(t * 0.3 + i * 0.5) * 0.5 + 0.5
        const g = Math.sin(t * 0.5 + i * 0.5) * 0.5 + 0.5
        const b = Math.sin(t * 0.7 + i * 0.5) * 0.5 + 0.5

        light.color.setRGB(r, g, b)

        // Animate intensity for flashing effect
        light.intensity = (Math.sin(t * 2 + i) * 0.5 + 0.5) * 3
      }
    })
  })

  return (
    <>
      {/* Main spotlights */}
      <SpotLight
        ref={spotlightRef1}
        position={[-3, 8, 0]}
        angle={0.3}
        penumbra={0.2}
        intensity={5}
        distance={20}
        color="#ff0000"
        castShadow
      />

      <SpotLight
        ref={spotlightRef2}
        position={[3, 8, 0]}
        angle={0.3}
        penumbra={0.2}
        intensity={5}
        distance={20}
        color="#0000ff"
        castShadow
      />

      <SpotLight
        ref={spotlightRef3}
        position={[0, 8, -2]}
        angle={0.4}
        penumbra={0.2}
        intensity={5}
        distance={20}
        color="#ff00ff"
        castShadow
      />

      {/* Static front light */}
      <spotLight
        position={[0, 5, 5]}
        angle={0.5}
        penumbra={0.5}
        intensity={2}
        distance={20}
        color="#ffffff"
        castShadow
      />

      {/* Color changing point lights - limited to 4 for performance */}
      {[0, 1, 2, 3].map((i) => (
        <pointLight
          key={i}
          ref={(el) => (pointLightRefs.current[i] = el)}
          position={[
            i % 2 === 0 ? -4 : 4, // Left or right side
            6, // Height
            i < 2 ? -4 : 2, // Front or back
          ]}
          intensity={2}
          distance={10}
        />
      ))}
    </>
  )
}

// Simplify the audience to just a few static elements
function AudienceArea({ position }) {
  return (
    <group position={position}>
      {/* Simple audience representation */}
      <mesh position={[0, 0.5, 5]} castShadow>
        <boxGeometry args={[15, 1, 8]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Add a simple crowd lighting */}
      <pointLight position={[0, 3, 5]} intensity={1} distance={15} color="#4422ff" />
    </group>
  )
}

