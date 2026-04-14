"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export interface Asset {
  id: string
  symbol: string
  name: string
  type: "stock" | "crypto" | "forex" | "commodity"
  current_price: number
  price_change_24h: number
  price_change_percent_24h: number
  market_cap: number | null
  volume_24h: number | null
  high_24h: number | null
  low_24h: number | null
  logo_url: string | null
  is_active: boolean
}

interface MarketContextType {
  assets: Asset[]
  isLoading: boolean
  getAssetById: (id: string) => Asset | undefined
  getAssetBySymbol: (symbol: string) => Asset | undefined
  refreshAssets: () => Promise<void>
}

const MarketContext = createContext<MarketContextType | null>(null)

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAssets = useCallback(async () => {
    const { data } = await supabase
      .from("assets")
      .select("*")
      .eq("is_active", true)
      .order("market_cap", { ascending: false })
    if (data) setAssets(data)
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchAssets()
    // Refresca precios cada 30 segundos
    const interval = setInterval(fetchAssets, 30_000)
    return () => clearInterval(interval)
  }, [fetchAssets])

  const getAssetById = (id: string) => assets.find(a => a.id === id)
  const getAssetBySymbol = (symbol: string) => assets.find(a => a.symbol === symbol)

  return (
    <MarketContext.Provider value={{
      assets,
      isLoading,
      getAssetById,
      getAssetBySymbol,
      refreshAssets: fetchAssets,
    }}>
      {children}
    </MarketContext.Provider>
  )
}

export function useMarket() {
  const context = useContext(MarketContext)
  if (!context) throw new Error("useMarket must be used within MarketProvider")
  return context
}