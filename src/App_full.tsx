import React, { useState, useEffect } from 'react';
import { LineChart, Coins } from 'lucide-react';
import { analyzeTrade } from './services/technicalAnalysis';
import { getCoinData } from './services/storage';
import { runBacktest } from './services/backtesting';
import { calculateEMA, calculateRSI, calculateBollingerBands } from './services/technicalAnalysis';
import PriceChart from './components/PriceChart';
import TradeForm from './components/TradeForm';
import { TradeParams, TradeAnalysis, BacktestResult, OHLCData } from './types';

const AVAILABLE_COINS = [
  { id: 'bitcoin', name: 'Bitcoin' },
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'solana', name: 'Solana' },
  { id: 'dogecoin', name: 'Dogecoin' }
];

function App() {
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [chartData, setChartData] = useState<OHLCData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [indicators, setIndicators] = useState<{
    ema: number;
    rsi: number;
    bb: { upper: number; middle: number; lower: number };
  } | null>(null);

  const loadCoinData = async (coinId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCoinData(coinId);

      if (!data || data.length === 0) {
        throw new Error('No data available for this coin');
      }

      setChartData(data);

      const prices = data.map(d => d.close);
      const lastPrice = prices[prices.length - 1];
      setCurrentPrice(lastPrice);

      // Calculate indicators
      const ema = calculateEMA(prices, 20);
      const rsi = calculateRSI(prices);
      const bb = calculateBollingerBands(prices);

      setIndicators({
        ema: ema[ema.length - 1],
        rsi: rsi[rsi.length - 1],
        bb: {
          upper: bb.upper[bb.upper.length - 1],
          middle: bb.middle[bb.middle.length - 1],
          lower: bb.lower[bb.lower.length - 1],
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load coin data';
      setError(errorMessage);
      console.error('Error loading coin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoinData(selectedCoin);
  }, [selectedCoin]);

  const handleTradeAnalysis = (params: TradeParams) => {
    if (chartData.length === 0) return;

    const prices = chartData.map(d => d.close);

    // Run analysis
    const result = analyzeTrade({
      prices,
      currentPrice: params.entryPrice,
      takeProfit: params.takeProfit,
      stopLoss: params.stopLoss,
      direction: params.direction
    });

    setAnalysis(result);

    // Run backtest with the full OHLC data
    const backtestResults = runBacktest({
      prices: chartData,
      entryPrice: params.entryPrice,
      takeProfit: params.takeProfit,
      stopLoss: params.stopLoss,
      direction: params.direction || 'long'
    });

    setBacktestResult(backtestResults);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Coins className="w-8 h-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">
                Crypto Trade Analyzer
              </span>
            </div>
            <div className="flex items-center">
              <select
                value={selectedCoin}
                onChange={(e) => setSelectedCoin(e.target.value)}
                className="block w-40 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {AVAILABLE_COINS.map(coin => (
                  <option key={coin.id} value={coin.id}>
                    {coin.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </nav>

      <main className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="bg-white rounded-lg shadow lg:col-span-2">
              <div className="p-4 border-b border-gray-200">
                <h2 className="flex items-center text-lg font-semibold text-gray-900">
                  <LineChart className="w-5 h-5 mr-2 text-blue-600" />
                  Price Chart
                </h2>
              </div>
              <div className="p-4" style={{ height: '600px' }}>
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full text-red-600">
                    {error}
                  </div>
                ) : (
                  <PriceChart data={chartData} />
                )}
              </div>
            </div>

            <div className="space-y-6 lg:col-span-1">
              <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="mb-6 text-lg font-semibold text-gray-900">Trade Analysis</h2>
                <TradeForm onSubmit={handleTradeAnalysis} currentPrice={currentPrice} />
              </div>

              {analysis && (
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <span className={`
                        inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold
                        ${analysis.overallScore >= 60
                          ? 'bg-green-100 text-green-800'
                          : analysis.overallScore >= 40
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'}
                      `}>
                        {analysis.recommendation}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Market + TP Probability + Action */}
                      <div className="flex items-center justify-center space-x-2 text-lg font-semibold">
                        <span className="px-4 py-2 text-green-800 bg-green-100 rounded-full">
                          {analysis.marketScore}%
                        </span>
                        <span className="text-gray-500">+</span>
                        <span className="px-4 py-2 text-green-800 bg-green-100 rounded-full">
                          {analysis.takeProfitProbability}%
                        </span>
                        <span className="text-gray-500">=</span>
                        <span className="px-4 py-2 text-white bg-green-500 rounded-full">
                          {analysis.recommendation}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-500">Trend</span>
                          <span className="font-semibold">{analysis.trendScore.toFixed(1)}%</span>
                        </div>
                        <div className="mt-1 h-1.5 relative rounded-full overflow-hidden bg-gray-100">
                          <div
                            className={`absolute h-full transition-all duration-300 ${analysis.trendScore >= 70 ? 'bg-green-500' :
                                analysis.trendScore >= 50 ? 'bg-yellow-500' :
                                  'bg-red-500'
                              }`}
                            style={{ width: `${analysis.trendScore}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-500">Momentum</span>
                          <span className="font-semibold">{analysis.momentumScore.toFixed(1)}%</span>
                        </div>
                        <div className="mt-1 h-1.5 relative rounded-full overflow-hidden bg-gray-100">
                          <div
                            className={`absolute h-full transition-all duration-300 ${analysis.momentumScore >= 70 ? 'bg-green-500' :
                                analysis.momentumScore >= 50 ? 'bg-yellow-500' :
                                  'bg-red-500'
                              }`}
                            style={{ width: `${analysis.momentumScore}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-500">Volatility</span>
                          <span className="font-semibold">{analysis.volatilityScore.toFixed(1)}%</span>
                        </div>
                        <div className="mt-1 h-1.5 relative rounded-full overflow-hidden bg-gray-100">
                          <div
                            className={`absolute h-full transition-all duration-300 ${analysis.volatilityScore >= 70 ? 'bg-red-500' :
                                analysis.volatilityScore >= 50 ? 'bg-yellow-500' :
                                  'bg-green-500'
                              }`}
                            style={{ width: `${analysis.volatilityScore}%` }}
                          />
                        </div>
                      </div>

                      
                      
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Backtest Results */}
          {backtestResult === null ? (
            <div className="p-6 bg-white rounded-lg shadow">
              <div className="text-center text-gray-500">
                Click the Analyse button above to see backtest results
              </div>
            </div>
          ) : backtestResult.success && (
            <div className="p-6 bg-white rounded-lg shadow">
              <h2 className="mb-6 text-lg font-semibold text-gray-900">Backtest Results</h2>

              <div className="grid grid-cols-2 gap-6 mb-8 md:grid-cols-4">
                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-500">Total Trades</h3>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {backtestResult.statistics.total_trades}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-500">Win Rate</h3>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {backtestResult.statistics.win_rate.toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-500">Average Profit</h3>
                  <p className={`text-2xl font-bold mt-1 ${backtestResult.statistics.average_profit > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {backtestResult.statistics.average_profit > 0 ? '+' : ''}
                    {backtestResult.statistics.average_profit.toFixed(2)}%
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-500">Profit Factor</h3>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {backtestResult.statistics.profit_factor === Infinity
                      ? '∞'
                      : backtestResult.statistics.profit_factor.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-500">Average Win</h3>
                  <p className="mt-1 text-2xl font-bold text-green-600">
                    +{backtestResult.statistics.average_win.toFixed(2)}%
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-500">Average Loss</h3>
                  <p className="mt-1 text-2xl font-bold text-red-600">
                    {backtestResult.statistics.average_loss.toFixed(2)}%
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-500">Max Favorable</h3>
                  <p className="mt-1 text-2xl font-bold text-green-600">
                    +{backtestResult.statistics.max_favorable_excursion?.toFixed(2)}%
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-500">Max Adverse</h3>
                  <p className="mt-1 text-2xl font-bold text-red-600">
                    {backtestResult.statistics.max_adverse_excursion?.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Entry Time</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Exit Time</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Entry Price</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Exit Price</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Stop Loss</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Take Profit</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Result</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Profit/Loss</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Max Favorable</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Max Adverse</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">R:R Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...backtestResult.trades].sort((a, b) => b.entry_time - a.entry_time).map((trade, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {new Date(trade.entry_time * 1000).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {new Date(trade.exit_time * 1000).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          ${trade.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          ${trade.exit_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          ${trade.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          ${trade.takeProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trade.result === 'take_profit'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            }`}>
                            {trade.result === 'take_profit' ? 'Take Profit' : 'Stop Loss'}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${trade.profit_loss > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {trade.profit_loss > 0 ? '+' : ''}{trade.profit_loss.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 text-sm text-green-600 whitespace-nowrap">
                          +{trade.metrics.maxFavorableExcursion.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 text-sm text-red-600 whitespace-nowrap">
                          {trade.metrics.maxAdverseExcursion.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {trade.metrics.riskRewardRatio.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;