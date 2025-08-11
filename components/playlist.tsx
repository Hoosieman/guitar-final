"use client"

import { useState, useRef, useEffect } from "react"
import { useGameState, type Item } from "@/hooks/use-game-state"
import { ArrowLeft, Music, ChevronRight, Sparkles } from "lucide-react"
import GuitarHero from "@/components/guitar-hero"
import { parseChartFile } from "@/lib/chart-parser"

interface PlaylistProps {
  onBack: () => void
}

export default function Playlist({ onBack }: PlaylistProps) {
  const { items, selectSong, selectedSong, addEmeralds, emeralds } = useGameState()
  const [playingSong, setPlayingSong] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const emeraldsAwarded = useRef(false)
  const [chartData, setChartData] = useState<any>(null)

  // Filter only song items
  const songs = items.filter((item) => item.type === "song")

  // Add a function to load chart data for the selected song
  const loadChartData = async (song: Item) => {
    if (song?.chartFile) {
      try {
        const chartPath = `/charts/${song.chartFile}`
        const data = await parseChartFile(chartPath)
        setChartData(data)
      } catch (error) {
        console.error("Failed to load chart data:", error)
        setChartData(null)
      }
    } else {
      setChartData(null)
    }
  }

  // Load chart data for the initially selected song when component mounts
  useEffect(() => {
    if (selectedSong) {
      loadChartData(selectedSong)
    }
  }, [selectedSong])

  // Update the handleSelectSong function to load chart data
  const handleSelectSong = async (song: Item) => {
    selectSong(song)
    await loadChartData(song)
  }

  // Handle difficulty selection and start game
  const handleSelectDifficulty = (difficulty: "easy" | "medium" | "hard" | "expert") => {
    if (selectedSong) {
      // Create a new song object with the selected difficulty
      const songWithDifficulty = {
        ...selectedSong,
        difficulty,
      }

      // Update the selected song with the new difficulty
      selectSong(songWithDifficulty)

      // Start the game immediately
      setPlayingSong(true)
      setGameCompleted(false)
      setFinalScore(0)
      emeraldsAwarded.current = false
    }
  }

  // Use a ref-based approach for tracking if emeralds have been awarded
  const handleGameComplete = (score: number, emeraldsEarned: number) => {
    // Only award emeralds if they haven't been awarded yet
    if (!emeraldsAwarded.current) {
      console.log("Awarding emeralds for score:", score, "and direct emeralds:", emeraldsEarned)

      // Store the final score
      setFinalScore(score)

      // Add the emeralds earned during gameplay
      if (emeraldsEarned > 0) {
        console.log("Adding", emeraldsEarned, "emeralds to player total")
        addEmeralds(emeraldsEarned)
      } else {
        console.warn("No emeralds earned during gameplay")
      }

      // Mark emeralds as awarded using the ref (this updates synchronously)
      emeraldsAwarded.current = true

      // Mark game as completed but don't return to playlist yet
      setGameCompleted(true)
    }
  }

  // Handle returning to playlist after viewing success screen
  const handleReturnToPlaylist = () => {
    setPlayingSong(false)
    setGameCompleted(false)
  }

  // Get color for difficulty
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500 hover:bg-green-600"
      case "medium":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "hard":
        return "bg-orange-500 hover:bg-orange-600"
      case "expert":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  // If playing a song, show the Guitar Hero component
  if (playingSong && selectedSong) {
    return (
      <GuitarHero
        onBack={gameCompleted ? handleReturnToPlaylist : () => setPlayingSong(false)}
        onComplete={handleGameComplete}
        gameCompleted={gameCompleted}
        finalScore={finalScore}
      />
    )
  }

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center text-white">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Home
        </button>
        <div className="flex items-center rounded-full bg-emerald-900 bg-opacity-30 px-4 py-2">
          <Sparkles className="mr-2 h-5 w-5 text-emerald-400" />
          <span className="text-lg font-bold text-emerald-400">{emeralds} Emeralds</span>
        </div>
      </div>

      <h2 className="mb-6 text-3xl font-bold text-white">Your Songs</h2>

      {songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg bg-gray-800 bg-opacity-50 p-12 text-center">
          <Music className="mb-4 h-16 w-16 text-gray-500" />
          <p className="mb-4 text-xl text-gray-400">No songs in your collection yet!</p>
          <p className="text-gray-500">Visit the store to buy card packs and collect songs.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {songs.map((song) => (
            <div
              key={song.id}
              className={`rounded-lg ${
                selectedSong?.id === song.id
                  ? "bg-gradient-to-r from-purple-700 to-blue-700 ring-2 ring-white"
                  : "bg-gray-800 hover:bg-gray-700"
              } transition-all duration-200 overflow-hidden`}
            >
              <div className="p-4 cursor-pointer" onClick={() => handleSelectSong(song)}>
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-md overflow-hidden mr-4 flex-shrink-0">
                    <img
                      src={song.image || "/placeholder.svg?height=64&width=64"}
                      alt={song.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{song.name}</h3>
                    <p className="text-sm text-gray-300">{song.artist}</p>

                    <div className="flex items-center mt-1">
                      <div
                        className={`
                        px-2 py-0.5 rounded-full text-xs font-bold 
                        ${song.rarity === "common" ? "bg-gray-600" : ""}
                        ${song.rarity === "rare" ? "bg-blue-600" : ""}
                        ${song.rarity === "epic" ? "bg-purple-600" : ""}
                        ${song.rarity === "legendary" ? "bg-yellow-500" : ""}
                      `}
                      >
                        {song.rarity.toUpperCase()}
                      </div>

                      {song.difficulty && (
                        <div
                          className={`
                          ml-2 px-2 py-0.5 rounded-full text-xs font-bold
                          ${song.difficulty === "easy" ? "bg-green-600" : ""}
                          ${song.difficulty === "medium" ? "bg-yellow-600" : ""}
                          ${song.difficulty === "hard" ? "bg-orange-600" : ""}
                          ${song.difficulty === "expert" ? "bg-red-600" : ""}
                        `}
                        >
                          {song.difficulty.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronRight
                    className={`h-5 w-5 ${selectedSong?.id === song.id ? "text-white" : "text-gray-400"}`}
                  />
                </div>
              </div>

              {/* Difficulty selection */}
              {selectedSong?.id === song.id && (
                <div className="bg-black bg-opacity-30 p-4 border-t border-gray-700">
                  <p className="text-sm text-gray-300 mb-3">Select difficulty:</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {/* Only render difficulty buttons for available difficulties */}
                    {chartData?.availableDifficulties?.includes("easy") ? (
                      <button
                        onClick={() => handleSelectDifficulty("easy")}
                        className={`px-3 py-2 rounded-md text-white font-bold text-sm flex items-center justify-center ${getDifficultyColor("easy")}`}
                      >
                        EASY
                      </button>
                    ) : null}

                    {chartData?.availableDifficulties?.includes("medium") ? (
                      <button
                        onClick={() => handleSelectDifficulty("medium")}
                        className={`px-3 py-2 rounded-md text-white font-bold text-sm flex items-center justify-center ${getDifficultyColor("medium")}`}
                      >
                        MEDIUM
                      </button>
                    ) : null}

                    {chartData?.availableDifficulties?.includes("hard") ? (
                      <button
                        onClick={() => handleSelectDifficulty("hard")}
                        className={`px-3 py-2 rounded-md text-white font-bold text-sm flex items-center justify-center ${getDifficultyColor("hard")}`}
                      >
                        HARD
                      </button>
                    ) : null}

                    {chartData?.availableDifficulties?.includes("expert") ? (
                      <button
                        onClick={() => handleSelectDifficulty("expert")}
                        className={`px-3 py-2 rounded-md text-white font-bold text-sm flex items-center justify-center ${getDifficultyColor("expert")}`}
                      >
                        EXPERT
                      </button>
                    ) : null}

                    {/* If there are no available difficulties, show a message */}
                    {(!chartData?.availableDifficulties || chartData.availableDifficulties.length === 0) && (
                      <div className="col-span-4 text-center text-gray-400 py-2">
                        No difficulty information available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
