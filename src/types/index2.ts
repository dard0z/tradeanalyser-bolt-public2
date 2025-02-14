/**
 * Represents market data for a cryptocurrency.
 */
export interface CoinData {
  prices: [number, number][];       // Array of [timestamp, price] pairs.
  market_caps: [number, number][];  // Array of [timestamp, market cap] pairs.
  total_volumes: [number, number][]; // Array of [timestamp, total volume] pairs.
}

/**
 * Represents OHLC (Open-High-Low-Close) data for a specific time period.
 */
export interface OHLCData {
  time: number;    // Timestamp of the data point.
  open: number;    // Opening price.
  high: number;    // Highest price in the period.
  low: number;     // Lowest price in the period.
  close: number;   // Closing price.
  volume?: number; // (Optional) Trading volume.
}

/**
 * Parameters used for trade analysis.
 */
export interface TradeParams {
  coin: string;               // Coin identifier (e.g., 'bitcoin').
  prices?: number[];          // (Optional) Price data for the analysis.
  entryPrice: number;         // Entry price for the trade.
  takeProfit: number;         // Take profit level.
  stopLoss: number;           // Stop loss level.
  direction?: 'long' | 'short'; // Trade direction (default is 'long').
}

/**
 * Represents various trade metrics used in backtesting.
 */
export interface TradeMetrics {
  maxFavorableExcursion: number; // Maximum price movement in a favorable direction.
  maxAdverseExcursion: number;   // Maximum price movement in an adverse direction.
  timeToExit: number;            // Time duration before trade exit.
  riskRewardRatio: number;       // Risk-to-reward ratio.
}

/**
 * Represents a single backtested trade.
 */
export interface BacktestTrade {
  entry_time: number;    // Timestamp of trade entry.
  exit_time: number;     // Timestamp of trade exit.
  entry_price: number;   // Entry price.
  exit_price: number;    // Exit price.
  result: 'take_profit' | 'stop_loss'; // Trade result (TP/SL).
  profit_loss: number;   // Profit or loss from the trade.
  metrics: TradeMetrics; // Trade performance metrics.
  stopLoss: number;      // Stop loss level used.
  takeProfit: number;    // Take profit level used.
}

/**
 * Summary statistics for a backtest session.
 */
export interface BacktestStatistics {
  total_trades: number;        // Total number of trades executed.
  winning_trades: number;      // Number of profitable trades.
  losing_trades: number;       // Number of losing trades.
  win_rate: number;            // Win percentage.
  average_profit: number;      // Average profit per trade.
  max_profit: number;          // Maximum profit from a trade.
  max_loss: number;            // Maximum loss from a trade.
  profit_factor: number;       // Profit factor (total profit / total loss).
  average_win: number;         // Average profit of winning trades.
  average_loss: number;        // Average loss of losing trades.
  average_time_to_exit?: number; // (Optional) Average time before trade exits.
  average_risk_reward?: number;  // (Optional) Average risk-to-reward ratio.
  max_favorable_excursion?: number; // (Optional) Maximum favorable price movement.
  max_adverse_excursion?: number;   // (Optional) Maximum adverse price movement.
}

/**
 * Represents the result of a backtest.
 */
export interface BacktestResult {
  success: boolean;            // Indicates if backtest completed successfully.
  trades: BacktestTrade[];     // List of backtested trades.
  statistics: BacktestStatistics | null; // Summary statistics.
  message?: string;            // (Optional) Additional message or error details.
}

/**
 * Represents trade analysis results.
 */
export interface TradeAnalysis {
  trendScore: number;           // Score for trend strength.
  momentumScore: number;        // Score for market momentum.
  volatilityScore: number;      // Score for market volatility.
  overallScore: number;         // Overall trade viability score.
  marketScore: number;          // Market condition score.
  takeProfitProbability: number; // Probability of hitting take profit.
  stopLossProbability: number;   // Probability of hitting stop loss.
  recommendation: string;        // Suggested trade action.
  explanations: {               // Breakdown of analysis.
    trend: string;              // Explanation of trend score.
    momentum: string;           // Explanation of momentum score.
    volatility: string;         // Explanation of volatility score.
    probabilities: string;      // Explanation of TP/SL probabilities.
  };
}
