"use client"

import { TrendingUp, TrendingDown } from "lucide-react"

const tickerData = [
  { symbol: "BTC", name: "Bitcoin", price: 67842.50, change: 2.34 },
  { symbol: "ETH", name: "Ethereum", price: 3456.78, change: 1.89 },
  { symbol: "AAPL", name: "Apple", price: 178.32, change: -0.45 },
  { symbol: "TSLA", name: "Tesla", price: 245.67, change: 3.21 },
  { symbol: "AMZN", name: "Amazon", price: 178.90, change: 0.78 },
  { symbol: "SOL", name: "Solana", price: 145.23, change: 5.67 },
  { symbol: "GOOGL", name: "Google", price: 141.80, change: -0.23 },
  { symbol: "BNB", name: "BNB", price: 567.89, change: 1.45 },
]

export function TickerTape() {
  return (
    <div className="w-full overflow-hidden bg-secondary/50 border-b border-border py-3">
      <div className="flex animate-ticker">
        {[...tickerData, ...tickerData].map((item, index) => (
          <div
            key={`${item.symbol}-${index}`}
            className="flex items-center gap-3 px-6 border-r border-border/50"
          >
            <span className="font-mono text-sm font-medium text-foreground">
              {item.symbol}
            </span>
            <span className="font-mono text-sm text-muted-foreground">
              ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span
              className={`flex items-center gap-1 font-mono text-xs ${
                item.change >= 0 ? "text-primary" : "text-destructive"
              }`}
            >
              {item.change >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {item.change >= 0 ? "+" : ""}
              {item.change.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
