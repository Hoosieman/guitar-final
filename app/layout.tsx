import type React from "react"
import { GameStateProvider } from "@/hooks/use-game-state"
import { Germania_One } from "next/font/google"
import "./globals.css"

// Initialize the Germania One font
const germaniaOne = Germania_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-germania-one",
})

export const metadata = {
  generator: "v0.dev",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={germaniaOne.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="touch-manipulation font-germania">
        <GameStateProvider>{children}</GameStateProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/service-worker.js');
              });
            }
          `,
          }}
        />
      </body>
    </html>
  )
}

