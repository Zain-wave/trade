"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Wallet, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface DepositModalProps {
  open: boolean
  onClose: () => void
}

type PaymentMethod = "stripe" | "mercadopago"
type Step = "amount" | "payment" | "processing" | "success"

const PRESET_AMOUNTS = [50, 100, 250, 500]

export function DepositModal({ open, onClose }: DepositModalProps) {
  const { refreshWallets } = useAuth()
  const [step, setStep] = useState<Step>("amount")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<PaymentMethod>("stripe")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const parsedAmount = parseFloat(amount)
  const isValidAmount = parsedAmount >= 10

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setStep("amount")
      setAmount("")
      setError("")
    }, 300)
  }

  const handleProceed = () => {
    if (!isValidAmount) {
      setError("Minimum deposit is $10")
      return
    }
    setError("")
    setStep("payment")
  }

  const handlePay = async () => {
    setIsLoading(true)
    setError("")
    setStep("processing")

    try {
      if (method === "stripe") {
        // Crear intent
        const intentRes = await fetch("/api/payments/stripe/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: parsedAmount }),
        })
        const intentData = await intentRes.json()
        if (!intentRes.ok) throw new Error(intentData.error)

        // Si es simulado, confirmar directo
        if (intentData.simulated) {
          await confirmDeposit("stripe", `simulated-${Date.now()}`)
          return
        }

        // Aquí iría Stripe Elements real cuando tengas la key
        // Por ahora si llegó clientSecret real también confirmamos
        await confirmDeposit("stripe", intentData.clientSecret)

      } else if (method === "mercadopago") {
        // Simulado hasta tener credenciales
        if (process.env.NEXT_PUBLIC_MERCADOPAGO_ENABLED !== "true") {
          await new Promise(r => setTimeout(r, 1500)) // simular latencia
          await confirmDeposit("mercadopago", `mp-simulated-${Date.now()}`)
          return
        }
        // Aquí iría redirect a MercadoPago checkout cuando tengas credenciales
      }
    } catch (err: any) {
      setError(err.message)
      setStep("payment")
      setIsLoading(false)
    }
  }

  const confirmDeposit = async (method: string, reference: string) => {
    const res = await fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parsedAmount, method, reference }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)

    await refreshWallets()
    setStep("success")
    setIsLoading(false)
    toast.success(`$${parsedAmount} added to your wallet!`)
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="sm:max-w-md bg-[#111827] border-white/10">
        <DialogHeader>
          <DialogTitle>
            {step === "amount" && "Add Funds"}
            {step === "payment" && "Select Payment Method"}
            {step === "processing" && "Processing..."}
            {step === "success" && "Deposit Successful"}
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1 — Amount */}
        {step === "amount" && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map(preset => (
                <button
                  key={preset}
                  onClick={() => setAmount(String(preset))}
                  className={cn(
                    "py-2 rounded-lg text-sm font-mono font-semibold border transition-colors",
                    amount === String(preset)
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  ${preset}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={e => { setAmount(e.target.value); setError("") }}
                className="pl-8 bg-white/5 border-white/10 font-mono text-lg"
                min={10}
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {error}
              </p>
            )}

            <p className="text-xs text-muted-foreground">Minimum deposit: $10 USDT</p>

            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
              onClick={handleProceed}
              disabled={!isValidAmount}
            >
              Continue
            </Button>
          </div>
        )}

        {/* STEP 2 — Payment method */}
        {step === "payment" && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-white/5 flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Deposit amount</span>
              <span className="font-mono font-bold text-emerald-400">${parsedAmount.toFixed(2)}</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setMethod("stripe")}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-lg border transition-colors text-left",
                  method === "stripe"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                )}
              >
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="font-semibold text-sm">Credit / Debit Card</p>
                  <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex via Stripe</p>
                </div>
                {method === "stripe" && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>

              <button
                onClick={() => setMethod("mercadopago")}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-lg border transition-colors text-left",
                  method === "mercadopago"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                )}
              >
                <Wallet className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="font-semibold text-sm">MercadoPago</p>
                  <p className="text-xs text-muted-foreground">PSE, Nequi, Bancolombia y más</p>
                </div>
                {method === "mercadopago" && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {error}
              </p>
            )}

            <Separator className="bg-white/10" />

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-white/10"
                onClick={() => setStep("amount")}
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
                onClick={handlePay}
              >
                Pay ${parsedAmount.toFixed(2)}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Processing */}
        {step === "processing" && (
          <div className="py-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            <p className="text-muted-foreground text-sm">Processing your payment...</p>
          </div>
        )}

        {/* STEP 4 — Success */}
        {step === "success" && (
          <div className="py-4 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-400">Funds Added!</h3>
              <p className="text-muted-foreground text-sm mt-1">
                ${parsedAmount.toFixed(2)} USDT has been added to your wallet
              </p>
            </div>
            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
              onClick={handleClose}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}