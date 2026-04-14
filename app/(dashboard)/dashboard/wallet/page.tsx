"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  CreditCard,
  Building2,
  Landmark,
  Copy,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function WalletPage() {
  const searchParams = useSearchParams()
  const initialAction = searchParams.get("action") || "overview"
  
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [activeTab, setActiveTab] = useState(initialAction)
  const [userId, setUserId] = useState<string | null>(null)

  // Deposit state
  const [depositAmount, setDepositAmount] = useState("")
  const [depositMethod, setDepositMethod] = useState("")
  const [depositLoading, setDepositLoading] = useState(false)
  const [depositSuccess, setDepositSuccess] = useState(false)

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawMethod, setWithdrawMethod] = useState("")
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawSuccess, setWithdrawSuccess] = useState(false)

  // Convert state
  const [convertHolding, setConvertHolding] = useState("")
  const [convertAmount, setConvertAmount] = useState("")
  const [convertLoading, setConvertLoading] = useState(false)
  const [convertSuccess, setConvertSuccess] = useState(false)
  const [holdings, setHoldings] = useState<any[]>([])

  // Add payment method state
  const [addMethodDialogOpen, setAddMethodDialogOpen] = useState(false)
  const [newMethodType, setNewMethodType] = useState("")
  const [newMethodDetails, setNewMethodDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    cryptoAddress: "",
  })

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Fetch wallet
      const { data: walletData } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single()
      setWallet(walletData)

      // Fetch payment methods
      const { data: methodsData } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
      setPaymentMethods(methodsData || [])

      // Fetch holdings for conversion
      const { data: holdingsData } = await supabase
        .from("holdings")
        .select(`
          *,
          assets (*)
        `)
        .eq("user_id", user.id)
        .gt("quantity", 0)
      setHoldings(holdingsData || [])

      // Fetch recent wallet transactions
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .in("type", ["deposit", "withdraw", "convert"])
        .order("created_at", { ascending: false })
        .limit(10)
      setRecentTransactions(transactionsData || [])

      setLoading(false)
    }
    fetchData()
  }, [supabase])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value)
  }

  const handleDeposit = async () => {
    if (!depositAmount || !depositMethod || !userId) return
    setDepositLoading(true)

    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      type: "deposit",
      total_amount: parseFloat(depositAmount),
      status: "pending",
      payment_method_id: depositMethod,
    })

    if (!error) {
      setDepositSuccess(true)
      setDepositAmount("")
      setTimeout(() => setDepositSuccess(false), 3000)
    }
    setDepositLoading(false)
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawMethod || !userId) return
    const amount = parseFloat(withdrawAmount)
    if (amount > (wallet?.usdt_balance || 0)) {
      alert("Insufficient balance")
      return
    }
    setWithdrawLoading(true)

    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      type: "withdraw",
      total_amount: amount,
      status: "pending",
      payment_method_id: withdrawMethod,
    })

    if (!error) {
      setWithdrawSuccess(true)
      setWithdrawAmount("")
      setTimeout(() => setWithdrawSuccess(false), 3000)
    }
    setWithdrawLoading(false)
  }

  const handleConvert = async () => {
    if (!convertHolding || !convertAmount || !userId) return
    const holding = holdings.find((h) => h.id === convertHolding)
    if (!holding) return

    const amount = parseFloat(convertAmount)
    if (amount > holding.quantity) {
      alert("Insufficient holding quantity")
      return
    }
    setConvertLoading(true)

    const totalValue = amount * holding.assets.current_price

    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      type: "convert",
      asset_id: holding.asset_id,
      quantity: amount,
      price_per_unit: holding.assets.current_price,
      total_amount: totalValue,
      status: "pending",
    })

    if (!error) {
      setConvertSuccess(true)
      setConvertAmount("")
      setConvertHolding("")
      setTimeout(() => setConvertSuccess(false), 3000)
    }
    setConvertLoading(false)
  }

  const handleAddPaymentMethod = async () => {
    if (!newMethodType || !userId) return

    let details = {}
    if (newMethodType === "card") {
      details = {
        last_four: newMethodDetails.cardNumber.slice(-4),
        expiry: newMethodDetails.expiryDate,
      }
    } else if (newMethodType === "bank") {
      details = {
        bank_name: newMethodDetails.bankName,
        account_last_four: newMethodDetails.accountNumber.slice(-4),
      }
    } else if (newMethodType === "crypto") {
      details = {
        address: newMethodDetails.cryptoAddress,
      }
    }

    const { error } = await supabase.from("payment_methods").insert({
      user_id: userId,
      type: newMethodType,
      details,
      is_verified: false,
      is_default: paymentMethods.length === 0,
    })

    if (!error) {
      setAddMethodDialogOpen(false)
      setNewMethodType("")
      setNewMethodDetails({
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        bankName: "",
        accountNumber: "",
        routingNumber: "",
        cryptoAddress: "",
      })
      // Refresh payment methods
      const { data } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", userId)
      setPaymentMethods(data || [])
    }
  }

  const getMethodIcon = (type: string) => {
    switch (type) {
      case "card":
        return <CreditCard className="h-5 w-5" />
      case "bank":
        return <Building2 className="h-5 w-5" />
      case "crypto":
        return <Landmark className="h-5 w-5" />
      default:
        return <Wallet className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Wallet</h2>
          <p className="text-muted-foreground">
            Manage your funds, deposits, and withdrawals
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setBalanceVisible(!balanceVisible)}
        >
          {balanceVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden md:col-span-2">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <CardHeader className="relative">
            <CardDescription>Total Balance</CardDescription>
            <CardTitle className="font-mono text-4xl">
              {balanceVisible ? formatCurrency(wallet?.balance || 0) : "••••••••"}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground">USDT Balance</p>
                <p className="font-mono text-lg font-semibold">
                  {balanceVisible ? formatCurrency(wallet?.usdt_balance || 0) : "••••••"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Locked</p>
                <p className="font-mono text-lg font-semibold">
                  {balanceVisible ? formatCurrency(wallet?.locked_balance || 0) : "••••••"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Quick Actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" onClick={() => setActiveTab("deposit")}>
              <Plus className="mr-2 h-4 w-4" />
              Deposit
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setActiveTab("withdraw")}
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Withdraw
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setActiveTab("convert")}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Convert to USDT
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="convert">Convert</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Payment Methods */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your linked payment methods</CardDescription>
              </div>
              <Dialog open={addMethodDialogOpen} onOpenChange={setAddMethodDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Method
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Payment Method</DialogTitle>
                    <DialogDescription>
                      Link a new payment method to your account
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Method Type</label>
                      <Select value={newMethodType} onValueChange={setNewMethodType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="card">Credit/Debit Card</SelectItem>
                          <SelectItem value="bank">Bank Account</SelectItem>
                          <SelectItem value="crypto">Crypto Wallet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newMethodType === "card" && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Card Number</label>
                          <Input
                            placeholder="4242 4242 4242 4242"
                            value={newMethodDetails.cardNumber}
                            onChange={(e) =>
                              setNewMethodDetails({
                                ...newMethodDetails,
                                cardNumber: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Expiry Date</label>
                            <Input
                              placeholder="MM/YY"
                              value={newMethodDetails.expiryDate}
                              onChange={(e) =>
                                setNewMethodDetails({
                                  ...newMethodDetails,
                                  expiryDate: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">CVV</label>
                            <Input
                              placeholder="123"
                              type="password"
                              value={newMethodDetails.cvv}
                              onChange={(e) =>
                                setNewMethodDetails({
                                  ...newMethodDetails,
                                  cvv: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {newMethodType === "bank" && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Bank Name</label>
                          <Input
                            placeholder="Chase Bank"
                            value={newMethodDetails.bankName}
                            onChange={(e) =>
                              setNewMethodDetails({
                                ...newMethodDetails,
                                bankName: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Account Number</label>
                          <Input
                            placeholder="****1234"
                            value={newMethodDetails.accountNumber}
                            onChange={(e) =>
                              setNewMethodDetails({
                                ...newMethodDetails,
                                accountNumber: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Routing Number</label>
                          <Input
                            placeholder="123456789"
                            value={newMethodDetails.routingNumber}
                            onChange={(e) =>
                              setNewMethodDetails({
                                ...newMethodDetails,
                                routingNumber: e.target.value,
                              })
                            }
                          />
                        </div>
                      </>
                    )}

                    {newMethodType === "crypto" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Wallet Address</label>
                        <Input
                          placeholder="0x..."
                          value={newMethodDetails.cryptoAddress}
                          onChange={(e) =>
                            setNewMethodDetails({
                              ...newMethodDetails,
                              cryptoAddress: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddMethodDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddPaymentMethod} disabled={!newMethodType}>
                      Add Method
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CreditCard className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No payment methods linked</p>
                  <p className="text-sm text-muted-foreground">
                    Add a payment method to deposit and withdraw funds
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          {getMethodIcon(method.type)}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{method.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {method.type === "card" && `•••• ${method.details?.last_four}`}
                            {method.type === "bank" &&
                              `${method.details?.bank_name} •••• ${method.details?.account_last_four}`}
                            {method.type === "crypto" &&
                              `${method.details?.address?.slice(0, 6)}...${method.details?.address?.slice(-4)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.is_default && <Badge>Default</Badge>}
                        {method.is_verified ? (
                          <Badge variant="outline" className="text-green-500">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-500">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Wallet Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent deposits, withdrawals, and conversions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ArrowRightLeft className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            tx.type === "deposit"
                              ? "bg-green-500/10"
                              : tx.type === "withdraw"
                              ? "bg-red-500/10"
                              : "bg-blue-500/10"
                          }`}
                        >
                          {tx.type === "deposit" ? (
                            <ArrowDownRight className="h-5 w-5 text-green-500" />
                          ) : tx.type === "withdraw" ? (
                            <ArrowUpRight className="h-5 w-5 text-red-500" />
                          ) : (
                            <ArrowRightLeft className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{tx.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-medium">
                          {tx.type === "deposit" ? "+" : "-"}
                          {formatCurrency(tx.total_amount)}
                        </p>
                        <Badge
                          variant={
                            tx.status === "completed"
                              ? "default"
                              : tx.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deposit Tab */}
        <TabsContent value="deposit">
          <Card>
            <CardHeader>
              <CardTitle>Deposit Funds</CardTitle>
              <CardDescription>Add funds to your USDT balance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {depositSuccess && (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertTitle>Deposit Initiated</AlertTitle>
                  <AlertDescription>
                    Your deposit is being processed. It may take a few minutes to reflect in your
                    balance.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (USD)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="font-mono text-lg"
                />
                <div className="flex gap-2">
                  {[100, 500, 1000, 5000].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setDepositAmount(amount.toString())}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                {paymentMethods.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No payment methods</AlertTitle>
                    <AlertDescription>
                      Please add a payment method first to make deposits.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Select value={depositMethod} onValueChange={setDepositMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            {getMethodIcon(method.type)}
                            <span className="capitalize">{method.type}</span>
                            <span className="text-muted-foreground">
                              {method.type === "card" && `•••• ${method.details?.last_four}`}
                              {method.type === "bank" && `•••• ${method.details?.account_last_four}`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="font-mono">$0.00</span>
                </div>
                <div className="mt-2 flex items-center justify-between font-medium">
                  <span>You will receive</span>
                  <span className="font-mono text-lg">
                    {formatCurrency(parseFloat(depositAmount) || 0)} USDT
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleDeposit}
                disabled={
                  !depositAmount ||
                  !depositMethod ||
                  depositLoading ||
                  parseFloat(depositAmount) <= 0
                }
              >
                {depositLoading ? "Processing..." : "Deposit Funds"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdraw Tab */}
        <TabsContent value="withdraw">
          <Card>
            <CardHeader>
              <CardTitle>Withdraw Funds</CardTitle>
              <CardDescription>Withdraw USDT to your linked payment method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {withdrawSuccess && (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertTitle>Withdrawal Initiated</AlertTitle>
                  <AlertDescription>
                    Your withdrawal is being processed. It may take 1-3 business days.
                  </AlertDescription>
                </Alert>
              )}

              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="font-mono text-2xl font-bold">
                  {formatCurrency(wallet?.usdt_balance || 0)}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (USDT)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="font-mono text-lg"
                  max={wallet?.usdt_balance || 0}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setWithdrawAmount(((wallet?.usdt_balance || 0) * 0.25).toFixed(2))
                    }
                  >
                    25%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setWithdrawAmount(((wallet?.usdt_balance || 0) * 0.5).toFixed(2))
                    }
                  >
                    50%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setWithdrawAmount(((wallet?.usdt_balance || 0) * 0.75).toFixed(2))
                    }
                  >
                    75%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWithdrawAmount((wallet?.usdt_balance || 0).toFixed(2))}
                  >
                    Max
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Withdraw To</label>
                {paymentMethods.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No payment methods</AlertTitle>
                    <AlertDescription>
                      Please add a payment method first to make withdrawals.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            {getMethodIcon(method.type)}
                            <span className="capitalize">{method.type}</span>
                            <span className="text-muted-foreground">
                              {method.type === "card" && `•••• ${method.details?.last_four}`}
                              {method.type === "bank" && `•••• ${method.details?.account_last_four}`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="font-mono">$0.00</span>
                </div>
                <div className="mt-2 flex items-center justify-between font-medium">
                  <span>You will receive</span>
                  <span className="font-mono text-lg">
                    {formatCurrency(parseFloat(withdrawAmount) || 0)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleWithdraw}
                disabled={
                  !withdrawAmount ||
                  !withdrawMethod ||
                  withdrawLoading ||
                  parseFloat(withdrawAmount) <= 0 ||
                  parseFloat(withdrawAmount) > (wallet?.usdt_balance || 0)
                }
              >
                {withdrawLoading ? "Processing..." : "Withdraw Funds"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Convert Tab */}
        <TabsContent value="convert">
          <Card>
            <CardHeader>
              <CardTitle>Convert to USDT</CardTitle>
              <CardDescription>Convert your holdings to USDT instantly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {convertSuccess && (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertTitle>Conversion Initiated</AlertTitle>
                  <AlertDescription>
                    Your assets are being converted to USDT. This usually takes a few seconds.
                  </AlertDescription>
                </Alert>
              )}

              {holdings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ArrowRightLeft className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No holdings to convert</p>
                  <p className="text-sm text-muted-foreground">
                    Buy some assets first to convert them to USDT
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Asset</label>
                    <Select value={convertHolding} onValueChange={setConvertHolding}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset to convert" />
                      </SelectTrigger>
                      <SelectContent>
                        {holdings.map((holding) => (
                          <SelectItem key={holding.id} value={holding.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{holding.assets?.symbol}</span>
                              <span className="text-muted-foreground">
                                {holding.quantity.toFixed(6)} available
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {convertHolding && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Amount ({holdings.find((h) => h.id === convertHolding)?.assets?.symbol})
                        </label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={convertAmount}
                          onChange={(e) => setConvertAmount(e.target.value)}
                          className="font-mono text-lg"
                        />
                        <div className="flex gap-2">
                          {[0.25, 0.5, 0.75, 1].map((pct) => {
                            const holding = holdings.find((h) => h.id === convertHolding)
                            return (
                              <Button
                                key={pct}
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setConvertAmount(
                                    ((holding?.quantity || 0) * pct).toFixed(6)
                                  )
                                }
                              >
                                {pct * 100}%
                              </Button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="rounded-lg bg-muted p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Current Price</span>
                          <span className="font-mono">
                            {formatCurrency(
                              holdings.find((h) => h.id === convertHolding)?.assets
                                ?.current_price || 0
                            )}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between font-medium">
                          <span>You will receive</span>
                          <span className="font-mono text-lg">
                            {formatCurrency(
                              (parseFloat(convertAmount) || 0) *
                                (holdings.find((h) => h.id === convertHolding)?.assets
                                  ?.current_price || 0)
                            )}{" "}
                            USDT
                          </span>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleConvert}
                        disabled={
                          !convertAmount ||
                          convertLoading ||
                          parseFloat(convertAmount) <= 0 ||
                          parseFloat(convertAmount) >
                            (holdings.find((h) => h.id === convertHolding)?.quantity || 0)
                        }
                      >
                        {convertLoading ? "Converting..." : "Convert to USDT"}
                      </Button>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
