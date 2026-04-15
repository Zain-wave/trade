"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useMarket, type Asset } from "@/context/market-context"
import { useBuyAsset } from "@/hooks/use-buy-asset"
import { cn } from "@/lib/utils"

interface BuyAssetModalProps {
  open: boolean
  onClose: () => void
  preselectedAsset?: Asset | null
}

export function BuyAssetModal({ open, onClose, preselectedAsset }: BuyAssetModalProps) {
  const { wallets, refreshWallets } = useAuth()
  const { assets } = useMarket()
  const { buyAsset, isLoading } = useBuyAsset()

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [inputMode, setInputMode] = useState<"usd" | "quantity">("usd")
  const [usdAmount, setUsdAmount] = useState("")
  const [quantityAmount, setQuantityAmount] = useState("")
  const [search, setSearch] = useState("")
  const [step, setStep] = useState<"select" | "confirm" | "success">("select")
  const [orderId, setOrderId] = useState("")

  const wallet = wallets.find(w => w.currency === "USDT")
  const balance = wallet?.available_balance ?? 0

  useEffect(() => {
    if (preselectedAsset) {
      setSelectedAsset(preselectedAsset)
      setStep("confirm")
    }
  }, [preselectedAsset, open])

  useEffect(() => {
    if (!open) {
      // reset on close
      setTimeout(() => {
        setStep(preselectedAsset ? "confirm" : "select")
        setUsdAmount("")
        setQuantityAmount("")
        setSearch("")
        if (!preselectedAsset) setSelectedAsset(null)
      }, 300)
    }
  }, [open, preselectedAsset])

  const filteredAssets = assets.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.symbol.toLowerCase().includes(search.toLowerCase())
  )

  const computedQuantity = selectedAsset && usdAmount
    ? Number(usdAmount) / selectedAsset.current_price
    : Number(quantityAmount)

  const computedUsd = selectedAsset && quantityAmount
    ? Number(quantityAmount) * selectedAsset.current_price
    : Number(usdAmount)

  const handleInputChange = (value: string) => {
    if (inputMode === "usd") {
      setUsdAmount(value)
      if (selectedAsset && value) {
        setQuantityAmount((Number(value) / selectedAsset.current_price).toFixed(6))
      } else {
        setQuantityAmount("")
      }
    } else {
      setQuantityAmount(value)
      if (selectedAsset && value) {
        setUsdAmount((Number(value) * selectedAsset.current_price).toFixed(2))
      } else {
        setUsdAmount("")
      }
    }
  }

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset)
    setStep("confirm")
  }

  const handleConfirm = async () => {
    if (!selectedAsset || computedUsd <= 0) return

    const result = await buyAsset({
      asset: selectedAsset,
      quantity: computedQuantity,
      amountUsd: computedUsd,
      onSuccess: () => {
        refreshWallets()
      },
    })

    if (result.success) {
      setOrderId(result.transaction?.id?.slice(0, 8).toUpperCase() ?? "N/A")
      setStep("success")
    }
  }

  const isInsufficient = computedUsd > balance
  const isValid = computedUsd > 0 && computedUsd <= balance && selectedAsset !== null

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#111827] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {step === "select" && "Buy Asset"}
            {step === "confirm" && `Buy ${selectedAsset?.symbol}`}
            {step === "success" && "Order Confirmed"}
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1 — Select asset */}
        {step === "select" && (
          <div className="space-y-3">
            <Input
              placeholder="Search asset (BTC, Apple...)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white/5 border-white/10"
              autoFocus
            />
            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
              {filteredAssets.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => handleSelectAsset(asset)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                      {asset.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{asset.symbol}</p>
                      <p className="text-xs text-muted-foreground">{asset.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono">${asset.current_price.toLocaleString()}</p>
                    <p className={cn(
                      "text-xs flex items-center justify-end gap-0.5",
                      asset.price_change_percent_24h >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      {asset.price_change_percent_24h >= 0
                        ? <ArrowUpRight className="w-3 h-3" />
                        : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(asset.price_change_percent_24h).toFixed(2)}%
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Confirm purchase */}
        {step === "confirm" && selectedAsset && (
          <div className="space-y-4">
            {/* Asset info */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">
                  {selectedAsset.symbol.slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold">{selectedAsset.symbol}</p>
                  <p className="text-xs text-muted-foreground">{selectedAsset.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-semibold">${selectedAsset.current_price.toLocaleString()}</p>
                <p className={cn(
                  "text-xs",
                  selectedAsset.price_change_percent_24h >= 0 ? "text-emerald-400" : "text-red-400"
                )}>
                  {selectedAsset.price_change_percent_24h >= 0 ? "+" : ""}
                  {selectedAsset.price_change_percent_24h.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Input mode toggle */}
            <Tabs value={inputMode} onValueChange={v => setInputMode(v as "usd" | "quantity")}>
              <TabsList className="w-full bg-white/5">
                <TabsTrigger value="usd" className="flex-1">Amount (USD)</TabsTrigger>
                <TabsTrigger value="quantity" className="flex-1">Quantity</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Amount input */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {inputMode === "usd" ? "$" : selectedAsset.symbol}
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={inputMode === "usd" ? usdAmount : quantityAmount}
                onChange={e => handleInputChange(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 font-mono text-lg"
                autoFocus
              />
            </div>

            {/* Summary */}
            <div className="space-y-2 p-3 rounded-lg bg-white/5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You pay</span>
                <span className="font-mono font-semibold text-white">
                  ${computedUsd > 0 ? computedUsd.toFixed(2) : "0.00"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">You receive</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {computedQuantity > 0 ? computedQuantity.toFixed(6) : "0.000000"} {selectedAsset.symbol}
                </span>
              </div>
              <Separator className="bg-white/10" />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Wallet className="w-3 h-3" /> Available
                </span>
                <span className={cn("font-mono text-xs", isInsufficient ? "text-red-400" : "text-muted-foreground")}>
                  ${balance.toFixed(2)} USDT
                </span>
              </div>
            </div>

            {isInsufficient && (
              <p className="text-xs text-red-400 text-center">
                Insufficient balance. Add funds to your wallet first.
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-white/10"
                onClick={() => {
                  setStep("select")
                  setUsdAmount("")
                  setQuantityAmount("")
                }}
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
                onClick={handleConfirm}
                disabled={!isValid || isLoading}
              >
                {isLoading ? "Processing..." : "Confirm Buy"}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Success */}
        {step === "success" && selectedAsset && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <TrendingUp className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-400">Purchase Successful!</h3>
              <p className="text-muted-foreground text-sm mt-1">
                You bought {computedQuantity.toFixed(6)} {selectedAsset.symbol}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono text-xs">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount paid</span>
                <span className="font-mono">${computedUsd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Asset</span>
                <span className="font-mono">{selectedAsset.symbol}</span>
              </div>
            </div>
            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}