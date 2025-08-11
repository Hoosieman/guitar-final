import type { Note } from "../types"
import { parseChartFile } from "@/lib/chart-parser"

// Load chart file and create notes
export const loadChartFile = async (chartPath: string, audioPath: string, difficulty: string) => {
  try {
    const data = await parseChartFile(chartPath, difficulty)

    // Create notes array from chart data
    const chartNotes: Note[] = data.notes.map((note) => ({
      id: Math.random().toString(36).substring(2, 9),
      color: note.color,
      y: -100, // Start off-screen
      timestamp: note.timestamp,
      hit: false,
      missed: false,
      duration: note.duration,
    }))

    // Load audio using Web Audio API for better timing
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitContext)()

      const response = await fetch(audioPath)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // Return the decoded buffer for playback
      return {
        chartNotes,
        data,
        audioBuffer,
        audioContext,
      }
    } catch (audioError) {
      console.error("Error loading audio:", audioError)
      return {
        chartNotes,
        data,
        audioBuffer: null,
        audioContext: null,
      }
    }
  } catch (error) {
    console.error("Failed to load chart:", error)
    return null
  }
}
