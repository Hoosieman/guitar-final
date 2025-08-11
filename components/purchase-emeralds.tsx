"use client"
import { motion } from "framer-motion"
import { X, Sparkles, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useGameState } from "@/hooks/use-game-state"

interface PurchaseEmeraldsProps {
  onClose: () => void
}

interface EmeraldPackage {
  id: string
  amount: number
  price: number
  bonus: number
  popular?: boolean
}

export default function PurchaseEmeralds({ onClose }: PurchaseEmeraldsProps) {
  const { addEmeralds } = useGameState()

  // Define emerald packages
  const emeraldPackages: EmeraldPackage[] = [
    { id: "small", amount: 100, price: 0.99, bonus: 0 },
    { id: "medium", amount: 500, price: 4.99, bonus: 50, popular: true },
    { id: "large", amount: 1000, price: 9.99, bonus: 150 },
    { id: "mega", amount: 2500, price: 19.99, bonus: 500 },
  ]

  const handlePurchase = (pkg: EmeraldPackage) => {
    // In a real app, this would integrate with a payment processor
    console.log(`Processing purchase for ${pkg.amount} emeralds at ${pkg.price}`)

    // Use the existing addEmeralds function from your game state
    addEmeralds(pkg.amount + pkg.bonus)
    onClose()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 15 }}
      >
        <Card className="border-2 border-cyan-200 bg-gradient-to-b from-white to-blue-50">
          <CardHeader className="relative pb-2">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-500 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
            <CardTitle className="flex items-center text-2xl text-cyan-700">
              <Sparkles className="mr-2 h-6 w-6 text-cyan-500" />
              Purchase Emeralds
            </CardTitle>
            <CardDescription>Emeralds are used to purchase card packs and special items in the game</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {emeraldPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative rounded-xl border-2 ${
                  pkg.popular ? "border-cyan-400 bg-gradient-to-r from-cyan-50 to-blue-50" : "border-gray-200"
                } p-4 transition-all hover:shadow-md`}
              >
                {pkg.popular && (
                  <div className="absolute -right-1 -top-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                    BEST VALUE
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-400">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {pkg.amount} <span className="text-cyan-600">Emeralds</span>
                      </h3>
                      {pkg.bonus > 0 && (
                        <p className="text-xs font-medium text-green-600">+{pkg.bonus} bonus emeralds!</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">${pkg.price}</p>
                    <Button
                      size="sm"
                      onClick={() => handlePurchase(pkg)}
                      className="mt-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                    >
                      <CreditCard className="mr-1 h-4 w-4" /> Buy
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex flex-col text-xs text-gray-500">
            <p>All purchases are processed securely. Emeralds will be added to your account immediately.</p>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  )
}
