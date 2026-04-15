import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Asset } from "@/context/market-context"

interface BuyAssetParams {
  asset: Asset
  quantity: number
  amountUsd: number
  onSuccess?: () => void
}

export function useBuyAsset() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const buyAsset = async ({ asset, quantity, amountUsd, onSuccess }: BuyAssetParams) => {
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // 1. Verificar balance disponible
      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .eq("currency", "USDT")
        .single()

      if (walletError || !wallet) throw new Error("Wallet not found")
      if (wallet.available_balance < amountUsd) throw new Error("Insufficient balance")

      // 2. Descontar del wallet
      const { error: deductError } = await supabase
        .from("wallets")
        .update({
          balance: wallet.balance - amountUsd,
          available_balance: wallet.available_balance - amountUsd,
        })
        .eq("id", wallet.id)

      if (deductError) throw new Error("Failed to deduct balance")

      // 3. Crear transacción
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          asset_id: asset.id,
          type: "buy",
          status: "completed",
          amount: amountUsd,
          price: asset.current_price,
          quantity: quantity,
          currency: "USDT",
          description: `Buy ${quantity} ${asset.symbol} @ $${asset.current_price}`,
        })
        .select()
        .single()

      if (txError) throw new Error("Failed to create transaction")

      // 4. Actualizar holdings (upsert)
      const { data: existingHolding } = await supabase
        .from("holdings")
        .select("*")
        .eq("user_id", user.id)
        .eq("asset_id", asset.id)
        .single()

      if (existingHolding) {
        const newQuantity = Number(existingHolding.quantity) + quantity
        const newTotalInvested = Number(existingHolding.total_invested) + amountUsd
        const newAvgPrice = newTotalInvested / newQuantity

        await supabase
          .from("holdings")
          .update({
            quantity: newQuantity,
            average_buy_price: newAvgPrice,
            total_invested: newTotalInvested,
          })
          .eq("id", existingHolding.id)
      } else {
        await supabase
          .from("holdings")
          .insert({
            user_id: user.id,
            asset_id: asset.id,
            quantity: quantity,
            average_buy_price: asset.current_price,
            total_invested: amountUsd,
          })
      }

      toast.success(`Successfully bought ${quantity} ${asset.symbol}`, {
        description: `$${amountUsd.toFixed(2)} deducted from your wallet`,
      })

      onSuccess?.()
      return { success: true, transaction }

    } catch (err: any) {
      toast.error("Purchase failed", { description: err.message })
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  return { buyAsset, isLoading }
}