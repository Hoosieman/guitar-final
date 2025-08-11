import type React from "react"
import type { Note } from "../types"
import { calculatePerspectiveX, calculateNoteSize } from "../utils/perspective"
import { FRETS, PERSPECTIVE_START_Y_RATIO } from "../types"

// Calculate note position based on timestamp, current time, fret position, and note speed
export const calculateNotePosition = (timestamp: number, currentTime: number, fretY: number, noteSpeed: number) => {
  const timeDifference = timestamp - currentTime
  return fretY - (timeDifference / 1000) * noteSpeed
}

// Draw notes with 3D perspective
export const drawNotes = (
  ctx: CanvasRenderingContext2D,
  visibleNotes: Note[],
  gameDimensions: { width: number; height: number; fretY: number },
  isMobile: boolean,
  songTime: number,
  heldNotesRef: React.MutableRefObject<Record<string, { noteId: string; startTime: number }>>,
  sustainedNotes: string[],
) => {
  const { width: gameWidth, height: gameHeight } = gameDimensions
  const perspectiveStartY = gameHeight * PERSPECTIVE_START_Y_RATIO
  const fretY = gameDimensions.fretY

  // Sort notes by Y position to ensure proper rendering order
  // This helps with visual consistency when notes are hit/missed
  const sortedNotes = [...visibleNotes].sort((a, b) => a.y - b.y)

  sortedNotes.forEach((note) => {
    const noteIndex = FRETS.findIndex((fret) => fret.color === note.color)
    if (noteIndex !== -1) {
      const x = calculatePerspectiveX(noteIndex, note.y, gameDimensions.width, gameHeight, isMobile)
      const noteSize = calculateNoteSize(note.y, gameHeight)

      // Calculate fade-in effect based on position relative to the perspective start point
      if (note.y >= perspectiveStartY) {
        // Calculate opacity based on distance from perspective start
        const fadeDistance = (gameHeight - perspectiveStartY) * 0.1
        const opacity = Math.min(1, Math.max(0, (note.y - perspectiveStartY) / fadeDistance))

        // Apply fade-out effect for hit or missed notes
        let finalOpacity = opacity
        if (note.missed) {
          // Calculate how far past the fret line the note is
          const pastFretDistance = note.y - fretY
          if (pastFretDistance > 0) {
            // Gradually fade out as the note moves past the fret line
            finalOpacity = opacity * Math.max(0, 1 - pastFretDistance / 50)
          }
        } else if (note.hit && !note.duration) {
          // For hit notes (non-sustained), fade out very quickly
          const pastFretDistance = note.y - fretY
          if (pastFretDistance > 0) {
            // Fade out much faster for hit notes
            finalOpacity = opacity * Math.max(0, 1 - pastFretDistance / 20)
          }
        }

        // Check if this is a held note
        if (note.duration && note.duration > 200) {
          // Simplified visual handling for sustained notes
          const isFullySustained = sustainedNotes.includes(note.id)

          if (!note.hit || !isFullySustained) {
            // Set opacity based on state
            ctx.globalAlpha = note.hit ? 0.7 * finalOpacity : 0.5 * finalOpacity
            ctx.fillStyle = note.color

            // Calculate the duration in pixels based on the note speed
            const durationInPixels = (note.duration / 1000) * 300 // 300 is the note speed

            // Calculate how far up the highway the tail should extend
            const tailExtension = Math.min(durationInPixels, note.y - perspectiveStartY)

            // Make sure we don't draw tails that would go beyond the perspective start
            if (tailExtension > 0) {
              // Calculate the end Y position by moving up the highway
              const endY = Math.max(perspectiveStartY, note.y - tailExtension)

              // Calculate the width at both ends based on perspective
              const endSize = calculateNoteSize(endY, gameHeight)
              const endWidth = endSize.horizontal * 0.8

              // Calculate the X position at the end with perspective
              const endX = calculatePerspectiveX(noteIndex, endY, gameDimensions.width, gameHeight, isMobile)

              // For the start position, determine where to start drawing the rectangle
              let startY, startX, startWidth

              if (note.hit) {
                // If the note has been hit, anchor to fret line
                startY = fretY
                startX = calculatePerspectiveX(noteIndex, fretY, gameDimensions.width, gameHeight, isMobile)
                startWidth = calculateNoteSize(fretY, gameHeight).horizontal * 0.8
              } else {
                // If the note hasn't been hit yet, start from the note's current position
                startY = note.y
                startX = x
                startWidth = noteSize.horizontal * 0.8
              }

              // Draw a trapezoid shape that follows the perspective
              ctx.beginPath()
              ctx.moveTo(startX - startWidth / 2, startY)
              ctx.lineTo(startX + startWidth / 2, startY)
              ctx.lineTo(endX + endWidth / 2, endY)
              ctx.lineTo(endX - endWidth / 2, endY)
              ctx.closePath()
              ctx.fill()
            }
          }

          ctx.globalAlpha = 1.0
        }

        // Determine if we should draw the note head
        const isSustainedNote = note.duration && note.duration > 200
        const shouldDrawNoteHead =
          // Always draw if not hit yet
          !note.hit ||
          // For regular notes that are hit, only draw them briefly as they pass the fret line
          (!isSustainedNote && note.hit && note.y < fretY + 15) ||
          // For missed notes, draw them until they're a bit past the fret line
          (note.missed && note.y < fretY + 30)

        if (shouldDrawNoteHead) {
          // Apply fade-in/out effect
          ctx.globalAlpha = finalOpacity

          // Get note sizes with perspective distortion
          const noteSize = calculateNoteSize(note.y, gameHeight)

          // Save the current context state
          ctx.save()

          // Create metallic note effect with oval shape
          ctx.beginPath()

          // Translate to note position with vertical offset to move center higher
          ctx.translate(x, note.y - noteSize.vertical * 0.2) // Shift upward by 20% of the note height

          // Scale context to create oval effect
          ctx.scale(noteSize.horizontal / noteSize.vertical, 1)

          // Draw the oval (scaled circle)
          ctx.arc(0, 0, noteSize.vertical, 0, Math.PI * 2)

          // Create gradient for metallic effect with center shifted towards the front of the note
          // Shift the gradient center upward by 30% of the note's radius
          const shiftY = -noteSize.vertical * 0.3
          const noteGradient = ctx.createRadialGradient(0, shiftY, 0, 0, shiftY, noteSize.vertical * 1.2)

          // Adjust colors based on hit/miss state
          if (note.missed) {
            // Darker colors for missed notes
            noteGradient.addColorStop(0, "rgba(255, 255, 255, 0.5)")
            noteGradient.addColorStop(0.25, "rgba(100, 100, 100, 0.8)")
            noteGradient.addColorStop(0.6, "rgba(80, 80, 80, 0.8)")
            noteGradient.addColorStop(1, "#333")
          } else if (note.hit && !note.duration) {
            // Bright flash effect for hit notes
            noteGradient.addColorStop(0, "white")
            noteGradient.addColorStop(0.4, "white")
            noteGradient.addColorStop(0.6, note.color)
            noteGradient.addColorStop(1, note.color)
          } else {
            // Normal colors for other notes
            noteGradient.addColorStop(0, "white")
            noteGradient.addColorStop(0.25, note.color)
            noteGradient.addColorStop(0.6, note.color)
            noteGradient.addColorStop(1, "#333")
          }

          ctx.fillStyle = noteGradient
          ctx.fill()

          // Add outer ring
          ctx.strokeStyle = note.missed ? "rgba(100, 100, 100, 0.8)" : "rgba(255, 255, 255, 0.8)"
          ctx.lineWidth = 2
          ctx.stroke()

          // Add inner glow
          ctx.beginPath()
          ctx.arc(0, shiftY * 0.7, noteSize.vertical * 0.6, 0, Math.PI * 2)
          ctx.strokeStyle = note.missed ? "rgba(100, 100, 100, 0.5)" : "rgba(255, 255, 255, 0.5)"
          ctx.lineWidth = 1.5
          ctx.stroke()

          // Add center dot with glow
          ctx.beginPath()
          ctx.arc(0, shiftY * 0.7, noteSize.vertical * 0.25, 0, Math.PI * 2)
          ctx.fillStyle = note.missed ? "rgba(100, 100, 100, 0.8)" : "white"
          ctx.shadowColor = note.missed ? "#333" : note.color
          ctx.shadowBlur = 10
          ctx.fill()
          ctx.shadowBlur = 0

          // Restore the context to normal
          ctx.restore()

          // Reset opacity
          ctx.globalAlpha = 1.0
        }

        // For sustained notes that have been hit, draw a smaller indicator at the fret line
        if (note.hit && note.duration && note.duration > 200 && sustainedNotes.includes(note.id)) {
          const noteSize = calculateNoteSize(fretY, gameHeight)
          const fretX = calculatePerspectiveX(noteIndex, fretY, gameDimensions.width, gameHeight, isMobile)

          ctx.save()
          // Translate to fret position
          ctx.translate(fretX, fretY - noteSize.vertical * 0.2)

          ctx.scale(noteSize.horizontal / noteSize.vertical, 1)

          ctx.beginPath()
          ctx.arc(0, 0, noteSize.vertical * 0.6, 0, Math.PI * 2)
          ctx.fillStyle = note.color
          ctx.globalAlpha = 0.7 * opacity
          ctx.fill()

          ctx.restore()
          ctx.globalAlpha = 1.0
        }
      }
    }
  })
}

// Draw hit effects
export const drawHitEffects = (
  ctx: CanvasRenderingContext2D,
  effects: { x: number; y: number; color: string; frame: number }[],
  deltaTime: number,
  gameHeight: number,
) => {
  const maxEffects = 15

  // Limit the number of effects
  if (effects.length > maxEffects) {
    effects.length = maxEffects
  }

  // Pre-calculate animation speed with a cap to prevent large jumps
  const MAX_ANIMATION_DELTA = 1 / 30 // Cap at 30fps for animations
  const cappedDelta = Math.min(deltaTime, MAX_ANIMATION_DELTA)
  const animationSpeed = 30 * cappedDelta

  // Use a for loop with direct array access for better performance
  let activeEffectsCount = 0

  for (let i = 0; i < effects.length; i++) {
    const effect = effects[i]

    // Skip effects that are done
    if (effect.frame >= 10) continue

    // Only draw if the effect is visible
    if (effect.y > 0 && effect.y < gameHeight) {
      ctx.beginPath()
      ctx.arc(effect.x, effect.y, 20 + effect.frame * 3, 0, Math.PI * 2)
      ctx.strokeStyle = effect.color
      ctx.lineWidth = 3
      ctx.globalAlpha = 1 - effect.frame / 10
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    // Update the frame counter
    effect.frame += animationSpeed

    // Keep active effects
    if (effect.frame < 10) {
      effects[activeEffectsCount++] = effect
    }
  }

  // Truncate the array to only include active effects
  effects.length = activeEffectsCount

  return effects
}
