// Define shared types used across components
export interface Note {
  id: string
  color: string
  y: number
  timestamp: number
  hit: boolean
  missed: boolean
  duration?: number
}

export interface HitEffect {
  x: number
  y: number
  color: string
  frame: number
}

export interface AccuracyStats {
  perfect: number
  great: number
  good: number
  missed: number
}

export interface GameDimensions {
  width: number
  height: number
  fretY: number
}

export interface GuitarHeroProps {
  onBack: () => void
  onComplete: (score: number) => void
  gameCompleted?: boolean
  finalScore?: number
}

export interface FretInfo {
  color: string
  key: string
  keyCode: number
}

// Constants
export const HIT_THRESHOLD = 30
export const MAX_MISSES = 10
export const NOTE_SPEED = 300 // pixels per second (not per frame)
export const FRETS: FretInfo[] = [
  { color: "green", key: "a", keyCode: 65 },
  { color: "red", key: "s", keyCode: 83 },
  { color: "yellow", key: "j", keyCode: 74 },
  { color: "blue", key: "k", keyCode: 75 },
  { color: "orange", key: "l", keyCode: 76 },
]

// Highway constants
export const HIGHWAY_TOP_WIDTH_RATIO = 0.33
export const HIGHWAY_BOTTOM_WIDTH_RATIO = 1.2
export const PERSPECTIVE_START_Y_RATIO = 0.4

// Sound effects
export const MISS_SOUND = "sound-effects/miss-note-1.mp3"
