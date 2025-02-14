import { BacktestResult, BacktestTrade, BacktestStatistics, OHLCData } from '../types';

function calculateProfitLoss(entryPrice: number, exitPrice: number, direction: 'long' | 'short'): number {
  return direction === 'long'
    ? ((exitPrice - entryPrice) / entryPrice) * 100
    : ((entryPrice - exitPrice) / entryPrice) * 100;
}

export function runBacktest(params: {
  prices: OHLCData[];
  takeProfit: number;
  stopLoss: number;
  direction: 'long' | 'short';
}): BacktestResult {
  const { prices, takeProfit, stopLoss, direction } = params;

  if (prices.length < 2) {
    return {
      success: false,
      message: "Not enough price data",
      trades: [],
      statistics: null
    };
  }

  const trades: BacktestTrade[] = [];
  
  // Start from the most recent 90 days of data
  const startIndex = Math.max(0, prices.length - 90);
  
  for (let i = startIndex; i < prices.length - 1; i++) { // Prevent out-of-bounds errors
    const currentCandle = prices[i];
    const nextCandle = prices[i + 1]; // Next day's data

    const entryPrice = currentCandle.open ?? 0;
    const highPrice = currentCandle.high ?? 0; // ✅ Ensure correct high price
    const lowPrice = currentCandle.low ?? 0;   // ✅ Ensure correct low price
    let exitPrice = nextCandle.close ?? 0;
    let exitTime = nextCandle.time ?? 0;
    let tradeResult: 'take_profit' | 'stop_loss' = 'stop_loss';
    let exitFound = false;

    // **Debugging: Log the extracted values to confirm correct data**
    console.log(`Day ${new Date(currentCandle.time * 1000).toLocaleDateString()}:`);
    console.log(`Open: ${entryPrice}, High: ${highPrice}, Low: ${lowPrice}, Close: ${exitPrice}`);

    // Look forward from each entry point
    for (let j = i + 1; j < prices.length && !exitFound; j++) {
      const candle = prices[j];

      if (direction === 'long') {
        if (candle.high >= takeProfit) {
          exitPrice = takeProfit;
          tradeResult = 'take_profit';
          exitTime = candle.time ?? 0;
          exitFound = true;
        } else if (candle.low <= stopLoss) {
          exitPrice = stopLoss;
          tradeResult = 'stop_loss';
          exitTime = candle.time ?? 0;
          exitFound = true;
        }
      } else {
        if (candle.low <= takeProfit) {
          exitPrice = takeProfit;
          tradeResult = 'take_profit';
          exitTime = candle.time ?? 0;
          exitFound = true;
        } else if (candle.high >= stopLoss) {
          exitPrice = stopLoss;
          tradeResult = 'stop_loss';
          exitTime = candle.time ?? 0;
          exitFound = true;
        }
      }
    }

    if (!exitFound) {
      exitPrice = nextCandle.close ?? 0;
      exitTime = nextCandle.time ?? 0;
      tradeResult = 'stop_loss';
    }

    const profitLoss = calculateProfitLoss(entryPrice, exitPrice, direction);

    trades.push({
      entry_time: currentCandle.time ?? 0,
      exit_time: exitTime,
      entry_price: entryPrice,
      high_price: highPrice, // ✅ Fixing the high price assignment
      low_price: lowPrice,   // ✅ Fixing the low price assignment
      exit_price: exitPrice,
      profit_loss: profitLoss,
    });
  }

  return {
    success: true,
    trades,
    statistics: null
  };
}
