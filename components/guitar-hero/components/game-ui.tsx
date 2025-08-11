"use client"

import type React from "react"
import { ArrowLeft, Sparkles, Music, Heart, Star } from "lucide-react"
import type { AccuracyStats } from "../types"
import { getRating } from "../utils/scoring"

interface GameUIProps {
  onBack: () => void
  selectedSong: { name: string; artist: string; difficulty: string } | null
  emeralds: number
  score: number
  combo: number
  maxCombo: number
  feedback: string
  gameStarted: boolean
  gameOver: boolean
  gameFailed: boolean
  startGame: () => void
  accuracyStats: AccuracyStats
  onComplete: (score: number) => void
  rewardsGiven: boolean
  setRewardsGiven: (value: boolean) => void
  calculateAccuracy: () => number
}

const GameUI: React.FC<GameUIProps> = ({
  onBack,
  selectedSong,
  emeralds,
  score,
  combo,
  maxCombo,
  feedback,
  gameStarted,
  gameOver,
  gameFailed,
  startGame,
  accuracyStats,
  onComplete,
  rewardsGiven,
  setRewardsGiven,
  calculateAccuracy,
}) => {
  const MAX_MISSES = 10

  return (
    <>
      <div className="mb-2 flex w-full items-center justify-between">
        <button onClick={onBack} className="flex items-center text-white">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Home
        </button>
        <div className="flex items-center rounded-full bg-emerald-900 bg-opacity-30 px-4 py-2">
          <Sparkles className="mr-2 h-5 w-5 text-emerald-400" />
          <span className="text-sm font-bold text-emerald-400">+{emeralds} Emeralds</span>
        </div>
      </div>

      {selectedSong && (
        <div className="mb-1 flex w-full items-center rounded-lg bg-gray-800 bg-opacity-50 p-3">
          <Music className="mr-3 h-5 w-5 text-white" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{selectedSong.name}</h3>
            <p className="text-sm text-gray-300">{selectedSong.artist}</p>
          </div>
          <div className="rounded-full bg-black bg-opacity-30 px-3 py-1 text-xs font-bold uppercase">
            {selectedSong.difficulty}
          </div>
        </div>
      )}

      {feedback && (
        <div className="absolute top-1/3 left-0 right-0 text-center z-20">
          <span className="text-4xl font-bold text-white animate-pulse">{feedback}</span>
        </div>
      )}

      {!gameStarted && !gameOver && !gameFailed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 z-30">
          <h2 className="mb-4 text-3xl font-bold text-white">
            {selectedSong ? selectedSong.name : "Guitar Hero Clone"}
          </h2>
          {selectedSong && (
            <p className="mb-6 text-xl text-gray-300">
              {selectedSong.artist} - {selectedSong.difficulty?.toUpperCase()}
            </p>
          )}
          <button
            onClick={startGame}
            className="rounded-full bg-gradient-to-r from-green-500 to-blue-500 px-8 py-3 text-xl font-bold text-white shadow-lg transition-transform hover:scale-105"
          >
            START GAME
          </button>
          <div className="mt-8 text-center text-white">
            <p className="mb-2">Controls:</p>
            <p>Use A, S, J, K, L keys to hit the notes</p>
            <p className="mt-4 flex items-center justify-center">
              <Heart className="mr-2 h-5 w-5 text-red-500" fill="currentColor" />
              <span>Miss {MAX_MISSES} notes and you fail the song!</span>
            </p>
          </div>
        </div>
      )}

      {gameOver && !gameFailed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-30">
          <div className="mb-4 text-6xl text-green-500 animate-pulse">SUCCESS!</div>
          <h2 className="mb-6 text-3xl font-bold text-white">Song Complete!</h2>
          <p className="mb-6 text-xl text-green-400">Score: {Math.floor(score).toLocaleString()}</p>

          <div className="mb-4 flex items-center">
            <div className="mr-3 text-lg text-white">Rating:</div>
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-8 w-8 ${i < getRating(accuracyStats).stars ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
                />
              ))}
            </div>
            <div className="ml-3 text-lg font-bold text-yellow-400">{getRating(accuracyStats).text}</div>
          </div>

          <div className="mb-8 flex items-center rounded-full bg-emerald-900 px-8 py-4">
            <Sparkles className="mr-3 h-8 w-8 text-emerald-400 animate-pulse" />
            <span className="text-2xl font-bold text-emerald-400">+{emeralds} Emeralds</span>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-x-8 gap-y-2 text-center">
            <div className="flex flex-col">
              <span className="text-sm text-gray-400">Highest Combo</span>
              <span
                className={`text-xl font-bold ${maxCombo > 10 ? "text-yellow-400" : ""} ${maxCombo > 20 ? "text-green-400" : ""}`}
              >
                {maxCombo}x
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-400">Accuracy</span>
              <span className="text-xl font-bold text-blue-400">{calculateAccuracy()}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-400">Perfect Hits</span>
              <span className="text-xl font-bold text-green-400">{accuracyStats.perfect}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-400">Great Hits</span>
              <span className="text-xl font-bold text-blue-400">{accuracyStats.great}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-400">Good Hits</span>
              <span className="text-xl font-bold text-yellow-400">{accuracyStats.good}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-400">Missed Notes</span>
              <span className="text-xl font-bold text-red-400">{accuracyStats.missed}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={startGame}
              className="rounded-full bg-gradient-to-r from-green-500 to-blue-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition-transform hover:scale-105"
            >
              Play Again
            </button>
            <button
              onClick={() => {
                setRewardsGiven(true)
                onBack()
              }}
              className="rounded-full bg-gradient-to-r from-gray-600 to-gray-800 px-8 py-4 text-lg font-bold text-white shadow-lg transition-transform hover:scale-105"
            >
              Back to Playlist
            </button>
          </div>
        </div>
      )}

      {gameFailed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-30">
          <div className="mb-4 text-6xl text-red-500 animate-pulse">FAILED!</div>
          <h2 className="mb-6 text-3xl font-bold text-white">You missed too many notes!</h2>
          <p className="mb-6 text-xl text-gray-300">Score: {Math.floor(score)}</p>

          <div className="mb-8 flex items-center justify-center">
            <div className="flex">
              {Array.from({ length: MAX_MISSES }).map((_, i) => (
                <Heart key={i} className="h-8 w-8 mx-1 text-gray-500 opacity-40" fill="none" strokeWidth={1.5} />
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={onBack}
              className="rounded-full bg-gradient-to-r from-gray-600 to-gray-800 px-8 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105"
            >
              Back to Playlist
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default GameUI
