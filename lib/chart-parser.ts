// Chart parser for Guitar Hero clone
// This utility loads and parses .chart files for songs

// Update the ChartNote interface to include tick property
export interface ChartNote {
  timestamp: number // When the note should be hit (in ms)
  color: string // Note color (green, red, yellow, blue, orange)
  duration: number // For held notes (0 for regular notes)
  tick?: number // Add tick property to store the original tick value
}

export interface ChartMetadata {
  name: string
  artist: string
  charter?: string
  album?: string
  year?: string
  difficulty?: string
  offset: number
  resolution: number
}

export interface ChartData {
  metadata: ChartMetadata
  notes: ChartNote[]
  sections: { name: string; timestamp: number }[]
  bpmChanges: { tick: number; bpm: number; timestamp: number }[] // Add this
  availableDifficulties: string[] // Add this to store available difficulties
}

// Map note numbers to colors
const NOTE_COLORS = ["green", "red", "yellow", "blue", "orange"]

/**
 * Calculate the exact timestamp for a tick based on BPM changes
 */
function calculateTimestampForTick(
  tick: number,
  bpmChanges: { tick: number; bpm: number; timestamp: number }[],
  resolution: number,
): number {
  // Find the most recent BPM change before this tick
  let prevBpmChange = bpmChanges[0]

  for (let i = 1; i < bpmChanges.length; i++) {
    if (bpmChanges[i].tick > tick) break
    prevBpmChange = bpmChanges[i]
  }

  // Calculate time since the last BPM change
  const ticksSinceChange = tick - prevBpmChange.tick
  const msPerTick = 60000 / (prevBpmChange.bpm * resolution)

  // Return the timestamp
  return prevBpmChange.timestamp + ticksSinceChange * msPerTick
}

// Define the difficulty sections to look for
const DIFFICULTY_SECTIONS = ["EasySingle", "MediumSingle", "HardSingle", "ExpertSingle"]

/**
 * Parse a .chart file and extract note data for a specific difficulty
 */
export async function parseChartFile(
  chartPath: string,
  selectedDifficulty: "easy" | "medium" | "hard" | "expert" = "medium",
): Promise<ChartData> {
  try {
    // Add these logs at the beginning of the parseChartFile function
    console.log(`Loading chart file from: ${chartPath}`)
    console.log(`Selected difficulty: ${selectedDifficulty}`)

    // Fetch the chart file
    const response = await fetch(chartPath)
    if (!response.ok) {
      throw new Error(`Failed to load chart file: ${response.status} ${response.statusText}`)
    }

    const chartContent = await response.text()

    // Add this log after parsing the chart content
    console.log(`Chart content length: ${chartContent.length} characters`)

    // Default metadata
    const metadata: ChartMetadata = {
      name: "Unknown Song",
      artist: "Unknown Artist",
      difficulty: "medium",
      offset: 0,
      resolution: 192, // Default resolution for most charts
    }

    const notes: ChartNote[] = []
    const sections: { name: string; timestamp: number }[] = []
    // Track available difficulties
    const availableDifficulties: string[] = []

    // Map difficulty names to their section names
    const difficultyMap: Record<string, string> = {
      easy: "EasySingle",
      medium: "MediumSingle",
      hard: "HardSingle",
      expert: "ExpertSingle",
    }

    // Get requested difficulty section
    const requestedSection = difficultyMap[selectedDifficulty]

    // Parse the chart file
    let currentSection = ""
    let inBraces = false
    let resolution = 192 // Default resolution

    // Track BPM changes for timestamp calculation
    const bpmChanges: { tick: number; bpm: number; timestamp: number }[] = []
    // Initialize with default BPM
    bpmChanges.push({ tick: 0, bpm: 120, timestamp: 0 })

    const lines = chartContent.split("\n")

    // First pass: find all available difficulty sections
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Check for section headers
      const sectionMatch = line.match(/^\[([^\]]+)\]$/)
      if (sectionMatch) {
        const sectionName = sectionMatch[1]
        if (DIFFICULTY_SECTIONS.includes(sectionName)) {
          const difficulty = sectionName.replace("Single", "").toLowerCase()
          availableDifficulties.push(difficulty)
        }
      }
    }

    console.log("Available difficulties:", availableDifficulties)

    // If requested difficulty is not available, use the first available one
    let targetSection = requestedSection
    if (!availableDifficulties.includes(selectedDifficulty) && availableDifficulties.length > 0) {
      const fallbackDifficulty = availableDifficulties[0]
      targetSection = difficultyMap[fallbackDifficulty]
      console.log(`Requested difficulty ${selectedDifficulty} not available. Using ${fallbackDifficulty} instead.`)
    }

    // Reset for second pass
    currentSection = ""
    inBraces = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Skip empty lines
      if (!line) continue

      // Check for section headers
      if (line.match(/^\[([^\]]+)\]$/)) {
        currentSection = line.substring(1, line.length - 1)
        continue
      }

      // Check for opening/closing braces
      if (line === "{") {
        inBraces = true
        continue
      }

      if (line === "}") {
        inBraces = false
        continue
      }

      // Process content based on current section
      if (inBraces) {
        switch (currentSection) {
          case "Song":
            // Parse metadata
            const metaMatch = line.match(/^\s*(\w+)\s*=\s*"([^"]*)"$/)
            if (metaMatch) {
              const key = metaMatch[1]
              const value = metaMatch[2]

              switch (key) {
                case "Name":
                  metadata.name = value
                  break
                case "Artist":
                  metadata.artist = value
                  break
                case "Charter":
                  metadata.charter = value
                  break
                case "Album":
                  metadata.album = value
                  break
                case "Year":
                  metadata.year = value
                  break
                case "Offset":
                  metadata.offset = Number.parseFloat(value)
                  break
                case "Resolution":
                  metadata.resolution = Number.parseInt(value, 10)
                  resolution = Number.parseInt(value, 10)
                  break
              }
            }
            break

          case "SyncTrack":
            // Parse BPM changes
            const syncMatch = line.match(/^\s*(\d+)\s*=\s*B\s+(\d+)$/)
            if (syncMatch) {
              const tick = Number.parseInt(syncMatch[1], 10)
              const bpm = Number.parseInt(syncMatch[2], 10) / 1000 // Convert from milli-BPM

              // Calculate timestamp for this BPM change
              const timestamp = calculateTimestampForTick(tick, bpmChanges, resolution)
              bpmChanges.push({ tick, bpm, timestamp })
            }
            break

          case "Events":
            // Parse section markers
            const eventMatch = line.match(/^\s*(\d+)\s*=\s*E\s+"section\s+([^"]+)"$/)
            if (eventMatch) {
              const tick = Number.parseInt(eventMatch[1], 10)
              const sectionName = eventMatch[2]

              // Calculate timestamp for this section using BPM changes
              const timestamp = calculateTimestampForTick(tick, bpmChanges, resolution)
              sections.push({ name: sectionName, timestamp })
            }
            break

          // Parse notes from selected difficulty section
          case targetSection:
            const noteMatch = line.match(/^\s*(\d+)\s*=\s*N\s+(\d+)\s+(\d+)$/)
            if (noteMatch) {
              const tick = Number.parseInt(noteMatch[1], 10)
              const noteNumber = Number.parseInt(noteMatch[2], 10)
              const duration = Number.parseInt(noteMatch[3], 10)

              // Calculate timestamp using BPM changes
              const timestamp = calculateTimestampForTick(tick, bpmChanges, resolution)
              const durationMs =
                duration > 0 ? calculateTimestampForTick(tick + duration, bpmChanges, resolution) - timestamp : 0

              // Map note number to color
              const color = NOTE_COLORS[noteNumber] || "green"

              notes.push({
                timestamp,
                color,
                duration: durationMs,
                tick: tick, // Store the original tick value
              })
            }
            break
        }
      }
    }

    // Sort notes by timestamp
    notes.sort((a, b) => a.timestamp - b.timestamp)

    // Add this log before returning the parsed data
    console.log(
      `Parsed ${notes.length} notes using difficulty ${targetSection}, ${sections.length} sections, and ${bpmChanges.length} BPM changes`,
    )

    // Log the first few notes to verify timestamps
    if (notes.length > 0) {
      console.log(
        "First 5 note timestamps:",
        notes.slice(0, 5).map((n) => n.timestamp),
      )
    }

    if (notes.length === 0) {
      console.warn(`No notes were parsed for difficulty ${targetSection}!`)

      // Try to fallback to any difficulty section as a last resort
      for (const diffSection of DIFFICULTY_SECTIONS) {
        console.log(`Trying fallback to ${diffSection}...`)
        const fallbackNotes = parseNotesFromSection(lines, diffSection, bpmChanges, resolution)
        if (fallbackNotes.length > 0) {
          console.log(`Found ${fallbackNotes.length} notes using fallback to ${diffSection}`)
          notes.push(...fallbackNotes)
          notes.sort((a, b) => a.timestamp - b.timestamp)
          break
        }
      }
    }

    // Add a debug log to see how many notes are being processed
    console.log(`Total notes parsed from chart: ${notes.length}`)

    // Sort available difficulties by ascending order of difficulty
    const difficultyOrder = { easy: 0, medium: 1, hard: 2, expert: 3 }
    availableDifficulties.sort((a, b) => difficultyOrder[a] - difficultyOrder[b])

    return {
      metadata,
      notes,
      sections,
      bpmChanges,
      availableDifficulties,
    }
  } catch (error) {
    console.error("Error parsing chart file:", error)
    throw error
  }
}

/**
 * Parse notes from a specific difficulty section
 */
function parseNotesFromSection(
  lines: string[],
  section: string,
  bpmChanges: { tick: number; bpm: number; timestamp: number }[],
  resolution: number,
): ChartNote[] {
  const notes: ChartNote[] = []
  let currentSection = ""
  let inBraces = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Check for section headers
    if (line.match(/^\[([^\]]+)\]$/)) {
      currentSection = line.substring(1, line.length - 1)
      continue
    }

    // Check for opening/closing braces
    if (line === "{") {
      inBraces = true
      continue
    }

    if (line === "}") {
      inBraces = false
      continue
    }

    // Process notes in requested section
    if (inBraces && currentSection === section) {
      const noteMatch = line.match(/^\s*(\d+)\s*=\s*N\s+(\d+)\s+(\d+)$/)
      if (noteMatch) {
        const tick = Number.parseInt(noteMatch[1], 10)
        const noteNumber = Number.parseInt(noteMatch[2], 10)
        const duration = Number.parseInt(noteMatch[3], 10)

        // Calculate timestamp using BPM changes
        const timestamp = calculateTimestampForTick(tick, bpmChanges, resolution)
        const durationMs =
          duration > 0 ? calculateTimestampForTick(tick + duration, bpmChanges, resolution) - timestamp : 0

        // Map note number to color
        const color = NOTE_COLORS[noteNumber] || "green"

        notes.push({
          timestamp,
          color,
          duration: durationMs,
          tick: tick,
        })
      }
    }
  }

  return notes
}

/**
 * Calculate the Y position for a note based on its timestamp and the current song time
 */
export function calculateNotePosition(
  noteTimestamp: number,
  currentTime: number,
  fretY: number,
  noteSpeed = 300, // Default value for scroll speed
): number {
  // Simple linear calculation based on accurate timestamps
  const timeToFret = (noteTimestamp - currentTime) / 1000

  // Position notes based on time to fret
  return fretY - timeToFret * noteSpeed
}

