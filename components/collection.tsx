"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useGameState, type ItemType, type Item } from "@/hooks/use-game-state"
import { ArrowLeft, Guitar, Shirt, Speaker, Layers, Music, Play, ChevronDown } from "lucide-react"
import Playlist from "@/components/playlist"

// Add shimmer effect styles
const shimmerStyles = `
  .shimmer-container {
    position: relative;
    overflow: hidden;
  }
  
  .shimmer-effect {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: skewX(-20deg);
    animation: shimmer 3s infinite;
    z-index: 1;
    pointer-events: none;
  }
  
  @keyframes shimmer {
    0% {
      transform: translateX(-100%) skewX(-20deg);
    }
    100% {
      transform: translateX(200%) skewX(-20deg);
    }
  }

  @keyframes modalOpen {
    0% {
      transform: translate(calc(var(--start-x) - 50%), calc(var(--start-y) - 50%)) scale(var(--start-scale));
      opacity: 0.5;
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  }

  .modal-animating {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transform-origin: center;
    animation: modalOpen 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
`

export default function Collection({ onBack }: { onBack: () => void }) {
  const { items, selectSong, selectedSong } = useGameState()
  const [filter, setFilter] = useState<ItemType | "all">("all")
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [modalAnimation, setModalAnimation] = useState({
    animating: false,
    startRect: null as DOMRect | null,
  })
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (dropdownOpen && !target.closest(".dropdown-container")) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    // Set CSS variables for animation when modal opens
    if (modalAnimation.startRect && modalAnimation.animating && selectedItem) {
      const rect = modalAnimation.startRect
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // Calculate the scale factor between the card and modal
      const scaleX = rect.width / (viewportWidth * 0.9)
      const scaleY = rect.height / (viewportHeight * 0.85)
      const scale = Math.max(scaleX, scaleY)

      document.documentElement.style.setProperty("--start-x", `${rect.left + rect.width / 2}px`)
      document.documentElement.style.setProperty("--start-y", `${rect.top + rect.height / 2}px`)
      document.documentElement.style.setProperty("--start-scale", `${scale}`)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownOpen, modalAnimation, selectedItem])

  // Filter items by type
  const filteredItems = filter === "all" ? items : items.filter((item) => item.type === filter)

  // Count items by type
  const counts = {
    all: items.length,
    guitar: items.filter((item) => item.type === "guitar").length,
    clothing: items.filter((item) => item.type === "clothing").length,
    amp: items.filter((item) => item.type === "amp").length,
    fretboard: items.filter((item) => item.type === "fretboard").length,
    song: items.filter((item) => item.type === "song").length,
  }

  // Get background color based on rarity
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "from-gray-600 to-gray-800"
      case "rare":
        return "from-blue-600 to-blue-800"
      case "epic":
        return "from-purple-600 to-purple-800"
      case "legendary":
        return "from-yellow-500 to-yellow-700"
      default:
        return "from-gray-600 to-gray-800"
    }
  }

  // Get border color based on rarity
  const getRarityBorderColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "border-gray-400"
      case "rare":
        return "border-blue-400"
      case "epic":
        return "border-purple-400"
      case "legendary":
        return "border-yellow-400"
      default:
        return "border-gray-400"
    }
  }

  // Get text color based on rarity
  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "text-gray-200"
      case "rare":
        return "text-blue-200"
      case "epic":
        return "text-purple-200"
      case "legendary":
        return "text-yellow-200"
      default:
        return "text-gray-200"
    }
  }

  // Get icon for item type
  const getTypeIcon = (type: ItemType) => {
    switch (type) {
      case "guitar":
        return <Guitar className="h-5 w-5 text-white" />
      case "clothing":
        return <Shirt className="h-5 w-5 text-white" />
      case "amp":
        return <Speaker className="h-5 w-5 text-white" />
      case "fretboard":
        return <Layers className="h-5 w-5 text-white" />
      case "song":
        return <Music className="h-5 w-5 text-white" />
    }
  }

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-400"
      case "medium":
        return "text-yellow-400"
      case "hard":
        return "text-orange-400"
      case "expert":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  // Handle selecting a song
  const handleSelectSong = (song: Item) => {
    selectSong(song)
    setSelectedItem(null)
    setShowPlaylist(true)
  }

  // Show item details
  const showItemDetails = (item: Item, event?: React.MouseEvent) => {
    // Get the clicked element's position and dimensions
    const cardElement = cardRefs.current.get(item.id)
    if (cardElement) {
      const rect = cardElement.getBoundingClientRect()
      setModalAnimation({
        animating: true,
        startRect: rect,
      })

      // Set the selected item after a short delay to allow animation to start
      setTimeout(() => {
        setSelectedItem(item)
      }, 50)
    } else {
      // Fallback if ref not found
      setSelectedItem(item)
    }
  }

  // Close item details
  const closeItemDetails = () => {
    setSelectedItem(null)
  }

  const handleAnimationEnd = () => {
    setModalAnimation((prev) => ({ ...prev, animating: false }))
  }

  // Handle back from playlist
  const handleBackFromPlaylist = () => {
    setShowPlaylist(false)
  }

  // If showing playlist, render the playlist component
  if (showPlaylist) {
    return <Playlist onBack={handleBackFromPlaylist} />
  }

  return (
    <div className="flex flex-col">
      <style>{shimmerStyles}</style>
      {/* Header */}
      <div className="mb-6 flex items-center">
        <button onClick={onBack} className="flex items-center text-white">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Home
        </button>
      </div>

      <h2 className="mb-6 text-3xl font-bold text-white">Your Collection</h2>

      {/* Category dropdown */}
      <div className="mb-6 relative dropdown-container">
        <div
          className="flex items-center justify-between rounded-lg bg-gray-800 p-3 cursor-pointer"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <div className="flex items-center">
            {filter === "all" ? null : getTypeIcon(filter as ItemType)}
            <span className="ml-2 font-medium text-white">
              {filter === "all"
                ? "All Items"
                : filter === "guitar"
                  ? "Guitars"
                  : filter === "clothing"
                    ? "Clothing"
                    : filter === "amp"
                      ? "Amps"
                      : filter === "fretboard"
                        ? "Fretboards"
                        : "Songs"}
            </span>
            <span className="ml-2 rounded-full bg-black bg-opacity-30 px-2 py-0.5 text-xs text-gray-300">
              {filter === "all" ? counts.all : counts[filter]}
            </span>
          </div>
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </div>

        {dropdownOpen && (
          <div className="absolute z-10 mt-1 w-full rounded-lg bg-gray-800 shadow-lg overflow-hidden">
            <div className="p-1">
              <DropdownItem
                label="All Items"
                count={counts.all}
                active={filter === "all"}
                onClick={() => {
                  setFilter("all")
                  setDropdownOpen(false)
                }}
                icon={null}
              />
              <DropdownItem
                label="Guitars"
                count={counts.guitar}
                active={filter === "guitar"}
                onClick={() => {
                  setFilter("guitar")
                  setDropdownOpen(false)
                }}
                icon={<Guitar className="h-4 w-4 text-white" />}
              />
              <DropdownItem
                label="Clothing"
                count={counts.clothing}
                active={filter === "clothing"}
                onClick={() => {
                  setFilter("clothing")
                  setDropdownOpen(false)
                }}
                icon={<Shirt className="h-4 w-4 text-white" />}
              />
              <DropdownItem
                label="Amps"
                count={counts.amp}
                active={filter === "amp"}
                onClick={() => {
                  setFilter("amp")
                  setDropdownOpen(false)
                }}
                icon={<Speaker className="h-4 w-4 text-white" />}
              />
              <DropdownItem
                label="Fretboards"
                count={counts.fretboard}
                active={filter === "fretboard"}
                onClick={() => {
                  setFilter("fretboard")
                  setDropdownOpen(false)
                }}
                icon={<Layers className="h-4 w-4 text-white" />}
              />
              <DropdownItem
                label="Songs"
                count={counts.song}
                active={filter === "song"}
                onClick={() => {
                  setFilter("song")
                  setDropdownOpen(false)
                }}
                icon={<Music className="h-4 w-4 text-white" />}
              />
            </div>
          </div>
        )}
      </div>

      {/* Items grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="cursor-pointer relative overflow-hidden shimmer-container"
              onClick={(e) => showItemDetails(item, e)}
              style={{ aspectRatio: "1500/2100" }}
              ref={(el) => {
                if (el) cardRefs.current.set(item.id, el)
                else cardRefs.current.delete(item.id)
              }}
            >
              <div className="shimmer-effect"></div>
              <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-full w-full object-contain" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg bg-gray-800 bg-opacity-50 p-12 text-center">
          <p className="mb-4 text-xl text-gray-400">No items in your collection yet!</p>
          <p className="text-gray-500">Play songs to earn emeralds and buy card packs in the store.</p>
        </div>
      )}

      {/* Item details modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
          <div
            className={`relative shimmer-container ${modalAnimation.animating ? "modal-animating" : ""}`}
            style={{
              maxWidth: "90vw",
              maxHeight: "85vh",
              width: "auto",
              height: "auto",
            }}
            onAnimationEnd={handleAnimationEnd}
          >
            <div className="shimmer-effect"></div>
            <img
              src={selectedItem.image || "/placeholder.svg"}
              alt={selectedItem.name}
              className="h-auto w-full object-contain"
              style={{ maxHeight: "80vh" }}
            />
            <button
              onClick={closeItemDetails}
              className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-2 text-white"
            >
              ✕
            </button>
            {selectedItem.type === "song" && (
              <button
                onClick={() => handleSelectSong(selectedItem)}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-4 py-2 rounded-full text-white flex items-center"
              >
                <Play className="mr-2 h-5 w-5" />
                Play
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Filter tab component
interface FilterTabProps {
  label: string
  count: number
  active: boolean
  onClick: () => void
  icon: React.ReactNode | null
}

function FilterTab({ label, count, active, onClick, icon }: FilterTabProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-white bg-opacity-20 text-white"
          : "bg-gray-800 bg-opacity-50 text-gray-400 hover:bg-opacity-70 hover:text-gray-300"
      }`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
      <span className="ml-2 rounded-full bg-black bg-opacity-30 px-2 py-0.5 text-xs">{count}</span>
    </button>
  )
}

// Dropdown item component
interface DropdownItemProps {
  label: string
  count: number
  active: boolean
  onClick: () => void
  icon: React.ReactNode | null
}

function DropdownItem({ label, count, active, onClick, icon }: DropdownItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-2 rounded cursor-pointer ${
        active ? "bg-white bg-opacity-10" : "hover:bg-white hover:bg-opacity-5"
      }`}
    >
      <div className="flex items-center">
        {icon && <span className="mr-2 text-gray-400">{icon}</span>}
        <span className={`${active ? "text-white" : "text-gray-300"}`}>{label}</span>
      </div>
      <span className="rounded-full bg-black bg-opacity-30 px-2 py-0.5 text-xs text-gray-400">{count}</span>
    </div>
  )
}
