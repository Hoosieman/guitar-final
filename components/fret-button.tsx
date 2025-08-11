interface FretButtonProps {
  color: string
  keyLabel: string
  active: boolean
  isHeld?: boolean
}

export default function FretButton({ color, keyLabel, active, isHeld }: FretButtonProps) {
  // Map color names to actual colors - simplified color scheme
  const colorMap: Record<string, string> = {
    green: "#008000",
    red: "#FF0000",
    yellow: "#FFCC00",
    blue: "#00CCFF",
    orange: "#FF6600",
  }

  const buttonColor = colorMap[color] || "#888888"

  // Reduced base size
  const baseWidth = 48
  const baseHeight = 48

  // Simplified styling - removed complex gradients and shadows
  return (
    <div className="flex flex-col items-center">
      <div
        style={{
          width: `${baseWidth}px`,
          height: `${baseHeight}px`,
          borderRadius: "50%",
          backgroundColor: active ? buttonColor : "#444444",
          border: isHeld ? "2px solid white" : "1px solid #888888",
          transform: "scale(1.6, 1.0)",
          transformOrigin: "center center",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Simplified inner circle - only shown when active */}
        {active && (
          <div
            style={{
              width: "50%",
              height: "50%",
              borderRadius: "50%",
              backgroundColor: "white",
              opacity: 0.8,
            }}
          />
        )}
      </div>
      <span className="mt-1 text-xs font-bold text-white">{keyLabel}</span>
    </div>
  )
}
