// Create a highway texture pattern
export function createHighwayTexture(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")

  if (!ctx) return canvas

  // Fill with dark background
  ctx.fillStyle = "#111"
  ctx.fillRect(0, 0, width, height)

  // Add subtle pattern
  ctx.fillStyle = "#222"

  // Draw some random shapes for texture
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const size = 2 + Math.random() * 5

    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }

  // Add some subtle lines
  ctx.strokeStyle = "#333"
  ctx.lineWidth = 1

  for (let i = 0; i < 20; i++) {
    const x1 = Math.random() * width
    const y1 = Math.random() * height
    const x2 = x1 + (Math.random() * 100 - 50)
    const y2 = y1 + (Math.random() * 100 - 50)

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  return canvas
}

