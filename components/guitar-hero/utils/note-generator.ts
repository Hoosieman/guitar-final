import { type Note, FRETS } from "../types"

// Function to generate random notes
export const generateRandomNotes = (count: number): Note[] => {
  const notes: Note[] = []
  const colors = FRETS.map((f) => f.color)

  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)]
    const timestamp = Math.random() * 10000 // Random timestamp up to 10 seconds
    notes.push({
      id: Math.random().toString(36).substring(2, 9),
      color: color,
      y: -100, // Start off-screen
      timestamp: timestamp,
      hit: false,
      missed: false,
    })
  }
  return notes
}

// Calculate note position based on timestamp, current time, fret position, and note speed
export const calculateNotePosition = (
  timestamp: number,
  currentTime: number,
  fretY: number,
  noteSpeed: number,
): number => {
  const timeDifference = timestamp - currentTime
  // Convert time difference (ms) to seconds and multiply by pixels per second
  return fretY - (timeDifference / 1000) * noteSpeed
}
