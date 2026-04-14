"use client"

import { useEffect, useState } from "react"
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
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  StarOff,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

// Mini chart data generator
const generateMiniChart = (trend: number) => {
  const data = []
  let value = 100
  for (let i = 0; i < 20; i++) {
    value += (Math.random() - 0.5 + trend * 0.1) * 5
    data.push({ value: Math.max(value, 50) })
  }
  return data
}

export default function MarketsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [assets, setAssets] = useState<any[]>([])
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy")
  const [tradeAmount, setTradeAmount] = useState("")
  const [wallet, setWallet] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Fetch assets
      const { data: assetsData } = await supabase
        .from("assets")
        .select("*")
        .eq("is_active", true)
        .order("market_cap", { ascending: false })
      setAssets(assetsData || [])

      // Fetch watchlist
      const { data: watchlistData } = await supabase
        .from("watchlist")
        .select("asset_id")
        .eq("user_id", user.id)
      setWatchlist(watchlistData?.map((w) => w.asset_id) || [])

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

  const toggleWatchlist = async (assetId: string) => {
    if (!userId) return
    
    if (watchlist.includes(assetId)) {
      await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", userId)
        .eq("asset_id", assetId)
      setWatchlist(watchlist.filter((id) => id !== assetId))
    } else {
      await supabase.from("watchlist").insert({ user_id: userId, asset_id: assetId })
      setWatchlist([...watchlist, assetId])
    }
  }

  const openTradeDialog = (asset: any, type: "buy" | "sell") => {
    setSelectedAsset(asset)
    setTradeType(type)
    setTradeAmount("")
    setTradeDialogOpen(true)
  }

  const executeTrade = async () => {
    if (!selectedAsset || !tradeAmount || !userId) return

    const amount = parseFloat(tradeAmount)
    const totalCost = amount * selectedAsset.current_price

    if (tradeType === "buy" && totalCost > (wallet?.usdt_balance || 0)) {
      alert("Insufficient USDT balance")
      return
    }

    // Create transaction
    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      asset_id: selectedAsset.id,
      type: tradeType,
      quantity: amount,
      price_per_unit: selectedAsset.current_price,
      total_amount: totalCost,
      status: "pending",
    })

    if (!error) {
      setTradeDialogOpen(false)
      // Refresh data
      window.location.reload()
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    return formatCurrency(value)
  }

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "stocks") return matchesSearch && asset.type === "stock"
    if (activeTab === "crypto") return matchesSearch && asset.type === "crypto"
    if (activeTab === "watchlist") return matchesSearch && watchlist.includes(asset.id)
    if (activeTab === "gainers") return matchesSearch && asset.change_24h > 0
    if (activeTab === "losers") return matchesSearch && asset.change_24h < 0
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-80" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Markets</h2>
          <p className="text-muted-foreground">
            Browse and trade stocks and cryptocurrencies
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Market Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gainers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-green-500">
                {assets.filter((a) => a.change_24h > 0).length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Losers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-red-500">
                {assets.filter((a) => a.change_24h < 0).length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Your Watchlist</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{watchlist.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Table */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="stocks">Stocks</TabsTrigger>
              <TabsTrigger value="crypto">Crypto</TabsTrigger>
              <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
              <TabsTrigger value="gainers">Gainers</TabsTrigger>
              <TabsTrigger value="losers">Losers</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Asset</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">24h Change</TableHead>
                <TableHead className="hidden md:table-cell text-right">Market Cap</TableHead>
                <TableHead className="hidden lg:table-cell w-32">Chart</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleWatchlist(asset.id)}
                    >
                      {watchlist.includes(asset.id) ? (
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ) : (
                        <StarOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
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
                      <Badge variant="outline" className="hidden sm:inline-flex">
                        {asset.type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(asset.current_price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className={`flex items-center justify-end gap-1 ${
                        asset.change_24h >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {asset.change_24h >= 0 ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      <span className="font-mono">
                        {asset.change_24h >= 0 ? "+" : ""}
                        {asset.change_24h.toFixed(2)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right font-mono">
                    {formatMarketCap(asset.market_cap)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="h-10 w-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={generateMiniChart(asset.change_24h)}>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={asset.change_24h >= 0 ? "#22c55e" : "#ef4444"}
                            fill={asset.change_24h >= 0 ? "#22c55e20" : "#ef444420"}
                            strokeWidth={1.5}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => openTradeDialog(asset, "buy")}
                      >
                        Buy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openTradeDialog(asset, "sell")}
                      >
                        Sell
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAssets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <p className="text-muted-foreground">No assets found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Trade Dialog */}
      <Dialog open={tradeDialogOpen} onOpenChange={setTradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tradeType === "buy" ? "Buy" : "Sell"} {selectedAsset?.symbol}
            </DialogTitle>
            <DialogDescription>
              Current price: {formatCurrency(selectedAsset?.current_price || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount ({selectedAsset?.symbol})</label>
              <Input
                type="number"
                placeholder="0.00"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
              />
            </div>
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Cost</span>
                <span className="font-mono font-medium">
                  {formatCurrency(
                    (parseFloat(tradeAmount) || 0) * (selectedAsset?.current_price || 0)
                  )}
                </span>
              </div>
              {tradeType === "buy" && (
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Available USDT</span>
                  <span className="font-mono">{formatCurrency(wallet?.usdt_balance || 0)}</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTradeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={executeTrade}
              disabled={!tradeAmount || parseFloat(tradeAmount) <= 0}
              className={tradeType === "buy" ? "" : "bg-red-500 hover:bg-red-600"}
            >
              {tradeType === "buy" ? "Buy" : "Sell"} {selectedAsset?.symbol}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
