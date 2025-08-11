"use client"

import { useState, useEffect, useRef } from "react"
import { useMobile } from "@/hooks/use-mobile"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { PerspectiveCamera, Environment } from "@react-three/drei"
import * as THREE from "three"

interface PackCarouselProps {
  packType: "basic" | "premium" | "ultimate"
  onSelect: () => void
  onCancel: () => void
}

// Particle effect component
function PackOpeningParticles({ color }) {
  const [particles, setParticles] = useState<{ position: THREE.Vector3; velocity: THREE.Vector3; life: number }[]>([])

  useEffect(() => {
    // Create initial particles
    const newParticles = Array.from({ length: 50 }, () => {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
      )
      const velocity = new THREE.Vector3((Math.random() - 0.5) * 0.1, Math.random() * 0.2, (Math.random() - 0.5) * 0.1)
      const life = Math.random() * 2 // Particle lifespan in seconds
      return { position, velocity, life }
    })
    setParticles(newParticles)
  }, [])

  useFrame((state, delta) => {
    // Update particle positions and remove dead particles
    setParticles((currentParticles) => {
      return currentParticles
        .map((particle) => {
          const newPosition = particle.position.clone().add(particle.velocity.clone().multiplyScalar(delta))
          const newLife = particle.life - delta

          return {
            position: newPosition,
            velocity: particle.velocity,
            life: newLife,
          }
        })
        .filter((particle) => particle.life > 0)
    })
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={new Float32Array(particles.flatMap((p) => [p.position.x, p.position.y, p.position.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color={color} transparent opacity={0.7} />
    </points>
  )
}

export default function PackCarousel({ packType, onSelect, onCancel }: PackCarouselProps) {
  const isMobile = useMobile()
  const [selectedPack, setSelectedPack] = useState<number | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  const [wheelStopped, setWheelStopped] = useState(false)
  const [spinning, setSpinning] = useState(true)
  const [showStopButton, setShowStopButton] = useState(true)
  const [isModelLoading, setIsModelLoading] = useState(true)

  // Number of packs in the wheel
  const packCount = isMobile ? 3 : 8

  // Calculate radius based on screen size
  const radius = isMobile ? 1.5 : 3 // Reduced from 2 and 4 respectively

  // Handle stopping the wheel
  const stopWheel = () => {
    if (!spinning || isOpening) return
    setShowStopButton(false)

    // Let the wheel continue spinning for a moment, then start slowing down
    setTimeout(() => {
      setSpinning(false)
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 overflow-hidden">
      <div className="relative w-full max-w-md mx-auto flex flex-col justify-center items-center h-screen">
        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-10 mb-2 text-center">
          <h2 className={`${isMobile ? "text-xl" : "text-3xl"} font-bold text-white`}>
            {packType.charAt(0).toUpperCase() + packType.slice(1)} Pack
          </h2>
          <p className="mt-1 text-gray-300 text-xs">
            {spinning && showStopButton
              ? "Press STOP to select a random pack"
              : spinning && !showStopButton
                ? "Selecting your pack..."
                : isOpening
                  ? "Opening your pack..."
                  : "Pack selected!"}
          </p>
        </div>

        {/* 3D Canvas */}
        <div className="w-full h-full">
          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[0.5, 0, 5]} intensity={1} castShadow />
            <Environment preset="apartment" />

            {/* Pack Wheel */}
            <PackWheel
              packCount={packCount}
              radius={radius}
              packType={packType}
              spinning={spinning}
              wheelStopped={wheelStopped}
              selectedPack={selectedPack}
              isOpening={isOpening}
              onLoaded={() => setIsModelLoading(false)}
              setSelectedPack={setSelectedPack}
              setWheelStopped={setWheelStopped}
            />
          </Canvas>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-0 right-0 z-10 flex items-center justify-center gap-4">
          {spinning && showStopButton && (
            <button
              onClick={stopWheel}
              className={`rounded-full bg-gradient-to-r from-red-500 to-red-700 ${isMobile ? "px-5 py-2 text-base" : "px-8 py-4 text-xl"} font-bold text-white shadow-lg transition-transform hover:scale-105 hover:from-red-600 hover:to-red-800`}
            >
              STOP
            </button>
          )}

          {spinning && !showStopButton && (
            <div className={`${isMobile ? "text-sm" : "text-lg"} text-white animate-pulse`}>Selecting pack...</div>
          )}

          {wheelStopped && !isOpening && selectedPack !== null && (
            <button
              onClick={() => {
                setIsOpening(true)
                console.log("Opening pack #", selectedPack + 1)
                setTimeout(() => {
                  onSelect()
                }, 500)
              }}
              className={`rounded-full bg-gradient-to-r from-green-500 to-blue-500 ${isMobile ? "px-5 py-2 text-sm" : "px-8 py-3 text-lg"} font-bold text-white shadow-lg transition-transform hover:scale-105`}
            >
              Open Pack
            </button>
          )}

          {isOpening && (
            <div className={`${isMobile ? "text-sm" : "text-lg"} text-white animate-pulse`}>Opening pack...</div>
          )}
        </div>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="absolute top-2 right-2 z-20 rounded-full bg-gray-800 px-3 py-1 text-xs text-white hover:bg-gray-700"
          disabled={isOpening}
        >
          Cancel
        </button>

        {/* Loading indicator */}
        {isModelLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-30">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
              <p>Loading 3D models...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Pack Wheel Component
function PackWheel({
  packCount,
  radius,
  packType,
  spinning,
  wheelStopped,
  selectedPack,
  isOpening,
  onLoaded,
  setSelectedPack,
  setWheelStopped,
}) {
  const groupRef = useRef<THREE.Group>(null)
  const rotationRef = useRef(0)
  const speedRef = useRef(1.0) // Increased from 0.5 to make the wheel spin faster
  const deceleratingRef = useRef(false)
  const targetRotationRef = useRef(0)
  const snapAnimationRef = useRef(false)
  const isMobile = useMobile()
  const packRefsRef = useRef<THREE.Group[]>([])

  // Store references to all pack positions
  const packPositionsRef = useRef<{ index: number; position: THREE.Vector3; angle: number }[]>([])

  // Add a ref to store the initially selected pack to prevent changing it later
  const initialSelectedPackRef = useRef<number | null>(null)

  // Load the pack model based on packType
  const gltf = useLoader(GLTFLoader, `/models/${packType}-pack.glb`)

  // Signal that the model is loaded
  useEffect(() => {
    if (gltf) {
      onLoaded()
    }
  }, [gltf, onLoaded])

  // Reset refs when spinning changes
  useEffect(() => {
    if (spinning) {
      deceleratingRef.current = false
      snapAnimationRef.current = false
      initialSelectedPackRef.current = null
    }
  }, [spinning])

  // Initialize pack positions
  useEffect(() => {
    packPositionsRef.current = Array(packCount)
      .fill(0)
      .map((_, index) => {
        const angle = ((Math.PI * 2) / packCount) * index
        const x = Math.sin(angle) * radius
        const z = Math.cos(angle) * radius
        return {
          index,
          position: new THREE.Vector3(x, 0, z),
          angle,
        }
      })
  }, [packCount, radius])

  // Function to find the pack with highest Z value (closest to camera)
  const findFrontPack = () => {
    if (!groupRef.current || packPositionsRef.current.length === 0)
      return { index: 0, position: new THREE.Vector3(), angle: 0 }

    // Get the current rotation of the wheel
    const wheelRotation = groupRef.current.rotation.y

    // Calculate the world position of each pack after applying wheel rotation
    const worldPositions = packPositionsRef.current.map((pack) => {
      // Create a copy of the original position
      const pos = pack.position.clone()

      // Apply the wheel's rotation to get the current world position
      const rotMatrix = new THREE.Matrix4().makeRotationY(wheelRotation)
      pos.applyMatrix4(rotMatrix)

      return {
        index: pack.index,
        position: pos,
        angle: pack.angle,
        worldZ: pos.z,
      }
    })

    // Find the pack with the highest Z value (closest to camera)
    let frontPack = worldPositions[0]
    let highestZ = worldPositions[0].position.z

    for (let i = 1; i < worldPositions.length; i++) {
      if (worldPositions[i].position.z > highestZ) {
        highestZ = worldPositions[i].position.z
        frontPack = worldPositions[i]
      }
    }

    // Log all pack Z values for debugging
    console.log(
      "All pack Z values:",
      worldPositions.map((p) => `Pack #${p.index + 1}: ${p.worldZ.toFixed(2)}`).join(", "),
    )
    console.log("Front pack is #", frontPack.index + 1, "with Z =", highestZ)

    return {
      index: frontPack.index,
      position: frontPack.position,
      angle: frontPack.angle,
    }
  }

  // Calculate the target rotation to bring a specific pack to the front
  const calculateTargetRotation = (packIndex: number) => {
    // Find the pack's original angle
    const packInfo = packPositionsRef.current.find((p) => p.index === packIndex)
    if (!packInfo) return 0

    // The target rotation is the negative of the pack's angle
    // This will rotate the wheel so that the pack is at angle 0 (front position)
    return -packInfo.angle
  }

  // Animation loop - only rotate the wheel, not individual packs
  useFrame((state, delta) => {
    if (!groupRef.current) return

    if (spinning) {
      // Regular spinning
      rotationRef.current += speedRef.current * delta
      groupRef.current.rotation.y = rotationRef.current
    } else if (!wheelStopped) {
      // Start deceleration when spinning stops
      if (!deceleratingRef.current) {
        deceleratingRef.current = true
      }

      // Deceleration
      speedRef.current *= 0.95
      rotationRef.current += speedRef.current * delta
      groupRef.current.rotation.y = rotationRef.current

      // When speed is very low, find the closest pack and snap to it
      if (speedRef.current < 0.05 && !snapAnimationRef.current) {
        // Find the pack at the front (highest Z value)
        const frontPack = findFrontPack()

        // Store the initially selected pack to prevent changing it later
        initialSelectedPackRef.current = frontPack.index

        // Calculate the target rotation to bring this pack to the front
        // We need to rotate the wheel so that the pack is at angle 0 (front position)
        const targetRotation = calculateTargetRotation(frontPack.index)
        targetRotationRef.current = targetRotation
        snapAnimationRef.current = true

        // Set the selected pack state to match the front pack
        setSelectedPack(frontPack.index)
        console.log("Selected pack #", frontPack.index + 1, "with target rotation", targetRotation)
      }

      // Animate to the target rotation if we're in snap animation mode
      if (snapAnimationRef.current) {
        // Ensure target rotation is in the same "revolution" as current rotation
        // to avoid spinning all the way around
        let targetRotation = targetRotationRef.current
        while (targetRotation < rotationRef.current - Math.PI) {
          targetRotation += Math.PI * 2
        }
        while (targetRotation > rotationRef.current + Math.PI) {
          targetRotation -= Math.PI * 2
        }

        // Smoothly interpolate to the target rotation
        const newRotation = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation, 0.1)
        groupRef.current.rotation.y = newRotation
        rotationRef.current = newRotation

        // When we're close enough to the target, stop the wheel
        if (Math.abs(groupRef.current.rotation.y - targetRotation) < 0.01) {
          // Snap exactly to the target rotation
          groupRef.current.rotation.y = targetRotation
          rotationRef.current = targetRotation

          // Check which pack is now at the front, but don't change the selection
          const finalFrontPack = findFrontPack()

          // Only log if there's a discrepancy, but don't change the selection
          if (finalFrontPack.index !== initialSelectedPackRef.current) {
            console.log(
              "Note: Front pack is now #",
              finalFrontPack.index + 1,
              "but keeping selection as #",
              initialSelectedPackRef.current + 1,
            )
          }

          // Mark the wheel as stopped immediately
          setWheelStopped(true)
        }
      }
    }
  })

  return (
    <group ref={groupRef} className="wheel-stopped">
      {/* Create packs in a circle */}
      {Array.from({ length: packCount }).map((_, index) => {
        const angle = ((Math.PI * 2) / packCount) * index
        const x = Math.sin(angle) * radius
        const z = Math.cos(angle) * radius

        // Determine if this is the selected pack
        const isSelected = selectedPack === index

        return (
          <group
            key={index}
            position={[x, 0, z]}
            // This makes the pack always face outward from the center
            rotation={[0, Math.PI + angle, 0]}
            ref={(el) => {
              if (el) {
                // Store reference to this pack
                if (!packRefsRef.current[index]) {
                  packRefsRef.current[index] = el
                }
              }
            }}
          >
            {/* Pack model */}
            <Pack
              gltf={gltf}
              packType={packType}
              isSelected={isSelected}
              isOpening={isOpening && isSelected}
              wheelStopped={wheelStopped}
              index={index}
            />
          </group>
        )
      })}
    </group>
  )
}

// Individual Pack Component
function Pack({ gltf, packType, isSelected, isOpening, wheelStopped, index }) {
  const packRef = useRef<THREE.Group>(null)
  const initialY = useRef(0)
  const isMobile = useMobile()
  const initialScale = useRef(isMobile ? 1.2 : 0.8)
  const targetScale = useRef(isMobile ? 1.2 : 0.8)
  const animationStarted = useRef(false)

  // Update the target scale when selection changes
  useEffect(() => {
    if (isSelected && wheelStopped) {
      targetScale.current = initialScale.current * 1.3 // Enlarge by 30%
      animationStarted.current = true
    } else {
      targetScale.current = initialScale.current
    }
  }, [isSelected, wheelStopped])

  // Add refs for the pack top and body parts
  const packTopRef = useRef<THREE.Group>(null)
  const packBodyRef = useRef<THREE.Group>(null)
  const hasInitializedParts = useRef(false)
  const animationStartTime = useRef(0)

  // Handle floating animation and pack opening animation
  useFrame((state) => {
    if (!packRef.current) return

    if (isOpening) {
      // Log once when animation starts
      if (!hasInitializedParts.current) {
        console.log("Animating pack #", index + 1, "isSelected:", isSelected)
        hasInitializedParts.current = true
        animationStartTime.current = state.clock.getElapsedTime()
      }

      // Animate the pack - drastically increased upward speed
      const animationTime = state.clock.getElapsedTime() - animationStartTime.current

      // Main pack shoots up very quickly
      packRef.current.position.y += 0.1

      // Add some rotation for visual interest
      packRef.current.rotation.y += 0.1

      // Scale down slightly as it flies up
      const scaleDown = Math.max(0.5, 1 - animationTime * 0.5)
      packRef.current.scale.set(
        initialScale.current * scaleDown,
        initialScale.current * scaleDown,
        initialScale.current * scaleDown,
      )
    } else {
      // Reset animation state when not opening
      hasInitializedParts.current = false

      // Regular floating animation when not opening
      const floatOffset = Math.sin(state.clock.getElapsedTime() + index) * 0.1

      // Handle scale animation for selected pack
      if (packRef.current.scale.x !== targetScale.current) {
        // Smoothly animate to target scale
        const newScale = THREE.MathUtils.lerp(
          packRef.current.scale.x,
          targetScale.current,
          isSelected && wheelStopped ? 0.1 : 0.05,
        )

        packRef.current.scale.set(newScale, newScale, newScale)

        // Add a subtle bounce effect when enlarging
        if (isSelected && wheelStopped && animationStarted.current) {
          // Add a subtle up and down motion during the scale animation
          const scaleProgress = (newScale - initialScale.current) / (targetScale.current - initialScale.current)
          if (scaleProgress > 0 && scaleProgress < 1) {
            // Create a bounce effect that peaks in the middle and returns to normal
            const bounceOffset = Math.sin(scaleProgress * Math.PI) * 0.2
            // Apply bounce but preserve any shake effect
            packRef.current.position.y = initialY.current + floatOffset + bounceOffset
          }
        }
      }

      // Add subtle jiggle/shake animation when selected but not opening yet
      if (isSelected && wheelStopped) {
        // Create a more subtle shake effect
        const shakeX = Math.sin(state.clock.getElapsedTime() * 12) * 0.01
        const shakeY = Math.cos(state.clock.getElapsedTime() * 10) * 0.008
        const shakeZ = Math.sin(state.clock.getElapsedTime() * 8 + 1) * 0.005

        // Apply the shake effect to position, but keep the base position at 0.1
        packRef.current.position.x = 0.1 + shakeX
        // Y position is already handled by floating and bounce animations
        packRef.current.position.y = packRef.current.position.y + shakeY
        packRef.current.position.z = packRef.current.position.z + shakeZ

        // Also add some very subtle rotation shake
        packRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 6) * 0.02
        packRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 5) * 0.02
      } else {
        // Regular position for non-selected packs
        packRef.current.position.set(0.1, initialY.current + floatOffset, packRef.current.position.z)

        // Reset any rotation that might have been applied
        packRef.current.rotation.x = 0
        packRef.current.rotation.z = 0
      }
    }
  })

  // Set initial position and scale
  useEffect(() => {
    if (packRef.current) {
      initialY.current = packRef.current.position.y
      initialScale.current = isMobile ? 1.2 : 0.8
      targetScale.current = initialScale.current
      packRef.current.scale.set(initialScale.current, initialScale.current, initialScale.current)
    }
  }, [isMobile])

  // Get pack color based on type
  const getPackColor = () => {
    switch (packType) {
      case "basic":
        return new THREE.Color(0xcccccc)
      case "premium":
        return new THREE.Color(0x3b82f6)
      case "ultimate":
        return new THREE.Color(0xa855f7)
    }
  }

  if (!gltf) return null

  return (
    <group ref={packRef} position={[0.1, 0, 0]}>
      <primitive
        object={gltf.scene.clone()}
        // Fixed rotation to stand upright and face outward
        rotation={[Math.PI / 2, Math.PI * 1.5, 0]}
      />

      {/* Glow effect for selected pack */}
      {isSelected && <pointLight position={[0, 0, 0]} distance={2} intensity={1} color={getPackColor()} />}

      {/* Add particles/sparkles when opening the pack */}
      {isOpening && (
        <>
          <PackOpeningParticles color={getPackColor()} />
          <pointLight position={[0, 0.3, 0]} distance={3} intensity={2} color={getPackColor()} />
        </>
      )}

      {/* Add a pulsing glow effect when selected and wheel stopped */}
      {isSelected && wheelStopped && !isOpening && <PulsingGlow color={getPackColor()} />}
    </group>
  )
}

// Add a new component for the pulsing glow effect
function PulsingGlow({ color }) {
  const pulseRef = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    if (pulseRef.current) {
      // Create a pulsing effect by varying the intensity
      const intensity = 1 + Math.sin(state.clock.getElapsedTime() * 3) * 0.5
      pulseRef.current.intensity = intensity

      // Also vary the distance slightly
      pulseRef.current.distance = 2 + Math.sin(state.clock.getElapsedTime() * 2) * 0.5
    }
  })

  return (
    <>
      <pointLight ref={pulseRef} position={[0, 0, 0]} distance={2} intensity={1} color={color} />
      {/* Add a subtle ambient light to enhance the glow */}
      <ambientLight intensity={0.2} color={color} />
    </>
  )
}

