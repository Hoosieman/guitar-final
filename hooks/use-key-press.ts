"use client"

import { useState, useEffect } from "react"

export function useKeyPress(targetKeyCode: number): boolean {
  const [isPressed, setIsPressed] = useState(false)

  useEffect(() => {
    const downHandler = (event: KeyboardEvent) => {
      if (event.keyCode === targetKeyCode) {
        setIsPressed(true)
      }
    }

    const upHandler = (event: KeyboardEvent) => {
      if (event.keyCode === targetKeyCode) {
        setIsPressed(false)
      }
    }

    window.addEventListener("keydown", downHandler)
    window.addEventListener("keyup", upHandler)

    return () => {
      window.removeEventListener("keydown", downHandler)
      window.removeEventListener("keyup", upHandler)
    }
  }, [targetKeyCode])

  return isPressed
}

// Add a new hook to track both press and release events
export function useKeyPressWithEvents(targetKeyCode: number): {
  isPressed: boolean
  pressedTime: number | null
} {
  const [isPressed, setIsPressed] = useState(false)
  const [pressedTime, setPressedTime] = useState<number | null>(null)

  useEffect(() => {
    const downHandler = (event: KeyboardEvent) => {
      if (event.keyCode === targetKeyCode) {
        setIsPressed(true)
        setPressedTime(performance.now())
      }
    }

    const upHandler = (event: KeyboardEvent) => {
      if (event.keyCode === targetKeyCode) {
        setIsPressed(false)
        setPressedTime(null)
      }
    }

    window.addEventListener("keydown", downHandler)
    window.addEventListener("keyup", upHandler)

    return () => {
      window.removeEventListener("keydown", downHandler)
      window.removeEventListener("keyup", upHandler)
    }
  }, [targetKeyCode])

  return { isPressed, pressedTime }
}

