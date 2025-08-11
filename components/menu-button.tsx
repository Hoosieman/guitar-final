"use client"

// Update the MenuButton component to be more mobile-friendly
function MenuButton({ label, description, onClick, gradient, icon }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center rounded-lg bg-gradient-to-r ${gradient} p-3 text-left text-white shadow-lg transition-transform hover:scale-105 active:scale-95`}
    >
      <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-white bg-opacity-20">
        {icon || <Sparkles className="h-5 w-5" />}
      </div>
      <div>
        <h3 className="text-lg font-bold">{label}</h3>
        <p className="text-xs text-white text-opacity-80">{description}</p>
      </div>
    </button>
  )
}

