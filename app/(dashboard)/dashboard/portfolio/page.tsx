"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  PieChart,
  BarChart3,
  Briefcase,
} from "lucide-react"
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import Link from "next/link"

const COLORS = ["#00FF87", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899"]

export default function PortfolioPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [holdings, setHoldings] = useState<any[]>([])
  const [wallet, setWallet] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch holdings with asset details
      const { data: holdingsData } = await supabase
        .from("holdings")
        .select(`
          *,
          assets (*)
        `)
        .eq("user_id", user.id)
        .order("current_value", { ascending: false })
      setHoldings(holdingsData || [])

      // Fetch wallet
      const { data: walletData } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single()
      setWallet(walletData)

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

  const totalInvested = holdings.reduce((sum, h) => sum + h.total_invested, 0)
  const totalCurrentValue = holdings.reduce((sum, h) => sum + h.current_value, 0)
  const totalProfitLoss = totalCurrentValue - totalInvested
  const totalProfitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0

  // Pie chart data
  const pieChartData = holdings.map((h, index) => ({
    name: h.assets?.symbol || "Unknown",
    value: h.current_value,
    color: COLORS[index % COLORS.length],
  }))

  // Asset type breakdown
  const stocksValue = holdings
    .filter((h) => h.assets?.type === "stock")
    .reduce((sum, h) => sum + h.current_value, 0)
  const cryptoValue = holdings
    .filter((h) => h.assets?.type === "crypto")
    .reduce((sum, h) => sum + h.current_value, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
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
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Portfolio</h2>
          <p className="text-muted-foreground">
            Track your investments and performance
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/markets">
            <TrendingUp className="mr-2 h-4 w-4" />
            Trade More
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <CardHeader className="relative pb-2">
            <CardDescription>Total Portfolio Value</CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="font-mono text-2xl font-bold">
              {formatCurrency(totalCurrentValue + (wallet?.usdt_balance || 0))}
            </div>
            <div className="mt-1 flex items-center text-sm">
              {totalProfitLoss >= 0 ? (
                <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
              )}
              <span className={totalProfitLoss >= 0 ? "text-green-500" : "text-red-500"}>
                {formatPercentage(totalProfitLossPercentage)}
              </span>
              <span className="ml-1 text-muted-foreground">all time</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Invested</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold">{formatCurrency(totalInvested)}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Across {holdings.length} assets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total P/L</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`font-mono text-2xl font-bold ${
                totalProfitLoss >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {totalProfitLoss >= 0 ? "+" : ""}
              {formatCurrency(totalProfitLoss)}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatPercentage(totalProfitLossPercentage)} return
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>USDT Balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold">
              {formatCurrency(wallet?.usdt_balance || 0)}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Available for trading</p>
          </CardContent>
        </Card>
      </div>

      {holdings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No Holdings Yet</h3>
            <p className="mt-2 text-center text-muted-foreground">
              Start building your portfolio by buying stocks or cryptocurrencies
            </p>
            <Button className="mt-6" asChild>
              <Link href="/dashboard/markets">Browse Markets</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Allocation Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Portfolio Allocation
                </CardTitle>
                <CardDescription>Distribution of your investments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [formatCurrency(value), "Value"]}
                      />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Asset Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Asset Type Breakdown
                </CardTitle>
                <CardDescription>Stocks vs Cryptocurrency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium">Stocks</span>
                    </div>
                    <span className="font-mono text-sm">{formatCurrency(stocksValue)}</span>
                  </div>
                  <Progress
                    value={
                      totalCurrentValue > 0 ? (stocksValue / totalCurrentValue) * 100 : 0
                    }
                    className="h-2"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      <span className="text-sm font-medium">Cryptocurrency</span>
                    </div>
                    <span className="font-mono text-sm">{formatCurrency(cryptoValue)}</span>
                  </div>
                  <Progress
                    value={
                      totalCurrentValue > 0 ? (cryptoValue / totalCurrentValue) * 100 : 0
                    }
                    className="h-2"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <span className="text-sm font-medium">USDT (Cash)</span>
                    </div>
                    <span className="font-mono text-sm">
                      {formatCurrency(wallet?.usdt_balance || 0)}
                    </span>
                  </div>
                  <Progress
                    value={
                      totalCurrentValue + (wallet?.usdt_balance || 0) > 0
                        ? ((wallet?.usdt_balance || 0) /
                            (totalCurrentValue + (wallet?.usdt_balance || 0))) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Holdings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Your Holdings</CardTitle>
              <CardDescription>Detailed breakdown of all your assets</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Avg. Buy Price</TableHead>
                    <TableHead className="text-right">Current Price</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead className="text-right">P/L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings.map((holding) => {
                    const profitLoss = holding.current_value - holding.total_invested
                    const profitLossPercentage =
                      holding.total_invested > 0
                        ? (profitLoss / holding.total_invested) * 100
                        : 0

                    return (
                      <TableRow key={holding.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                              {holding.assets?.icon_url ? (
                                <img
                                  src={holding.assets.icon_url}
                                  alt={holding.assets.symbol}
                                  className="h-6 w-6"
                                />
                              ) : (
                                <span className="font-mono text-sm font-bold">
                                  {holding.assets?.symbol?.[0] || "?"}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{holding.assets?.symbol}</p>
                              <p className="text-sm text-muted-foreground">
                                {holding.assets?.name}
                              </p>
                            </div>
                            <Badge variant="outline">{holding.assets?.type}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {holding.quantity.toFixed(holding.assets?.type === "crypto" ? 6 : 2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(holding.average_buy_price)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(holding.assets?.current_price || 0)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCurrency(holding.current_value)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className={`flex flex-col items-end ${
                              profitLoss >= 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            <span className="font-mono font-medium">
                              {profitLoss >= 0 ? "+" : ""}
                              {formatCurrency(profitLoss)}
                            </span>
                            <span className="text-sm">
                              {formatPercentage(profitLossPercentage)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
