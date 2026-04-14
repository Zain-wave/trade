"use client"

import { Suspense } from "react"
import { WalletContent } from "./wallet-content"

export default function WalletPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    }>
      <WalletContent />
    </Suspense>
  )
}