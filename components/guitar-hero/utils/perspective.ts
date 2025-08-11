import { HIGHWAY_TOP_WIDTH_RATIO, HIGHWAY_BOTTOM_WIDTH_RATIO, PERSPECTIVE_START_Y_RATIO, FRETS } from "../types"

// Calculate the X position of a note based on its lane and Y position
export const calculatePerspectiveX = (
  laneIndex: number,
  noteY: number,
  gameWidth: number,
  gameHeight: number,
  isMobile: boolean,
): number => {
  const highwayTopWidth = gameWidth * HIGHWAY_TOP_WIDTH_RATIO
  const highwayBottomWidth = gameWidth * (isMobile ? 1.0 : HIGHWAY_BOTTOM_WIDTH_RATIO)
  const perspectiveStartY = gameHeight * PERSPECTIVE_START_Y_RATIO

  // Calculate the perspective ratio based on the note's Y position
  const perspectiveRatio = Math.max(0, Math.min(1, (noteY - perspectiveStartY) / (gameHeight - perspectiveStartY)))

  // Calculate the current width of the highway at the note's Y position
  const currentWidth = highwayTopWidth + (highwayBottomWidth - highwayTopWidth) * perspectiveRatio
  const leftEdge = (gameWidth - currentWidth) / 2

  // Calculate the X position within the current width based on the lane index
  const lanePosition = laneIndex / FRETS.length
  return leftEdge + currentWidth * lanePosition + currentWidth / FRETS.length / 2
}

// Calculate the size of a note based on its Y position with perspective distortion
export const calculateNoteSize = (noteY: number, gameHeight: number) => {
  const perspectiveStartY = gameHeight * PERSPECTIVE_START_Y_RATIO
  const baseSize = 18 // Keeping the increased base size

  // Calculate the perspective ratio based on the note's Y position
  const perspectiveRatio = Math.max(0, Math.min(1, (noteY - perspectiveStartY) / (gameHeight - perspectiveStartY)))

  // Reduced vertical scaling to create more elliptical shape
  const verticalScale = 0.6 + 0.4 * perspectiveRatio
  // Maintained or slightly increased horizontal scaling
  const horizontalScale = 0.9 + 1.2 * perspectiveRatio

  return {
    vertical: baseSize * verticalScale,
    horizontal: baseSize * horizontalScale,
    base: baseSize,
  }
}

// Calculate lane positions for the highway
export const calculateLanePositions = (gameWidth: number, gameHeight: number, fretY: number, isMobile: boolean) => {
  const highwayTopWidth = gameWidth * HIGHWAY_TOP_WIDTH_RATIO
  const highwayBottomWidth = gameWidth * (isMobile ? 1.0 : HIGHWAY_BOTTOM_WIDTH_RATIO)
  const perspectiveStartY = gameHeight * PERSPECTIVE_START_Y_RATIO

  // Calculate horizontal line positions for the 3D highway
  const horizontalLinePositions = []
  const lineSpacing = (gameHeight - perspectiveStartY) / 10
  for (let i = 0; i < 15; i++) {
    horizontalLinePositions.push(perspectiveStartY + i * lineSpacing)
  }

  // Calculate lane positions
  const positions = []
  for (let i = 0; i <= FRETS.length; i++) {
    const lanePosition = i / FRETS.length

    // Calculate the perspective position at the fret line
    const perspectiveRatio = Math.max(0, Math.min(1, (fretY - perspectiveStartY) / (gameHeight - perspectiveStartY)))
    const currentWidth = highwayTopWidth + (highwayBottomWidth - highwayTopWidth) * perspectiveRatio
    const leftEdge = (gameWidth - currentWidth) / 2

    positions.push(leftEdge + currentWidth * lanePosition)
  }

  // Store lane center positions
  const lanePositions = []
  for (let i = 0; i < FRETS.length; i++) {
    lanePositions.push((positions[i] + positions[i + 1]) / 2)
  }

  return {
    horizontalLinePositions,
    lanePositions,
  }
}
