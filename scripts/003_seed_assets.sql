-- Seed initial assets data
INSERT INTO public.assets (symbol, name, type, current_price, price_change_24h, price_change_percent_24h, market_cap, volume_24h, high_24h, low_24h, is_active) VALUES
-- Cryptocurrencies
('BTC', 'Bitcoin', 'crypto', 67234.50, 1234.50, 1.87, 1320000000000, 28500000000, 68500.00, 65800.00, true),
('ETH', 'Ethereum', 'crypto', 3456.78, -45.23, -1.29, 415000000000, 15200000000, 3520.00, 3380.00, true),
('BNB', 'Binance Coin', 'crypto', 584.32, 12.45, 2.18, 89000000000, 1850000000, 595.00, 570.00, true),
('SOL', 'Solana', 'crypto', 178.90, 8.67, 5.09, 82000000000, 3200000000, 185.00, 168.00, true),
('XRP', 'Ripple', 'crypto', 0.5234, -0.0123, -2.30, 28000000000, 1200000000, 0.5450, 0.5100, true),
('ADA', 'Cardano', 'crypto', 0.4567, 0.0234, 5.40, 16000000000, 450000000, 0.4750, 0.4350, true),
('DOGE', 'Dogecoin', 'crypto', 0.1234, 0.0089, 7.77, 17500000000, 890000000, 0.1350, 0.1150, true),
('USDT', 'Tether', 'crypto', 1.0000, 0.0001, 0.01, 95000000000, 52000000000, 1.0002, 0.9998, true),

-- Stocks
('AAPL', 'Apple Inc.', 'stock', 178.56, 2.34, 1.33, 2780000000000, 58000000, 180.50, 176.80, true),
('MSFT', 'Microsoft Corporation', 'stock', 378.91, -3.45, -0.90, 2810000000000, 22000000, 382.50, 375.00, true),
('GOOGL', 'Alphabet Inc.', 'stock', 141.80, 1.89, 1.35, 1780000000000, 24000000, 143.50, 140.20, true),
('AMZN', 'Amazon.com Inc.', 'stock', 178.25, 4.56, 2.63, 1850000000000, 35000000, 180.00, 174.50, true),
('TSLA', 'Tesla Inc.', 'stock', 245.67, -8.90, -3.50, 780000000000, 95000000, 258.00, 242.00, true),
('NVDA', 'NVIDIA Corporation', 'stock', 875.28, 25.67, 3.02, 2150000000000, 45000000, 890.00, 855.00, true),
('META', 'Meta Platforms Inc.', 'stock', 485.32, 12.34, 2.61, 1240000000000, 15000000, 492.00, 478.00, true),
('NFLX', 'Netflix Inc.', 'stock', 628.45, -5.67, -0.89, 275000000000, 3500000, 635.00, 620.00, true),

-- Forex
('EUR/USD', 'Euro/US Dollar', 'forex', 1.0876, 0.0023, 0.21, NULL, 125000000000, 1.0912, 1.0845, true),
('GBP/USD', 'British Pound/US Dollar', 'forex', 1.2654, -0.0034, -0.27, NULL, 98000000000, 1.2720, 1.2610, true),
('USD/JPY', 'US Dollar/Japanese Yen', 'forex', 154.32, 0.45, 0.29, NULL, 85000000000, 154.80, 153.50, true),

-- Commodities
('GOLD', 'Gold', 'commodity', 2345.67, 15.23, 0.65, NULL, 180000000000, 2365.00, 2330.00, true),
('SILVER', 'Silver', 'commodity', 27.89, 0.45, 1.64, NULL, 4500000000, 28.20, 27.50, true),
('OIL', 'Crude Oil WTI', 'commodity', 78.45, -1.23, -1.54, NULL, 85000000000, 80.20, 77.80, true)

ON CONFLICT (symbol) DO UPDATE SET
  current_price = EXCLUDED.current_price,
  price_change_24h = EXCLUDED.price_change_24h,
  price_change_percent_24h = EXCLUDED.price_change_percent_24h,
  market_cap = EXCLUDED.market_cap,
  volume_24h = EXCLUDED.volume_24h,
  high_24h = EXCLUDED.high_24h,
  low_24h = EXCLUDED.low_24h,
  updated_at = NOW();

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
('trading_fees', '{"buy": 0.001, "sell": 0.001}', 'Trading fee percentages for buy and sell orders'),
('withdrawal_limits', '{"min": 10, "max": 100000, "daily_limit": 50000}', 'Withdrawal limits in USDT'),
('deposit_limits', '{"min": 10, "max": 1000000}', 'Deposit limits in USDT'),
('maintenance_mode', '{"enabled": false, "message": ""}', 'System maintenance mode settings'),
('kyc_required', '{"for_withdrawal": true, "for_trading": false, "withdrawal_limit_without_kyc": 1000}', 'KYC requirements')
ON CONFLICT (key) DO NOTHING;
