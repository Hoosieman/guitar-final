"use client"

import type React from "react"
import { useCallback, useEffect } from "react"
import { type Note, HIT_THRESHOLD, FRETS } from "../types"
import { calculatePerspectiveX } from "../utils/perspective"

export const useNoteDetection = (
  gameDimensions: { width: number; height: number; fretY: number },
  isMobile: boolean,
  score: number,
  setScore: (score: number) => void,
  combo: number,
  setCombo: (combo: number) => void,
  maxCombo: number,
  setMaxCombo: (maxCombo: number) => void,
  setFeedback: (feedback: string) => void,
  setEmeralds: (callback: (prev: number) => number) => void,
  accuracyStatsRef: React.MutableRefObject<{ perfect: number; great: number; good: number; missed: number }>,
  hitEffectsRef: React.MutableRefObject<{ x: number; y: number; color: string; frame: number }[]>,
  heldNotesRef: React.MutableRefObject<Record<string, { noteId: string; startTime: number }>>,
  sustainedNotes: string[],
  setSustainedNotes: (notes: string[]) => void,
) => {
  // Handle fret press
  const handleFretPress = useCallback(
    (color: string, visibleNotes: Note[], songTime: number) => {
      // Cache the fret Y position
      const fretY = gameDimensions.fretY
      const currentTime = songTime

      // Use direct array access with a for loop instead of findIndex
      let hitNoteIndex = -1
      let closestDistance = HIT_THRESHOLD

      // Single pass to find the closest note
      for (let i = 0; i < visibleNotes.length; i++) {
        const note = visibleNotes[i]
        if (note.color === color && !note.hit) {
          const distance = Math.abs(note.y - fretY)
          const timeDistance = Math.abs(note.timestamp - currentTime)

          if (distance < HIT_THRESHOLD && timeDistance < 300 && distance < closestDistance) {
            closestDistance = distance
            hitNoteIndex = i
          }
        }
      }

      if (hitNoteIndex !== -1) {
        const note = visibleNotes[hitNoteIndex]
        const fretIndex = FRETS.findIndex((fret) => fret.color === color)

        // Cache the note position calculation
        const noteX = calculatePerspectiveX(fretIndex, note.y, gameDimensions.width, gameDimensions.height, isMobile)
        const noteY = note.y

        // Add hit effect - limit effects for performance
        if (hitEffectsRef.current.length < 10) {
          hitEffectsRef.current.push({
            x: noteX,
            y: noteY,
            color: color,
            frame: 0,
          })
        }

        // Mark the note as hit - but don't modify its position yet
        // This will be handled smoothly in the updateVisibleNotes function
        note.hit = true

        // Calculate score based on accuracy
        const accuracy = Math.abs(noteY - fretY)
        let points = 0
        let feedbackText = ""

        // Pre-calculate all values before state updates
        if (accuracy < 10) {
          points = 100
          feedbackText = "PERFECT!"
          accuracyStatsRef.current.perfect += 1
        } else if (accuracy < 20) {
          points = 50
          feedbackText = "GREAT!"
          accuracyStatsRef.current.great += 1
        } else {
          points = 25
          feedbackText = "GOOD!"
          accuracyStatsRef.current.good += 1
        }

        // Calculate new values upfront
        const newScore = score + points * (1 + combo * 0.1)
        const newCombo = combo + 1
        const newMaxCombo = Math.max(maxCombo, newCombo)

        // Batch all state updates in a single requestAnimationFrame
        requestAnimationFrame(() => {
          setScore(newScore)
          setCombo(newCombo)
          if (newCombo > maxCombo) {
            setMaxCombo(newCombo)
          }

          // Add emerald reward based on accuracy
          if (accuracy < 10) {
            setEmeralds((prev) => prev + 3) // Perfect hit: +3 emeralds
          } else if (accuracy < 20) {
            setEmeralds((prev) => prev + 2) // Great hit: +2 emeralds
          } else {
            setEmeralds((prev) => prev + 1) // Good hit: +1 emerald
          }

          // Set feedback
          setFeedback(feedbackText)
          setTimeout(() => {
            setFeedback((current) => (current === feedbackText ? "" : current))
          }, 500)
        })

        // Handle held notes separately from hit detection
        if (note.duration && note.duration > 200) {
          // Store held note directly in the ref
          heldNotesRef.current[color] = { noteId: note.id, startTime: performance.now() }
        }

        return true
      } else {
        // Miss - batch state updates
        requestAnimationFrame(() => {
          setCombo(0)
          setFeedback("MISS!")
          setTimeout(() => {
            setFeedback((current) => (current === "MISS!" ? "" : current))
          }, 500)
        })

        return false
      }
    },
    [gameDimensions, isMobile, score, setScore, combo, setCombo, maxCombo, setMaxCombo, setFeedback, setEmeralds],
  )

  // Handle fret release
  const handleFretRelease = useCallback(
    (color: string, visibleNotes: Note[]) => {
      // Check if we were holding a note with this color
      if (heldNotesRef.current[color]) {
        const { noteId, startTime } = heldNotesRef.current[color]

        // Calculate how long the note was held
        const heldDuration = performance.now() - startTime

        // Find the note in the visible notes array
        const note = visibleNotes.find((n) => n.id === noteId && n.color === color)

        if (note && note.duration) {
          // Check if the note was held for its full duration
          if (heldDuration >= note.duration * 0.9) {
            // Successfully held the note for its full duration
            const newSustainedNotes = [...sustainedNotes, noteId]

            // Add extra points for successfully holding the note
            const holdBonus = Math.floor(note.duration / 100) * 10
            const newScore = score + holdBonus

            requestAnimationFrame(() => {
              setSustainedNotes(newSustainedNotes)
              setScore(newScore)

              // Show feedback
              setFeedback("SUSTAINED!")
              setTimeout(() => {
                setFeedback((current) => (current === "SUSTAINED!" ? "" : current))
              }, 500)
            })
          } else if (note.duration > 200) {
            // Released too early
            requestAnimationFrame(() => {
              setFeedback("RELEASED EARLY!")
              setTimeout(() => {
                setFeedback((current) => (current === "RELEASED EARLY!" ? "" : current))
              }, 500)
            })
          }
        }

        // Remove the held note - directly update the ref
        delete heldNotesRef.current[color]
      }
    },
    [score, setScore, setFeedback, sustainedNotes, setSustainedNotes],
  )

  // Add a cleanup effect to ensure held notes are cleared when component unmounts
  useEffect(() => {
    return () => {
      // Clear any held notes when the component unmounts
      Object.keys(heldNotesRef.current).forEach((key) => {
        delete heldNotesRef.current[key]
      })
    }
  }, [])

  return { handleFretPress, handleFretRelease }
}
