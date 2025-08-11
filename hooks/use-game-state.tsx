"use client"

import React, { useState, useEffect, useRef, createContext, useContext } from "react"

// Define ItemType
type ItemType = "guitar" | "clothing" | "amp" | "fretboard" | "song"

// Update the Item interface to include chart and audio file paths
export interface Item {
  id: string
  name: string
  type: ItemType
  rarity: "common" | "rare" | "epic" | "legendary"
  image: string
  description: string
  // Additional properties for songs
  artist?: string
  duration?: string
  difficulty?: "easy" | "medium" | "hard" | "expert"
  chartFile?: string // Path to the chart file (relative to public/charts)
  audioFile?: string // Path to the audio file (relative to public)
}

// Updated AvatarSettings interface to use Ready Player Me
export interface AvatarSettings {
  avatarUrl: string
  avatarName: string
}

interface GameState {
  emeralds: number
  addEmeralds: (amount: number) => void
  spendEmeralds: (amount: number) => boolean
  items: Item[]
  addItems: (newItems: Item[]) => void
  hasItem: (itemId: string) => boolean
  selectedSong: Item | null
  selectSong: (song: Item | null) => void
  // Avatar settings
  avatarSettings: AvatarSettings
  updateAvatarSettings: (settings: Partial<AvatarSettings>) => void
}

// Create context
const GameStateContext = createContext<GameState | undefined>(undefined)

// Export the context so it can be imported in other files
export const AvatarModelContext = createContext<{
  cachedModel: any | null
  isLoading: boolean
  preloadAvatar: (url: string) => void
  avatarUrlRef: string
}>({
  cachedModel: null,
  isLoading: false,
  preloadAvatar: () => {},
  avatarUrlRef: "",
})

// Add the new song to STORE_ITEMS
export const STORE_ITEMS: Item[] = [
  // Guitars
  {
    id: "guitar-1",
    name: "Classic Stratocaster",
    type: "guitar",
    rarity: "common",
    image: "/placeholder.svg?height=200&width=200",
    description: "A timeless classic for any rocker.",
  },
  {
    id: "guitar-2",
    name: "Flying V",
    type: "guitar",
    rarity: "rare",
    image: "/placeholder.svg?height=200&width=200",
    description: "Aggressive styling for the true metal head.",
  },
  {
    id: "guitar-3",
    name: "Neon Shredder",
    type: "guitar",
    rarity: "epic",
    image: "/placeholder.svg?height=200&width=200",
    description: "Light up the stage with this glowing axe.",
  },
  {
    id: "guitar-4",
    name: "Dragon's Breath",
    type: "guitar",
    rarity: "legendary",
    image: "/placeholder.svg?height=200&width=200",
    description: "Forged in dragon fire, this guitar melts faces.",
  },

  // Clothing
  {
    id: "clothing-1",
    name: "Leather Jacket",
    type: "clothing",
    rarity: "common",
    image: "/placeholder.svg?height=200&width=200",
    description: "Every rocker needs a classic leather jacket.",
  },
  {
    id: "clothing-2",
    name: "Ripped Jeans",
    type: "clothing",
    rarity: "common",
    image: "/placeholder.svg?height=200&width=200",
    description: "Casual and cool for any gig.",
  },
  {
    id: "clothing-3",
    name: "Spiked Vest",
    type: "clothing",
    rarity: "rare",
    image: "/placeholder.svg?height=200&width=200",
    description: "Show your punk side with this edgy vest.",
  },
  {
    id: "clothing-4",
    name: "Cosmic Suit",
    type: "clothing",
    rarity: "legendary",
    image: "/placeholder.svg?height=200&width=200",
    description: "Looks like it came from another dimension.",
  },

  // Amps
  {
    id: "amp-1",
    name: "Practice Amp",
    type: "amp",
    rarity: "common",
    image: "/placeholder.svg?height=200&width=200",
    description: "Small but mighty, perfect for beginners.",
  },
  {
    id: "amp-2",
    name: "Vintage Tube Amp",
    type: "amp",
    rarity: "rare",
    image: "/placeholder.svg?height=200&width=200",
    description: "Warm, rich tones from the golden age of rock.",
  },
  {
    id: "amp-3",
    name: "Stadium Stack",
    type: "amp",
    rarity: "epic",
    image: "/placeholder.svg?height=200&width=200",
    description: "Blow the roof off with this massive stack.",
  },
  {
    id: "amp-4",
    name: "Quantum Amplifier",
    type: "amp",
    rarity: "legendary",
    image: "/placeholder.svg?height=200&width=200",
    description: "Harnesses quantum vibrations for impossible sounds.",
  },

  // Fretboards
  {
    id: "fretboard-1",
    name: "Maple Standard",
    type: "fretboard",
    rarity: "common",
    image: "/placeholder.svg?height=200&width=200",
    description: "Classic maple fretboard with dot inlays.",
  },
  {
    id: "fretboard-2",
    name: "Rosewood Deluxe",
    type: "fretboard",
    rarity: "rare",
    image: "/placeholder.svg?height=200&width=200",
    description: "Rich, dark wood with custom inlays.",
  },
  {
    id: "fretboard-3",
    name: "Flame Maple",
    type: "fretboard",
    rarity: "epic",
    image: "/placeholder.svg?height=200&width=200",
    description: "Stunning flame maple with abalone inlays.",
  },
  {
    id: "fretboard-4",
    name: "Obsidian Glow",
    type: "fretboard",
    rarity: "legendary",
    image: "/placeholder.svg?height=200&width=200",
    description: "Black as night with glowing LED fret markers.",
  },

  // Songs
  {
    id: "song-1",
    name: "Highway Star",
    type: "song",
    rarity: "common",
    image: "/placeholder.svg?height=200&width=200",
    description: "A classic rock anthem with blazing solos.",
    artist: "Deep Purple",
    duration: "6:05",
    difficulty: "medium",
  },
  {
    id: "song-2",
    name: "Sweet Child O' Mine",
    type: "song",
    rarity: "common",
    image: "/placeholder.svg?height=200&width=200",
    description: "Iconic guitar intro and soaring solos.",
    artist: "Guns N' Roses",
    duration: "5:55",
    difficulty: "medium",
  },
  {
    id: "song-3",
    name: "Master of Puppets",
    type: "song",
    rarity: "rare",
    image: "/placeholder.svg?height=200&width=200",
    description: "Heavy metal masterpiece with complex riffs.",
    artist: "Metallica",
    duration: "8:35",
    difficulty: "hard",
  },
  {
    id: "song-4",
    name: "Eruption",
    type: "song",
    rarity: "epic",
    image: "/placeholder.svg?height=200&width=200",
    description: "Revolutionary guitar solo that changed rock forever.",
    artist: "Van Halen",
    duration: "1:42",
    difficulty: "expert",
  },
  {
    id: "song-5",
    name: "Through the Fire and Flames",
    type: "song",
    rarity: "legendary",
    image: "/placeholder.svg?height=200&width=200",
    description: "The ultimate guitar challenge with insane speed.",
    artist: "DragonForce",
    duration: "7:21",
    difficulty: "expert",
  },
  {
    id: "song-6",
    name: "Stairway to Heaven",
    type: "song",
    rarity: "rare",
    image: "/cards/stairway-to-heaven.png",
    description: "Epic journey from gentle acoustic to rock crescendo.",
    artist: "Led Zeppelin",
    duration: "8:02",
    difficulty: "medium",
    chartFile: "stairway-to-heaven.chart",
    audioFile: "stairway-to-heaven.mp3",
  },
  {
    id: "song-7",
    name: "Cliffs of Dover",
    type: "song",
    rarity: "epic",
    image: "/placeholder.svg?height=200&width=200",
    description: "Instrumental guitar masterpiece with technical prowess.",
    artist: "Eric Johnson",
    duration: "4:09",
    difficulty: "hard",
  },
  {
    id: "song-8",
    name: "Thunderstruck",
    type: "song",
    rarity: "common",
    image: "/placeholder.svg?height=200&width=200",
    description: "Energetic rock anthem with a distinctive opening riff.",
    artist: "AC/DC",
    duration: "4:52",
    difficulty: "medium",
  },
  {
    id: "song-9",
    name: "House of the Rising Sun",
    type: "song",
    rarity: "rare",
    image: "/cards/house-of-the-rising-sun.png",
    description: "Classic folk rock song with a haunting melody and iconic guitar arpeggios.",
    artist: "The Animals",
    duration: "4:29",
    difficulty: "medium",
    chartFile: "house-of-the-rising-sun.chart",
    audioFile: "house-of-the-rising-sun.mp3",
  },
  {
    id: "song-10",
    name: "Mary Jane's Last Dance",
    type: "song",
    rarity: "epic",
    image: "/cards/mary-janes-last-dance.png",
    description: "Iconic rock song with a memorable guitar riff and bluesy feel.",
    artist: "Tom Petty",
    duration: "4:32",
    difficulty: "medium",
    chartFile: "mary-janes-last-dance.chart",
    audioFile: "mary-janes-last-dance.mp3",
  },
]

// Update the default avatar settings to use an empty string as default URL
const DEFAULT_AVATAR_SETTINGS: AvatarSettings = {
  avatarUrl: "", // Empty string as default - will use fallback avatar until user creates one
  avatarName: "Rock Star",
}

// Provider component
export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [emeralds, setEmeralds] = useState(1000) // Start with 1000 emeralds instead of 500
  const [items, setItems] = useState<Item[]>([])
  const [selectedSong, setSelectedSong] = useState<Item | null>(null)
  const [avatarSettings, setAvatarSettings] = useState<AvatarSettings>(DEFAULT_AVATAR_SETTINGS)

  // Avatar model state
  const [cachedAvatarModel, setCachedAvatarModel] = useState<any>(null)
  const [isAvatarLoading, setIsAvatarLoading] = useState(false)
  const avatarUrlRef = useRef<string>("")

  // Memoize default items to prevent recreation on each render
  const defaultItems = React.useMemo(
    () => [
      STORE_ITEMS.find((item) => item.id === "song-9") as Item, // House of the Rising Sun
      STORE_ITEMS.find((item) => item.id === "song-6") as Item, // Stairway to Heaven
      STORE_ITEMS.find((item) => item.id === "song-10") as Item, // Mary Jane's Last Dance
    ],
    [],
  )

  // Load state from localStorage on mount - only run once
  useEffect(() => {
    try {
      const savedEmeralds = localStorage.getItem("emeralds")
      const savedItems = localStorage.getItem("items")
      const savedSong = localStorage.getItem("selectedSong")
      const savedAvatarSettings = localStorage.getItem("avatarSettings")

      if (savedEmeralds) {
        setEmeralds(Number.parseInt(savedEmeralds))
      }

      if (savedItems) {
        setItems(JSON.parse(savedItems))
      } else {
        // If no saved items, set default items
        setItems(defaultItems)
      }

      if (savedSong) {
        setSelectedSong(JSON.parse(savedSong))
      }

      if (savedAvatarSettings) {
        setAvatarSettings(JSON.parse(savedAvatarSettings))
      }
    } catch (error) {
      console.error("Error loading game state from localStorage:", error)
      // Set default items if there's an error
      setItems(defaultItems)
    }
  }, [defaultItems]) // Only depend on defaultItems which is memoized

  // Save state to localStorage when it changes - use a debounced approach
  useEffect(() => {
    // Create a debounced save function to prevent excessive writes
    const saveTimeout = setTimeout(() => {
      try {
        // Only save if values are valid to prevent unnecessary updates
        if (emeralds !== undefined && items.length >= 0) {
          localStorage.setItem("emeralds", emeralds.toString())
          localStorage.setItem("items", JSON.stringify(items))
          localStorage.setItem("avatarSettings", JSON.stringify(avatarSettings))
          if (selectedSong) {
            localStorage.setItem("selectedSong", JSON.stringify(selectedSong))
          }
        }
      } catch (error) {
        console.error("Error saving game state to localStorage:", error)
      }
    }, 300) // 300ms debounce

    // Clear timeout on cleanup
    return () => clearTimeout(saveTimeout)
  }, [emeralds, items, selectedSong, avatarSettings])

  // Add emeralds
  const addEmeralds = (amount: number) => {
    setEmeralds((prev) => prev + amount)
  }

  // Spend emeralds (returns false if not enough)
  const spendEmeralds = (amount: number) => {
    if (emeralds >= amount) {
      setEmeralds((prev) => prev - amount)
      return true
    }
    return false
  }

  // Add items to collection
  const addItems = (newItems: Item[]) => {
    setItems((prev) => [...prev, ...newItems])
  }

  // Check if player has an item
  const hasItem = (itemId: string) => {
    return items.some((item) => item.id === itemId)
  }

  // Select a song to play
  const selectSong = (song: Item | null) => {
    setSelectedSong(song)
  }

  // Update avatar settings
  const updateAvatarSettings = (settings: Partial<AvatarSettings>) => {
    setAvatarSettings((prev) => ({ ...prev, ...settings }))
  }

  // Preload avatar function with memoization to prevent unnecessary re-renders
  const preloadAvatar = React.useCallback(
    (url: string) => {
      // Add more robust checks to prevent unnecessary loading
      if (!url || url === "" || url === avatarUrlRef.current || isAvatarLoading) return

      // Only set loading state if we're actually going to load something
      setIsAvatarLoading(true)
      avatarUrlRef.current = url

      // We'll use dynamic import to avoid issues with SSR
      const loadModel = async () => {
        try {
          const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js")
          const loader = new GLTFLoader()

          loader.load(
            url,
            (gltf) => {
              // Only update state if the URL hasn't changed during loading
              if (url === avatarUrlRef.current) {
                setCachedAvatarModel(gltf)
                setIsAvatarLoading(false)
              }
            },
            (progress) => {
              // Progress callback
              console.log(`Loading avatar: ${Math.round((progress.loaded / progress.total) * 100)}%`)
            },
            (error) => {
              console.error("Error preloading avatar:", error)
              setIsAvatarLoading(false)
              // Only reset if this is still the current URL
              if (url === avatarUrlRef.current) {
                avatarUrlRef.current = ""
              }
            },
          )
        } catch (error) {
          console.error("Error importing GLTFLoader:", error)
          setIsAvatarLoading(false)
        }
      }

      loadModel()
    },
    [isAvatarLoading],
  )

  // Preload animations to ensure they're available when needed - memoized to prevent recreation
  const preloadAnimations = React.useCallback(() => {
    // Create a loader
    const loadAnimations = async () => {
      try {
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js")
        const loader = new GLTFLoader()

        // Track loading state to prevent multiple simultaneous loads
        let isLoading = false

        // Only load if not already loading
        if (!isLoading) {
          isLoading = true

          // Preload the idle animation
          loader.load(
            "/animations/standing-idle.glb",
            () => {
              console.log("Idle animation preloaded successfully")
              isLoading = false
            },
            undefined,
            (error) => {
              console.error("Error preloading idle animation:", error)
              isLoading = false
            },
          )

          // Preload the dance animation
          loader.load(
            "/animations/M_Dances_011.glb",
            () => console.log("Dance animation preloaded successfully"),
            undefined,
            (error) => console.error("Error preloading dance animation:", error),
          )
        }
      } catch (error) {
        console.error("Error importing GLTFLoader for animations:", error)
      }
    }

    loadAnimations()
  }, [])

  // Preload the avatar when avatarSettings changes - with proper dependency array
  useEffect(() => {
    // Only preload if URL exists, is different from current, and not already loading
    if (
      avatarSettings.avatarUrl &&
      avatarSettings.avatarUrl !== avatarUrlRef.current &&
      !isAvatarLoading &&
      avatarSettings.avatarUrl !== ""
    ) {
      preloadAvatar(avatarSettings.avatarUrl)
      // Also preload animations
      preloadAnimations()
    }
  }, [avatarSettings.avatarUrl, isAvatarLoading, preloadAvatar, preloadAnimations])

  // Memoize the context value to prevent unnecessary re-renders
  const gameStateValue = React.useMemo(
    () => ({
      emeralds,
      addEmeralds,
      spendEmeralds,
      items,
      addItems,
      hasItem,
      selectedSong,
      selectSong,
      avatarSettings,
      updateAvatarSettings,
    }),
    [emeralds, items, selectedSong, avatarSettings],
  )

  // Memoize the avatar model context value
  const avatarModelValue = React.useMemo(
    () => ({
      cachedModel: cachedAvatarModel,
      isLoading: isAvatarLoading,
      preloadAvatar,
      avatarUrlRef: avatarUrlRef.current,
    }),
    [cachedAvatarModel, isAvatarLoading, preloadAvatar],
  )

  // Wrap the GameStateContext.Provider with the AvatarModelContext.Provider
  return (
    <AvatarModelContext.Provider value={avatarModelValue}>
      <GameStateContext.Provider value={gameStateValue}>{children}</GameStateContext.Provider>
    </AvatarModelContext.Provider>
  )
}

// Hook to use the game state
export function useGameState() {
  const context = useContext(GameStateContext)
  if (context === undefined) {
    throw new Error("useGameState must be used within a GameStateProvider")
  }
  return context
}

// Add this hook at the end of the file, after useGameState
export function useAvatarModel() {
  const context = useContext(AvatarModelContext)
  if (context === undefined) {
    throw new Error("useAvatarModel must be used within a GameStateProvider")
  }
  return context
}

export type { ItemType }

