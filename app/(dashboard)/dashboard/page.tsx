"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Wallet,
  ArrowRightLeft,
  Plus,
  Eye,
  EyeOff,
} from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

// Mock chart data
const portfolioChartData = [
  { date: "Jan", value: 10000 },
  { date: "Feb", value: 12500 },
  { date: "Mar", value: 11800 },
  { date: "Apr", value: 14200 },
  { date: "May", value: 13900 },
  { date: "Jun", value: 16500 },
  { date: "Jul", value: 18200 },
]

export default function DashboardHomePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [wallet, setWallet] = useState<any>(null)
  const [holdings, setHoldings] = useState<any[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [topAssets, setTopAssets] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch wallet
      const { data: walletData } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single()
      setWallet(walletData)

      // Fetch holdings with asset details
      const { data: holdingsData } = await supabase
        .from("holdings")
        .select(`
          *,
          assets (*)
        `)
        .eq("user_id", user.id)
        .order("current_value", { ascending: false })
        .limit(5)
      setHoldings(holdingsData || [])

      // Fetch recent transactions
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select(`
          *,
          assets (symbol, name, icon_url)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)
      setRecentTransactions(transactionsData || [])

      // Fetch top assets
      const { data: assetsData } = await supabase
        .from("assets")
        .select("*")
        .eq("is_active", true)
        .order("market_cap", { ascending: false })
        .limit(5)
      setTopAssets(assetsData || [])

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

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : ""
    return `${sign}${value.toFixed(2)}%`
  }

  const totalPortfolioValue = wallet?.balance || 0
  const portfolioChange = 12.5 // Mock value

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Balance */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <CardHeader className="relative pb-2">
            <CardDescription className="flex items-center justify-between">
              Total Balance
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setBalanceVisible(!balanceVisible)}
              >
                {balanceVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="font-mono text-2xl font-bold">
              {balanceVisible ? formatCurrency(totalPortfolioValue) : "••••••"}
            </div>
            <div className="mt-1 flex items-center text-sm">
              {portfolioChange >= 0 ? (
                <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
              )}
              <span className={portfolioChange >= 0 ? "text-green-500" : "text-red-500"}>
                {formatPercentage(portfolioChange)}
              </span>
              <span className="ml-1 text-muted-foreground">this month</span>
            </div>
          </CardContent>
        </Card>

        {/* USDT Balance */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>USDT Balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold">
              {balanceVisible ? formatCurrency(wallet?.usdt_balance || 0) : "••••••"}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Available for trading</p>
          </CardContent>
        </Card>

        {/* Holdings Count */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Holdings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{holdings.length}</div>
            <p className="mt-1 text-sm text-muted-foreground">Assets in portfolio</p>
          </CardContent>
        </Card>

        {/* Pending Transactions */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentTransactions.filter(t => t.status === "pending").length}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Transactions processing</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/dashboard/wallet?action=deposit">
            <Plus className="mr-2 h-4 w-4" />
            Deposit
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/markets">
            <TrendingUp className="mr-2 h-4 w-4" />
            Trade
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/wallet?action=withdraw">
            <Wallet className="mr-2 h-4 w-4" />
            Withdraw
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/wallet?action=convert">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Convert to USDT
          </Link>
        </Button>
      </div>

      {/* Charts and Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Portfolio Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Performance</CardTitle>
            <CardDescription>Your portfolio value over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioChartData}>
                  <defs>
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [formatCurrency(value), "Value"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#portfolioGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Assets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Assets</CardTitle>
              <CardDescription>Market movers today</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/markets">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {asset.icon_url ? (
                        <img src={asset.icon_url} alt={asset.symbol} className="h-6 w-6" />
                      ) : (
                        <span className="font-mono text-sm font-bold">{asset.symbol[0]}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{asset.symbol}</p>
                      <p className="text-sm text-muted-foreground">{asset.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium">{formatCurrency(asset.current_price)}</p>
                    <p
                      className={`text-sm ${
                        asset.change_24h >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {formatPercentage(asset.change_24h)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings and Transactions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Your Holdings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Holdings</CardTitle>
              <CardDescription>Current portfolio breakdown</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/portfolio">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {holdings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No holdings yet</p>
                <Button className="mt-4" asChild>
                  <Link href="/dashboard/markets">Start Trading</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {holdings.map((holding) => (
                  <div
                    key={holding.id}
                    className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <span className="font-mono text-sm font-bold">
                          {holding.assets?.symbol?.[0] || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{holding.assets?.symbol}</p>
                        <p className="text-sm text-muted-foreground">
                          {holding.quantity} units
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium">
                        {formatCurrency(holding.current_value)}
                      </p>
                      <p
                        className={`text-sm ${
                          holding.profit_loss >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {formatPercentage(
                          ((holding.current_value - holding.total_invested) /
                            holding.total_invested) *
                            100
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/transactions">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ArrowRightLeft className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No transactions yet</p>
                <Button className="mt-4" asChild>
                  <Link href="/dashboard/wallet?action=deposit">Make a Deposit</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          tx.type === "buy" || tx.type === "deposit"
                            ? "bg-green-500/10"
                            : "bg-red-500/10"
                        }`}
                      >
                        {tx.type === "buy" || tx.type === "deposit" ? (
                          <ArrowDownRight
                            className={`h-5 w-5 ${
                              tx.type === "buy" || tx.type === "deposit"
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          />
                        ) : (
                          <ArrowUpRight
                            className={`h-5 w-5 ${
                              tx.type === "sell" || tx.type === "withdraw"
                                ? "text-red-500"
                                : "text-green-500"
                            }`}
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{tx.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {tx.assets?.symbol || "USDT"} •{" "}
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium">
                        {tx.type === "buy" || tx.type === "deposit" ? "+" : "-"}
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
      </div>
    </div>
  )
}

// Import for Briefcase icon
import { Briefcase } from "lucide-react"
