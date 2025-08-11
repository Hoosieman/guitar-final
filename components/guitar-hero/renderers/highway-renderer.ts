import { HIGHWAY_TOP_WIDTH_RATIO, HIGHWAY_BOTTOM_WIDTH_RATIO, PERSPECTIVE_START_Y_RATIO, MAX_MISSES } from "../types"

// Draw a heart shape
export const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
  const halfSize = size / 2
  ctx.moveTo(x, y + halfSize / 2)
  ctx.bezierCurveTo(x - halfSize / 2, y - halfSize / 2, x - size, y, x, y + size)
  ctx.bezierCurveTo(x + size, y + halfSize / 2, x + halfSize / 2, y - halfSize / 2, x, y + halfSize / 2)
}

// Draw the static parts of the highway (background, edges, fret line, progress bar, etc.)
export const drawHighwayBackground = (
  ctx: CanvasRenderingContext2D,
  gameDimensions: { width: number; height: number; fretY: number },
  isMobile: boolean,
  highwayTexture: HTMLCanvasElement | null,
  songProgressRef: { current: number },
  missCountRef: { current: number },
  showMissWarning: boolean,
  currentSection: string,
) => {
  const { width: gameWidth, height: gameHeight, fretY } = gameDimensions
  const perspectiveStartY = gameHeight * PERSPECTIVE_START_Y_RATIO
  const highwayTopWidth = gameWidth * HIGHWAY_TOP_WIDTH_RATIO
  const highwayBottomWidth = gameWidth * (isMobile ? 1.0 : HIGHWAY_BOTTOM_WIDTH_RATIO)

  // Draw background
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, gameWidth, gameHeight)

  // Draw 3D highway with metallic mesh look
  ctx.fillStyle = "#111"
  ctx.beginPath()
  ctx.moveTo((gameWidth - highwayTopWidth) / 2, perspectiveStartY)
  ctx.lineTo((gameWidth + highwayTopWidth) / 2, perspectiveStartY)
  ctx.lineTo((gameWidth + highwayBottomWidth) / 2, gameHeight)
  ctx.lineTo((gameWidth - highwayBottomWidth) / 2, gameHeight)
  ctx.closePath()
  ctx.fill()

  // Apply highway texture if available
  if (highwayTexture) {
    ctx.save()
    ctx.globalAlpha = 1.0
    ctx.beginPath()
    ctx.moveTo((gameWidth - highwayTopWidth) / 2, perspectiveStartY)
    ctx.lineTo((gameWidth + highwayTopWidth) / 2, perspectiveStartY)
    ctx.lineTo((gameWidth + highwayBottomWidth) / 2, gameHeight)
    ctx.lineTo((gameWidth - highwayBottomWidth) / 2, gameHeight)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(highwayTexture, 0, 0, gameWidth, gameHeight)
    ctx.restore()
  }

  // Add blue glow on the edges
  const edgeGlowWidth = 4

  // Left edge glow
  const leftGradient = ctx.createLinearGradient(
    (gameWidth - highwayBottomWidth) / 2 - edgeGlowWidth,
    gameHeight,
    (gameWidth - highwayBottomWidth) / 2 + edgeGlowWidth,
    gameHeight,
  )
  leftGradient.addColorStop(0, "rgba(0, 162, 255, 0.8)")
  leftGradient.addColorStop(1, "rgba(0, 162, 255, 0)")

  ctx.beginPath()
  ctx.moveTo((gameWidth - highwayTopWidth) / 2 - edgeGlowWidth, perspectiveStartY)
  ctx.lineTo((gameWidth - highwayTopWidth) / 2 + edgeGlowWidth, perspectiveStartY)
  ctx.lineTo((gameWidth - highwayBottomWidth) / 2 + edgeGlowWidth, gameHeight)
  ctx.lineTo((gameWidth - highwayBottomWidth) / 2 - edgeGlowWidth, gameHeight)
  ctx.closePath()
  ctx.fillStyle = leftGradient
  ctx.fill()

  // Right edge glow
  const rightGradient = ctx.createLinearGradient(
    (gameWidth + highwayBottomWidth) / 2 - edgeGlowWidth,
    gameHeight,
    (gameWidth + highwayBottomWidth) / 2 + edgeGlowWidth,
    gameHeight,
  )
  rightGradient.addColorStop(0, "rgba(0, 162, 255, 0)")
  rightGradient.addColorStop(1, "rgba(0, 162, 255, 0.8)")

  ctx.beginPath()
  ctx.moveTo((gameWidth + highwayTopWidth) / 2 - edgeGlowWidth, perspectiveStartY)
  ctx.lineTo((gameWidth + highwayTopWidth) / 2 + edgeGlowWidth, perspectiveStartY)
  ctx.lineTo((gameWidth + highwayBottomWidth) / 2 + edgeGlowWidth, gameHeight)
  ctx.lineTo((gameWidth + highwayBottomWidth) / 2 - edgeGlowWidth, gameHeight)
  ctx.closePath()
  ctx.fillStyle = rightGradient
  ctx.fill()

  // Draw lane dividers - make them white and more visible
  ctx.strokeStyle = "rgba(255, 255, 255, 0.7)"
  ctx.lineWidth = 2

  // Draw vertical lines for each lane
  for (let i = 0; i < 5; i++) {
    // Calculate the lane center at the top of the highway (perspective start)
    const topRatio = i / 5 + 0.5 / 5
    const topX = (gameWidth - highwayTopWidth) / 2 + highwayTopWidth * topRatio

    // Calculate the lane center at the bottom of the highway
    const bottomRatio = i / 5 + 0.5 / 5
    const bottomX = (gameWidth - highwayBottomWidth) / 2 + highwayBottomWidth * bottomRatio

    ctx.beginPath()
    ctx.moveTo(topX, perspectiveStartY)
    ctx.lineTo(bottomX, gameHeight)
    ctx.stroke()
  }

  // Draw fret line with metallic look
  const leftX = (gameWidth - highwayBottomWidth) / 2
  const rightX = (gameWidth + highwayBottomWidth) / 2
  const fretGradient = ctx.createLinearGradient(leftX, fretY - 5, leftX, fretY + 5)
  fretGradient.addColorStop(0, "#666")
  fretGradient.addColorStop(0.5, "#fff")
  fretGradient.addColorStop(1, "#666")

  ctx.strokeStyle = fretGradient
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(leftX, fretY)
  ctx.lineTo(rightX, fretY)
  ctx.stroke()

  // Add glow to fret line
  const fretGlow = ctx.createLinearGradient(0, fretY - 10, 0, fretY + 10)
  fretGlow.addColorStop(0, "rgba(255, 255, 255, 0)")
  fretGlow.addColorStop(0.5, "rgba(255, 255, 255, 0.4)")
  fretGlow.addColorStop(1, "rgba(255, 255, 255, 0)")

  ctx.fillStyle = fretGlow
  ctx.fillRect(leftX, fretY - 5, rightX - leftX, 10)

  // Draw progress bar - ensure progress is clamped between 0-100%
  const progressBarHeight = Math.max(6, gameHeight * 0.014)
  const progressBarY = gameHeight * 0.03
  const clampedProgress = Math.max(0, Math.min(100, songProgressRef.current))

  // Draw progress bar background
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)"
  ctx.fillRect(gameWidth * 0.08, progressBarY, gameWidth * 0.84, progressBarHeight)

  // Draw progress bar fill - only if we have progress
  if (clampedProgress > 0) {
    ctx.fillStyle = "rgba(0, 255, 128, 0.8)"
    const progressWidth = gameWidth * 0.84 * (clampedProgress / 100)
    ctx.fillRect(gameWidth * 0.08, progressBarY, progressWidth, progressBarHeight)
  }

  // Draw hearts for lives
  const heartSize = Math.max(12, gameWidth * 0.033)
  const heartSpacing = Math.max(3, gameWidth * 0.008)
  const heartsStartX = gameWidth * 0.08
  const heartsY = progressBarY + progressBarHeight + heartSize * 0.75

  for (let i = 0; i < MAX_MISSES; i++) {
    const heartX = heartsStartX + i * (heartSize + heartSpacing)

    if (i < MAX_MISSES - missCountRef.current) {
      ctx.fillStyle =
        showMissWarning && MAX_MISSES - missCountRef.current <= 3 ? "rgba(255, 50, 50, 0.8)" : "rgba(255, 50, 50, 0.6)"
      ctx.beginPath()
      drawHeart(ctx, heartX, heartsY, heartSize)
      ctx.fill()
    } else {
      ctx.strokeStyle = "rgba(255, 50, 50, 0.3)"
      ctx.lineWidth = 1.5
      ctx.beginPath()
      drawHeart(ctx, heartX, heartsY, heartSize)
      ctx.stroke()
    }
  }

  // Show warning if low on lives
  if (showMissWarning) {
    const warningText = `${MAX_MISSES - missCountRef.current} LIVES LEFT!`
    ctx.font = `bold ${Math.max(12, gameWidth * 0.027)}px Arial`
    ctx.fillStyle = "rgba(255, 50, 50, 0.8)"
    ctx.textAlign = "right"
    ctx.fillText(warningText, gameWidth * 0.92, heartsY + heartSize * 0.25)
  }

  // Show current section if available
  if (currentSection) {
    ctx.font = `bold ${Math.max(14, gameWidth * 0.03)}px Arial`
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
    ctx.textAlign = "right"
    ctx.fillText(currentSection, gameWidth * 0.95, gameHeight * 0.1)
  }
}

// Draw just the moving horizontal lines for the highway
export const drawHighwayLines = (
  ctx: CanvasRenderingContext2D,
  gameDimensions: { width: number; height: number; fretY: number },
  isMobile: boolean,
  horizontalLineOffsetRef: { current: number },
) => {
  const { width: gameWidth, height: gameHeight } = gameDimensions
  const perspectiveStartY = gameHeight * PERSPECTIVE_START_Y_RATIO
  const highwayTopWidth = gameWidth * HIGHWAY_TOP_WIDTH_RATIO
  const highwayBottomWidth = gameWidth * (isMobile ? 1.0 : HIGHWAY_BOTTOM_WIDTH_RATIO)

  // Draw horizontal lines for depth with movement
  const lineSpacing = (gameHeight - perspectiveStartY) / 5
  const totalLines = 4

  for (let i = 0; i < totalLines; i++) {
    // Calculate the base position for this line
    const basePosition = perspectiveStartY + i * lineSpacing

    // Apply the offset with modulo to create smooth looping movement
    let offsetY = basePosition + horizontalLineOffsetRef.current

    // If the line goes off-screen, loop it back to the top with proper spacing
    if (offsetY > gameHeight) {
      offsetY = perspectiveStartY + (offsetY - gameHeight) - lineSpacing
    }

    // Only draw if the line is in the visible area
    if (offsetY >= perspectiveStartY && offsetY <= gameHeight) {
      const perspectiveRatio = Math.min(
        1,
        Math.max(0, (offsetY - perspectiveStartY) / (gameHeight - perspectiveStartY)),
      )
      const currentWidth = highwayTopWidth + (highwayBottomWidth - highwayTopWidth) * perspectiveRatio
      const leftX = (gameWidth - currentWidth) / 2
      const rightX = leftX + currentWidth

      ctx.beginPath()
      ctx.moveTo(leftX, offsetY)
      ctx.lineTo(rightX, offsetY)
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + 0.3 * perspectiveRatio})`
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }
}

// Original combined function (kept for compatibility)
export const drawHighway = (
  ctx: CanvasRenderingContext2D,
  gameDimensions: { width: number; height: number; fretY: number },
  isMobile: boolean,
  highwayTexture: HTMLCanvasElement | null,
  horizontalLineOffsetRef: { current: number },
  songProgressRef: { current: number },
  missCountRef: { current: number },
  showMissWarning: boolean,
  currentSection: string,
) => {
  // Draw the static background elements
  drawHighwayBackground(
    ctx,
    gameDimensions,
    isMobile,
    highwayTexture,
    songProgressRef,
    missCountRef,
    showMissWarning,
    currentSection,
  )

  // Draw the moving horizontal lines
  drawHighwayLines(ctx, gameDimensions, isMobile, horizontalLineOffsetRef)
}
