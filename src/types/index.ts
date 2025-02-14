export interface CoinData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface OHLCData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TradeParams {
  coin: string;
  prices?: number[];
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  direction?: 'long' | 'short';
}

export interface TradeMetrics {
  maxFavorableExcursion: number;
  maxAdverseExcursion: number;
  timeToExit: number;
  riskRewardRatio: number;
}

export interface BacktestTrade {
  entry_time: number;
  exit_time: number;
  entry_price: number;
  exit_price: number;
  high_price: number;  // <-- Add this
  low_price: number;   // <-- Add this
  result: 'take_profit' | 'stop_loss';
  profit_loss: number;
  metrics: TradeMetrics;
  stopLoss: number;
  takeProfit: number;
}


export interface BacktestStatistics {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  average_profit: number;
  max_profit: number;
  max_loss: number;
  profit_factor: number;
  average_win: number;
  average_loss: number;
  average_time_to_exit?: number;
  average_risk_reward?: number;
  max_favorable_excursion?: number;
  max_adverse_excursion?: number;
}

export interface BacktestResult {
  success: boolean;
  trades: BacktestTrade[];
  statistics: BacktestStatistics | null;
  message?: string;
}

export interface TradeAnalysis {
  trendScore: number;
  momentumScore: number;
  volatilityScore: number;
  overallScore: number;
  recommendation: string;
  explanations: {
    trend: string;
    momentum: string;
    volatility: string;
  };
}