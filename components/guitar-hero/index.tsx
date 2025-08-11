"use client"

import { useEffect, useRef, useState } from "react"
import { useGameState } from "@/hooks/use-game-state"
import { useMobile } from "@/hooks/use-mobile"
import { createHighwayTexture } from "@/lib/highway-texture"
import FretButton from "./components/fret-button"
import GameUI from "./components/game-ui"
import { type Note, type HitEffect, type GameDimensions, type GuitarHeroProps, FRETS, MISS_SOUND } from "./types"
import { generateRandomNotes } from "./utils/note-generator"
import { calculateLanePositions } from "./utils/perspective"
import { loadChartFile } from "./utils/chart-loader"
import { calculateAccuracy } from "./utils/scoring"
import { drawHighwayBackground, drawHighwayLines } from "./renderers/highway-renderer"
import { drawNotes, drawHitEffects } from "./renderers/note-renderer"
import { checkMissedNotes, updateVisibleNotes } from "./game-logic"
import { useNoteDetection } from "./hooks/use-note-detection"
import { useKeyPress } from "@/hooks/use-key-press"

export default function GuitarHero({ onBack, onComplete, gameCompleted = false, finalScore = 0 }: GuitarHeroProps) {
  const { selectedSong } = useGameState()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const highwayBgCanvasRef = useRef<HTMLCanvasElement>(null)
  const highwayLinesCanvasRef = useRef<HTMLCanvasElement>(null)
  const notesCanvasRef = useRef<HTMLCanvasElement>(null)
  const effectsCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const notesRef = useRef<Note[]>([])
  const visibleNotesRef = useRef<Note[]>([]) // Separate array for visible notes
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(gameCompleted)
  const [gameFailed, setGameFailed] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [activeFrets, setActiveFrets] = useState<Record<string, boolean>>({})
  const hitEffectsRef = useRef<HitEffect[]>([])
  const [highwayTexture, setHighwayTexture] = useState<HTMLCanvasElement | null>(null)
  const songProgressRef = useRef(0)
  const missCountRef = useRef(0)
  const [showMissWarning, setShowMissWarning] = useState(false)
  const accuracyStatsRef = useRef({ perfect: 0, great: 0, good: 0, missed: 0 })
  const [rewardsGiven, setRewardsGiven] = useState(false)
  const [gameDimensions, setGameDimensions] = useState<GameDimensions>({
    width: 800,
    height: 600,
    fretY: 500,
  })
  const isMobile = useMobile()
  const lastTimeRef = useRef<number | null>(null)
  const animationFrameIdRef = useRef<number | null>(null)
  const songTimeRef = useRef(0)
  const [currentSection, setCurrentSection] = useState<string>("")
  const frameTimesRef = useRef<number[]>([])
  const horizontalLinePositionsRef = useRef<number[]>([])
  const lanePositionsRef = useRef<number[]>([])
  const heldNotesRef = useRef<Record<string, { noteId: string; startTime: number }>>({})
  const [sustainedNotes, setSustainedNotes] = useState<string[]>([])
  const [emeralds, setEmeralds] = useState(0)

  // Track when highway background needs redrawing
  const highwayBgNeedsRedraw = useRef(true)

  // Audio context for better timing
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const startTimeRef = useRef<number>(0)
  const lastFrameTimeRef = useRef<number>(0)

  // Add a ref for the miss sound audio element
  const missSoundRef = useRef<HTMLAudioElement | null>(null)

  // In the component, add a new ref to track the horizontal line positions offset
  const horizontalLineOffsetRef = useRef(0)

  // Ref to store previous key states
  const prevStateRef = useRef<Record<string, boolean>>({})

  // Use the note detection hook
  const { handleFretPress, handleFretRelease } = useNoteDetection(
    gameDimensions,
    isMobile,
    score,
    setScore,
    combo,
    setCombo,
    maxCombo,
    setMaxCombo,
    setFeedback,
    setEmeralds,
    accuracyStatsRef,
    hitEffectsRef,
    heldNotesRef,
    sustainedNotes,
    setSustainedNotes,
  )

  // Setup canvas layers
  const setupCanvasLayers = () => {
    if (!containerRef.current) return

    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight

    // Setup main canvas (will be used as the composite canvas)
    if (canvasRef.current) {
      canvasRef.current.width = containerWidth
      canvasRef.current.height = containerHeight
    }

    // Setup highway background canvas
    if (highwayBgCanvasRef.current) {
      highwayBgCanvasRef.current.width = containerWidth
      highwayBgCanvasRef.current.height = containerHeight
    }

    // Setup highway lines canvas
    if (highwayLinesCanvasRef.current) {
      highwayLinesCanvasRef.current.width = containerWidth
      highwayLinesCanvasRef.current.height = containerHeight
    }

    // Setup notes canvas
    if (notesCanvasRef.current) {
      notesCanvasRef.current.width = containerWidth
      notesCanvasRef.current.height = containerHeight
    }

    // Setup effects canvas
    if (effectsCanvasRef.current) {
      effectsCanvasRef.current.width = containerWidth
      effectsCanvasRef.current.height = containerHeight
    }

    // Mark highway background for redraw when dimensions change
    highwayBgNeedsRedraw.current = true
  }

  // Calculate lane positions once and store them
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth
        const containerHeight = containerRef.current.clientHeight

        // Adjust the fret position to be in the lower part of the screen
        const fretY = containerHeight * 0.9

        setGameDimensions({
          width: containerWidth,
          height: containerHeight,
          fretY: fretY,
        })

        // Setup all canvas layers
        setupCanvasLayers()

        const { horizontalLinePositions, lanePositions } = calculateLanePositions(
          containerWidth,
          containerHeight,
          fretY,
          isMobile,
        )

        horizontalLinePositionsRef.current = horizontalLinePositions
        lanePositionsRef.current = lanePositions

        // Create highway texture
        const texture = createHighwayTexture(containerWidth, containerHeight)
        setHighwayTexture(texture)
      }
    }

    // Update dimensions initially and on resize
    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [isMobile])

  useEffect(() => {
    if (gameCompleted && finalScore > 0) {
      setScore(finalScore)
      setGameOver(true)
    }
  }, [gameCompleted, finalScore])

  // Key handling using the useKeyPress hooks
  const greenKeyPressed = useKeyPress(FRETS[0].keyCode)
  const redKeyPressed = useKeyPress(FRETS[1].keyCode)
  const yellowKeyPressed = useKeyPress(FRETS[2].keyCode)
  const blueKeyPressed = useKeyPress(FRETS[3].keyCode)
  const orangeKeyPressed = useKeyPress(FRETS[4].keyCode)

  // Previous key states for detecting changes
  const prevKeyStatesRef = useRef({
    green: false,
    red: false,
    yellow: false,
    blue: false,
    orange: false,
  })

  // Update activeFrets state based on key states
  useEffect(() => {
    setActiveFrets({
      green: greenKeyPressed,
      red: redKeyPressed,
      yellow: yellowKeyPressed,
      blue: blueKeyPressed,
      orange: orangeKeyPressed,
    })
  }, [greenKeyPressed, redKeyPressed, yellowKeyPressed, blueKeyPressed, orangeKeyPressed])

  // Process key presses for note detection
  useEffect(() => {
    if (!gameStarted || gameOver || gameFailed) return

    // Check each fret for state changes
    const checkFret = (color: string, isPressed: boolean) => {
      if (isPressed !== prevKeyStatesRef.current[color as keyof typeof prevKeyStatesRef.current]) {
        if (isPressed) {
          // Key was just pressed
          handleFretPress(color, visibleNotesRef.current, songTimeRef.current)
        }
        // We no longer need to handle key releases

        // Update previous state
        prevKeyStatesRef.current[color as keyof typeof prevKeyStatesRef.current] = isPressed
      }
    }

    // Check each fret
    checkFret("green", greenKeyPressed)
    checkFret("red", redKeyPressed)
    checkFret("yellow", yellowKeyPressed)
    checkFret("blue", blueKeyPressed)
    checkFret("orange", orangeKeyPressed)
  }, [
    gameStarted,
    gameOver,
    gameFailed,
    greenKeyPressed,
    redKeyPressed,
    yellowKeyPressed,
    blueKeyPressed,
    orangeKeyPressed,
    handleFretPress,
  ])

  // Cleanup effect for audio
  useEffect(() => {
    // Initialize miss sound
    if (typeof window !== "undefined") {
      missSoundRef.current = new Audio(MISS_SOUND)
      missSoundRef.current.volume = 1.0 // Set volume to 100%
    }

    return () => {
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.stop()
          audioSourceRef.current = null
        } catch (e) {
          console.error("Error stopping audio on cleanup:", e)
        }
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch((e) => console.error("Error closing audio context:", e))
        audioContextRef.current = null
      }
    }
  }, [])

  // Modify the game loop to use a more consistent timing approach
  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver || gameFailed) {
      return () => {
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current)
          animationFrameIdRef.current = null
        }
      }
    }

    // Get all canvas contexts
    const mainCanvas = canvasRef.current
    const highwayBgCanvas = highwayBgCanvasRef.current
    const highwayLinesCanvas = highwayLinesCanvasRef.current
    const notesCanvas = notesCanvasRef.current
    const effectsCanvas = effectsCanvasRef.current

    const mainCtx = mainCanvas?.getContext("2d", { alpha: false })
    const highwayBgCtx = highwayBgCanvas?.getContext("2d", { alpha: false })
    const highwayLinesCtx = highwayLinesCanvas?.getContext("2d", { alpha: true })
    const notesCtx = notesCanvas?.getContext("2d", { alpha: true })
    const effectsCtx = effectsCanvas?.getContext("2d", { alpha: true })

    if (
      !mainCanvas ||
      !mainCtx ||
      !highwayBgCanvas ||
      !highwayBgCtx ||
      !highwayLinesCanvas ||
      !highwayLinesCtx ||
      !notesCanvas ||
      !notesCtx ||
      !effectsCanvas ||
      !effectsCtx
    )
      return

    // Create a new audio context if it doesn't exist
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitContext)()
      } catch (e) {
        console.error("Failed to create audio context:", e)
      }
    }

    // Track the last time for delta time calculation
    let lastTime = performance.now()

    // Use a fixed time step for more consistent animation
    const fixedTimeStep = 1000 / 120 // Target 120 updates per second for smooth animation
    let accumulator = 0

    // Create a separate object to store game state that needs to be updated frequently
    // This avoids React state updates during the animation loop
    const gameState = {
      visibleNotes: [] as Note[],
      hitEffects: hitEffectsRef.current,
      songTime: songTimeRef.current,
      missCount: missCountRef.current,
      showMissWarning: showMissWarning,
    }

    // Use requestAnimationFrame timestamp for smoother animation
    const render = (timestamp: number) => {
      // Calculate delta time in seconds since last frame
      // Cap the delta time to prevent large jumps after tab switching or slowdowns
      const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1) // Cap at 100ms
      lastTime = timestamp

      // Accumulate time for fixed time step
      accumulator += deltaTime * 1000 // Convert to ms

      // Update song time from audio context for more accurate timing
      if (audioContextRef.current && startTimeRef.current > 0) {
        gameState.songTime = (audioContextRef.current.currentTime - startTimeRef.current) * 1000
        songTimeRef.current = gameState.songTime
      }

      // Clear main canvas
      mainCtx.fillStyle = "#111"
      mainCtx.fillRect(0, 0, gameDimensions.width, gameDimensions.height)

      // Clear the dynamic canvases (with transparency)
      highwayLinesCtx.clearRect(0, 0, gameDimensions.width, gameDimensions.height)
      notesCtx.clearRect(0, 0, gameDimensions.width, gameDimensions.height)
      effectsCtx.clearRect(0, 0, gameDimensions.width, gameDimensions.height)

      // Only redraw highway background when needed (dimensions changed or other triggers)
      if (highwayBgNeedsRedraw.current) {
        highwayBgCtx.clearRect(0, 0, gameDimensions.width, gameDimensions.height)

        // Draw static parts of the highway
        drawHighwayBackground(
          highwayBgCtx,
          gameDimensions,
          isMobile,
          highwayTexture,
          songProgressRef,
          missCountRef,
          showMissWarning,
          currentSection,
        )

        highwayBgNeedsRedraw.current = false
      }

      // Use fixed time step for more consistent updates
      while (accumulator >= fixedTimeStep) {
        // Calculate the fixed delta time in seconds
        const fixedDeltaTime = fixedTimeStep / 1000

        // Draw the moving horizontal lines on every frame
        drawHighwayLines(highwayLinesCtx, gameDimensions, isMobile, horizontalLineOffsetRef)

        // Update visible notes - filter from main notes array
        // This is now completely time-based, not frame-based
        const visibleNotes = updateVisibleNotes(
          fixedDeltaTime,
          notesRef,
          visibleNotesRef,
          gameState.songTime,
          gameDimensions,
          horizontalLineOffsetRef,
        )
        gameState.visibleNotes = visibleNotes

        // Check for missed notes
        checkMissedNotes(
          gameState.visibleNotes,
          notesRef,
          gameState.songTime,
          gameDimensions.fretY,
          missCountRef,
          setCombo,
          setFeedback,
          setShowMissWarning,
          accuracyStatsRef,
          missSoundRef,
          failGame,
          sustainedNotes,
          heldNotesRef,
          highwayBgNeedsRedraw,
        )

        // Update hit effects
        hitEffectsRef.current = drawHitEffects(effectsCtx, gameState.hitEffects, fixedDeltaTime, gameDimensions.height)

        // Reduce the accumulator by the fixed time step
        accumulator -= fixedTimeStep
      }

      // Draw notes on the notes canvas - this happens every frame for smooth rendering
      drawNotes(
        notesCtx,
        gameState.visibleNotes,
        gameDimensions,
        isMobile,
        gameState.songTime,
        heldNotesRef,
        sustainedNotes,
      )

      // Composite all layers onto the main canvas
      mainCtx.drawImage(highwayBgCanvas, 0, 0)
      mainCtx.drawImage(highwayLinesCanvas, 0, 0)
      mainCtx.drawImage(notesCanvas, 0, 0)
      mainCtx.drawImage(effectsCanvas, 0, 0)

      // Continue animation loop - store the ID so we can cancel it if needed
      const animationFrameId = requestAnimationFrame(render)
      animationFrameIdRef.current = animationFrameId
    }

    // Start the animation loop
    const animationFrameId = requestAnimationFrame(render)
    animationFrameIdRef.current = animationFrameId

    // Cleanup
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
        animationFrameIdRef.current = null
      }
    }
  }, [
    gameStarted,
    gameOver,
    gameFailed,
    gameDimensions,
    isMobile,
    highwayTexture,
    showMissWarning,
    currentSection,
    sustainedNotes,
  ])

  // Start the game
  const startGame = async () => {
    // Clear any existing state
    notesRef.current = []
    visibleNotesRef.current = []
    setGameStarted(false)
    setGameOver(false)
    setGameFailed(false)
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    songProgressRef.current = 0
    missCountRef.current = 0
    songTimeRef.current = 0
    setShowMissWarning(false)
    accuracyStatsRef.current = { perfect: 0, great: 0, good: 0, missed: 0 }
    setRewardsGiven(false)
    lastTimeRef.current = null
    hitEffectsRef.current = []
    heldNotesRef.current = {}
    setSustainedNotes([])
    setEmeralds(0)

    // Mark highway background for redraw
    highwayBgNeedsRedraw.current = true

    // Add a flag to track if the song has ended to prevent multiple endGame calls
    const songEndedRef = { current: false }

    // Stop any existing audio
    if (audioSourceRef.current) {
      audioSourceRef.current.stop()
      audioSourceRef.current = null
    }

    // If existing audio context, close it
    if (audioContextRef.current) {
      await audioContextRef.current.close().catch((e) => console.error("Error closing audio context:", e))
      audioContextRef.current = null
    }

    if (selectedSong?.chartFile) {
      const chartPath = `/charts/${selectedSong.chartFile}`
      const audioPath = selectedSong.audioFile || `house-of-the-rising-sun.mp3`

      const chartData = await loadChartFile(chartPath, audioPath, selectedSong.difficulty || "medium")

      if (chartData) {
        // Set notes with ALL notes from the chart
        notesRef.current = chartData.chartNotes
        audioContextRef.current = chartData.audioContext

        // Start the game
        setGameStarted(true)

        // Start audio with Web Audio API after a short delay
        setTimeout(() => {
          try {
            if (chartData.audioBuffer && audioContextRef.current) {
              // Create a new source node
              const source = audioContextRef.current.createBufferSource()
              source.buffer = chartData.audioBuffer
              source.connect(audioContextRef.current.destination)

              // Add an onended event handler to detect when the song finishes
              source.onended = () => {
                if (!songEndedRef.current) {
                  songEndedRef.current = true
                  // Add a delay before showing the success screen
                  setTimeout(() => {
                    endGame()
                  }, 2000)
                }
              }

              // Start playback with accurate timing
              source.start(0)
              audioSourceRef.current = source

              // Track playback time
              startTimeRef.current = audioContextRef.current.currentTime

              // Store the total duration for progress calculation
              const totalDuration = chartData.audioBuffer.duration

              // Create a separate interval for updating progress
              const progressInterval = setInterval(() => {
                if (audioContextRef.current && !songEndedRef.current && !gameOver && !gameFailed) {
                  const currentTime = audioContextRef.current.currentTime - startTimeRef.current

                  // Update song time in milliseconds
                  songTimeRef.current = currentTime * 1000

                  // Update progress as percentage (0-100)
                  const newProgress = (currentTime / totalDuration) * 100

                  // Mark highway background for redraw when progress changes significantly
                  if (Math.floor(newProgress) !== Math.floor(songProgressRef.current)) {
                    highwayBgNeedsRedraw.current = true
                  }

                  songProgressRef.current = newProgress

                  // Check if song is about to finish
                  if (currentTime >= totalDuration - 0.5) {
                    clearInterval(progressInterval)
                    if (!songEndedRef.current) {
                      songEndedRef.current = true
                      // Add a delay before showing the success screen
                      setTimeout(() => {
                        endGame()
                      }, 2000)
                    }
                  }
                } else {
                  // Clear interval if game is over or failed
                  clearInterval(progressInterval)
                }
              }, 100) // Update progress 10 times per second

              // Store the interval ID for cleanup
              const progressIntervalId = progressInterval

              // Clean up interval on component unmount
              return () => {
                clearInterval(progressIntervalId)
              }
            }
          } catch (e) {
            console.error("Error starting audio:", e)
          }
        }, 1000)
      } else {
        // Fall back to random notes if loading fails
        const noteCount = 100 // Increased from 20 to 100
        notesRef.current = generateRandomNotes(noteCount)
        setGameStarted(true)
      }
    } else {
      // Use random notes if no chart file
      const noteCount = 100 // Increased from 20 to 100
      notesRef.current = generateRandomNotes(noteCount)
      setGameStarted(true)
    }
  }

  // End game
  const endGame = () => {
    if (gameOver) return

    // Stop audio
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop()
        audioSourceRef.current = null
      } catch (e) {
        console.error("Error stopping audio:", e)
      }
    }

    // Clear any held notes
    heldNotesRef.current = {}

    setGameOver(true)
    if (!rewardsGiven) {
      onComplete(score)
      setRewardsGiven(true)
    }
  }

  // Fail game
  const failGame = () => {
    // Stop audio
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop()
        audioSourceRef.current = null
      } catch (e) {
        console.error("Error stopping audio:", e)
      }
    }

    // Clear any held notes
    heldNotesRef.current = {}

    setGameFailed(true)
  }

  // Update highway when certain states change
  useEffect(() => {
    highwayBgNeedsRedraw.current = true
  }, [showMissWarning, currentSection])

  return (
    <div className="flex flex-col items-center">
      <GameUI
        onBack={onBack}
        selectedSong={selectedSong}
        emeralds={emeralds}
        score={score}
        combo={combo}
        maxCombo={maxCombo}
        feedback={feedback}
        gameStarted={gameStarted}
        gameOver={gameOver}
        gameFailed={gameFailed}
        startGame={startGame}
        accuracyStats={accuracyStatsRef.current}
        onComplete={onComplete}
        rewardsGiven={rewardsGiven}
        setRewardsGiven={setRewardsGiven}
        calculateAccuracy={() => calculateAccuracy(accuracyStatsRef.current)}
      />

      <div
        className="relative w-full h-full flex-grow overflow-hidden"
        style={{ height: "calc(100vh - 140px)" }}
        ref={containerRef}
      >
        {/* Simple black background */}
        <div className="absolute inset-0 bg-black z-0"></div>

        {/* Main canvas - visible to user */}
        <canvas
          ref={canvasRef}
          width={gameDimensions.width}
          height={gameDimensions.height}
          className="relative z-10"
          style={{
            display: "block",
            position: "relative",
            left: "50%",
            transform: "translateX(-50%)",
            width: isMobile ? "100%" : "auto",
            height: "100%",
          }}
        />

        {/* Hidden canvases for layered rendering */}
        <div className="hidden">
          <canvas ref={highwayBgCanvasRef} width={gameDimensions.width} height={gameDimensions.height} />
          <canvas ref={highwayLinesCanvasRef} width={gameDimensions.width} height={gameDimensions.height} />
          <canvas ref={notesCanvasRef} width={gameDimensions.width} height={gameDimensions.height} />
          <canvas ref={effectsCanvasRef} width={gameDimensions.width} height={gameDimensions.height} />
        </div>

        <div
          className="absolute left-1/2 transform -translate-x-1/2 z-20"
          style={{ width: `${gameDimensions.width}px`, top: `${gameDimensions.fretY - 25}px` }}
        >
          {FRETS.map((fret, index) => {
            const xPosition =
              lanePositionsRef.current[index] ||
              (gameDimensions.width / FRETS.length) * index + gameDimensions.width / FRETS.length / 2

            // Check if this fret has a held note
            const isHeld = Boolean(heldNotesRef.current[fret.color])

            // Create a click handler for this fret
            const handleFretClick = () => {
              // Simulate key press and release
              const color = fret.color

              // Process the note hit
              handleFretPress(color, visibleNotesRef.current, songTimeRef.current)

              // No need to manually update activeFrets state as it's now controlled by the useKeyPress hooks
              // We'll just add a visual feedback for clicks
              const tempActiveFrets = { ...activeFrets }
              tempActiveFrets[color] = true
              setActiveFrets(tempActiveFrets)

              // Reset the visual state after a short delay
              setTimeout(() => {
                const resetActiveFrets = { ...activeFrets }
                resetActiveFrets[color] = false
                setActiveFrets(resetActiveFrets)
              }, 100)
            }

            return (
              <div
                key={fret.color}
                className="absolute"
                style={{
                  left: `${xPosition}px`,
                  transform: "translate(-50%, 0)",
                }}
              >
                <FretButton
                  color={fret.color}
                  keyLabel={fret.key.toUpperCase()}
                  active={activeFrets[fret.color] || false}
                  isHeld={isHeld}
                  onClick={handleFretClick}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
