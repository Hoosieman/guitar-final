export interface Note {
  id: string
  color: string
  y: number
  hit: boolean
  missed: boolean
  timestamp?: number // Add timestamp property
  duration?: number // Add duration property for sustained notes
}

// Generate a random note
const createRandomNote = (colors: string[], startY = -50): Note => {
  return {
    id: Math.random().toString(36).substring(2, 9),
    color: colors[Math.floor(Math.random() * colors.length)],
    y: startY - Math.random() * 200,
    hit: false,
    missed: false,
  }
}

// Generate a batch of random notes
export const generateRandomNotes = (count: number, colors: string[], songId?: string, difficulty?: string): Note[] => {
  const notes: Note[] = []
  let lastY = -50

  // If we have a songId, use it to seed the pattern
  // This ensures the same song always generates the same pattern
  const songSeed = songId ? hashString(songId) : Math.random() * 1000

  // Adjust spacing and complexity based on difficulty
  let spacing = 100
  let randomness = 150
  let colorComplexity = 1

  if (difficulty) {
    switch (difficulty) {
      case "easy":
        spacing = 150
        randomness = 100
        colorComplexity = 0.7
        break
      case "medium":
        spacing = 120
        randomness = 130
        colorComplexity = 0.85
        break
      case "hard":
        spacing = 90
        randomness = 160
        colorComplexity = 1.1
        break
      case "expert":
        spacing = 70
        randomness = 180
        colorComplexity = 1.3
        break
    }
  }

  // Use the song ID to create a pseudo-random but consistent pattern
  const pseudoRandom = createPseudoRandom(songSeed)

  for (let i = 0; i < count; i++) {
    // Space notes out vertically
    lastY -= spacing + pseudoRandom() * randomness

    // Select color based on song pattern and difficulty
    let colorIndex

    if (songId) {
      // Create more complex patterns for harder difficulties
      // For easier difficulties, use fewer colors
      const availableColors = Math.max(1, Math.floor(colors.length * colorComplexity))
      colorIndex = Math.floor(pseudoRandom() * availableColors)

      // For expert, occasionally add chord-like patterns (multiple notes at same Y)
      if (difficulty === "expert" && pseudoRandom() < 0.15 && i < count - 1) {
        const chordNote = {
          id: Math.random().toString(36).substring(2, 9),
          color: colors[(colorIndex + 1 + Math.floor(pseudoRandom() * (colors.length - 1))) % colors.length],
          y: lastY,
          hit: false,
          missed: false,
        }
        notes.push(chordNote)
      }
    } else {
      // Fallback to completely random if no song ID
      colorIndex = Math.floor(Math.random() * colors.length)
    }

    const note = {
      id: Math.random().toString(36).substring(2, 9),
      color: colors[colorIndex % colors.length],
      y: lastY,
      hit: false,
      missed: false,
    }

    notes.push(note)
  }

  return notes
}

// Create a simple hash from a string
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

// Create a pseudo-random number generator with a seed
function createPseudoRandom(seed: number) {
  return () => {
    // Simple LCG (Linear Congruential Generator)
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

