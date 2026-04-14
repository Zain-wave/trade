"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Search,
  Download,
  Filter,
  Calendar,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"

type TransactionType = "all" | "buy" | "sell" | "deposit" | "withdraw" | "convert"
type TransactionStatus = "all" | "completed" | "pending" | "failed" | "cancelled"

export default function TransactionsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<TransactionType>("all")
  const [statusFilter, setStatusFilter] = useState<TransactionStatus>("all")
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all transactions
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select(`
          *,
          assets (symbol, name, icon_url, type)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      setTransactions(transactionsData || [])

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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "buy":
      case "deposit":
        return <ArrowDownRight className="h-4 w-4 text-green-500" />
      case "sell":
      case "withdraw":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      case "convert":
        return <ArrowRightLeft className="h-4 w-4 text-blue-500" />
      default:
        return <ArrowRightLeft className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Completed</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.assets?.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.assets?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.type.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === "all" || tx.type === typeFilter
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const openDetails = (transaction: any) => {
    setSelectedTransaction(transaction)
    setDetailsDialogOpen(true)
  }

  // Stats
  const totalBuys = transactions
    .filter((tx) => tx.type === "buy" && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.total_amount, 0)
  const totalSells = transactions
    .filter((tx) => tx.type === "sell" && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.total_amount, 0)
  const totalDeposits = transactions
    .filter((tx) => tx.type === "deposit" && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.total_amount, 0)
  const totalWithdrawals = transactions
    .filter((tx) => tx.type === "withdraw" && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.total_amount, 0)

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
          <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">
            View and manage all your transaction history
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Bought</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-green-500" />
              <span className="font-mono text-2xl font-bold">{formatCurrency(totalBuys)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-red-500" />
              <span className="font-mono text-2xl font-bold">{formatCurrency(totalSells)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Deposits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-blue-500" />
              <span className="font-mono text-2xl font-bold">{formatCurrency(totalDeposits)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Withdrawals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-orange-500" />
              <span className="font-mono text-2xl font-bold">{formatCurrency(totalWithdrawals)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={(value: TransactionType) => setTypeFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="withdraw">Withdraw</SelectItem>
              <SelectItem value="convert">Convert</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value: TransactionStatus) => setStatusFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ArrowRightLeft className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No Transactions Found</h3>
              <p className="mt-2 text-center text-muted-foreground">
                {transactions.length === 0
                  ? "Start trading to see your transaction history"
                  : "No transactions match your filters"}
              </p>
              {transactions.length === 0 && (
                <Button className="mt-6" asChild>
                  <Link href="/dashboard/markets">Browse Markets</Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            tx.type === "buy" || tx.type === "deposit"
                              ? "bg-green-500/10"
                              : tx.type === "sell" || tx.type === "withdraw"
                              ? "bg-red-500/10"
                              : "bg-blue-500/10"
                          }`}
                        >
                          {getTransactionIcon(tx.type)}
                        </div>
                        <span className="font-medium capitalize">{tx.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tx.assets ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            {tx.assets.icon_url ? (
                              <img
                                src={tx.assets.icon_url}
                                alt={tx.assets.symbol}
                                className="h-5 w-5"
                              />
                            ) : (
                              <span className="font-mono text-xs font-bold">
                                {tx.assets.symbol[0]}
                              </span>
                            )}
                          </div>
                          <span>{tx.assets.symbol}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">USDT</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {tx.quantity ? tx.quantity.toFixed(6) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {tx.price_per_unit ? formatCurrency(tx.price_per_unit) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(tx.total_amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(tx.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetails(tx)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Transaction ID: {selectedTransaction?.id?.slice(0, 8)}...
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize">{selectedTransaction.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Asset</span>
                  <span className="font-medium">
                    {selectedTransaction.assets?.symbol || "USDT"}
                  </span>
                </div>
                {selectedTransaction.quantity && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-mono">{selectedTransaction.quantity.toFixed(6)}</span>
                  </div>
                )}
                {selectedTransaction.price_per_unit && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Price per Unit</span>
                    <span className="font-mono">
                      {formatCurrency(selectedTransaction.price_per_unit)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(selectedTransaction.total_amount)}
                  </span>
                </div>
                {selectedTransaction.fee && selectedTransaction.fee > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="font-mono">{formatCurrency(selectedTransaction.fee)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{formatDate(selectedTransaction.created_at)}</span>
                </div>
              </div>
              {selectedTransaction.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
