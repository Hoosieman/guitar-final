import type React from "react"
import { type Note, HIT_THRESHOLD, MAX_MISSES, NOTE_SPEED } from "./types"

// Check for missed notes
export const checkMissedNotes = (
  visibleNotes: Note[],
  notesRef: React.MutableRefObject<Note[]>,
  songTime: number,
  fretY: number,
  missCountRef: React.MutableRefObject<number>,
  setCombo: (combo: number) => void,
  setFeedback: (feedback: string) => void,
  setShowMissWarning: (show: boolean) => void,
  accuracyStatsRef: React.MutableRefObject<{ perfect: number; great: number; good: number; missed: number }>,
  missSoundRef: React.MutableRefObject<HTMLAudioElement | null>,
  failGame: () => void,
  sustainedNotes: string[],
  heldNotesRef: React.MutableRefObject<Record<string, { noteId: string; startTime: number }>>,
  highwayBgNeedsRedraw: React.MutableRefObject<boolean>,
) => {
  let missedNotes = false
  const currentTime = songTime

  // Pre-calculate values used in the loop
  const missThreshold = fretY + HIT_THRESHOLD
  const timeThreshold = 200

  // Use a for loop with direct array access instead of forEach
  for (let i = 0; i < visibleNotes.length; i++) {
    const note = visibleNotes[i]

    // Only check for regular notes that haven't been hit yet
    if ((note.y > missThreshold || currentTime > note.timestamp + timeThreshold) && !note.hit && !note.missed) {
      note.missed = true
      missedNotes = true

      // Update the original note in the main array - use direct access
      for (let j = 0; j < notesRef.current.length; j++) {
        if (notesRef.current[j].id === note.id) {
          notesRef.current[j].missed = true
          break
        }
      }

      // Update stats
      accuracyStatsRef.current.missed += 1
    }
  }

  if (missedNotes) {
    // Batch state updates
    missCountRef.current += 1

    // Mark highway background for redraw to update hearts
    highwayBgNeedsRedraw.current = true

    // Play miss sound
    if (missSoundRef.current) {
      missSoundRef.current.currentTime = 0
      missSoundRef.current.play().catch((e) => console.error("Error playing miss sound:", e))
    }

    // Batch UI updates in a single requestAnimationFrame
    requestAnimationFrame(() => {
      setCombo(0)
      setFeedback("MISS!")

      // Check for failure
      if (missCountRef.current >= MAX_MISSES) {
        failGame()
      }

      // Show warning
      if (missCountRef.current >= MAX_MISSES - 3) {
        setShowMissWarning(true)
      }

      setTimeout(() => {
        setFeedback((current) => (current === "MISS!" ? "" : current))
      }, 500)
    })
  }
}

// Update visible notes based on time
export const updateVisibleNotes = (
  deltaTime: number,
  notesRef: React.MutableRefObject<Note[]>,
  visibleNotesRef: React.MutableRefObject<Note[]>,
  songTime: number,
  gameDimensions: { width: number; height: number; fretY: number },
  horizontalLineOffsetRef: React.MutableRefObject<number>,
) => {
  const { height: gameHeight, fretY } = gameDimensions
  const perspectiveStartY = gameHeight * 0.4 // PERSPECTIVE_START_Y_RATIO
  const timeWindow = 5000 // 5 seconds window

  // Use a single pass to filter and update notes
  const visibleNotes: Note[] = []
  const currentTime = songTime

  // Use direct array access instead of filter
  for (let i = 0; i < notesRef.current.length; i++) {
    const note = notesRef.current[i]

    // Only process notes that are relevant to the current time window
    // Different handling for hit vs missed notes
    const isRelevant =
      // Regular notes that haven't been hit or missed yet
      (!note.hit && !note.missed && note.timestamp < currentTime + timeWindow) ||
      // Hit notes - only keep visible briefly for the hit effect
      (note.hit && !note.missed && !note.duration && note.timestamp > currentTime - 200) ||
      // Missed notes - keep visible longer as they continue down the highway
      (note.missed && note.timestamp > currentTime - 500) ||
      // Sustained notes - special handling for held notes
      (note.hit &&
        !note.missed &&
        note.duration &&
        note.duration > 200 &&
        currentTime < note.timestamp + note.duration + 200)

    if (isRelevant) {
      // Calculate position directly based on time difference with improved interpolation for smoother movement
      const timeDifference = note.timestamp - currentTime
      const targetY = gameDimensions.fretY - (timeDifference / 1000) * NOTE_SPEED

      // If the note already has a Y position, use improved interpolation
      if (note.y !== -100) {
        // -100 is the initial position
        // Use a higher interpolation factor for smoother movement
        // Higher values (closer to 1) make movement more responsive
        // We'll use deltaTime to make the interpolation frame-rate independent
        const interpolationFactor = Math.min(1, 12 * deltaTime) // 12 is a smoothing constant

        // Special handling for notes that have been hit or missed
        if (note.missed && targetY >= fretY) {
          // For missed notes past the fret line, move them at a consistent speed
          note.y += NOTE_SPEED * deltaTime * 0.5 // Move at half speed after being missed
        } else if (note.hit && !note.duration && targetY >= fretY) {
          // For hit notes (non-sustained) past the fret line, move them faster to disappear quickly
          note.y += NOTE_SPEED * deltaTime * 2.0 // Move at double speed to disappear quickly
        } else {
          // Normal interpolation for other notes
          note.y = note.y * (1 - interpolationFactor) + targetY * interpolationFactor
        }
      } else {
        // First position calculation, just set it directly
        note.y = targetY
      }

      visibleNotes.push(note)
    }
  }

  visibleNotesRef.current = visibleNotes

  // Update the horizontal line offset based on note speed with consistent speed
  const lineDistance = (gameHeight - perspectiveStartY) / 5
  horizontalLineOffsetRef.current += NOTE_SPEED * deltaTime
  // Use modulo to ensure smooth looping regardless of frame rate
  if (horizontalLineOffsetRef.current > lineDistance) {
    horizontalLineOffsetRef.current = horizontalLineOffsetRef.current % lineDistance
  }

  return visibleNotes
}
