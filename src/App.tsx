/**
 * App.tsx
 * 
 * This is the main component of the trading analysis application.
 * It manages the overall state and logic for:
 * - Fetching historical price data for a selected cryptocurrency.
 * - Running trade analysis based on user input.
 * - Performing backtesting simulations.
 * - Rendering the UI components, including the price chart, trade form, 
 *   trade analysis results, and backtest results.
 * 
 * The main state variables track:
 * - Selected coin (`selectedCoin`)
 * - Historical OHLC price data (`chartData`)
 * - Trade analysis results (`analysis`)
 * - Backtesting results (`backtestResult`)
 * - Loading and error states for fetching data
 * 
 * Author: Dardoz
 * Date: Feb 14 2025
 */

import React, { useState, useEffect } from 'react';
import { analyzeTrade } from './services/technicalAnalysis';
import { getCoinData } from './services/storage';
import { runBacktest } from './services/backtesting';
import { TradeParams, TradeAnalysis as TradeAnalysisType, BacktestResult, OHLCData } from './types'; 
import Navbar from './components/Navbar';
import TradeSelector from './components/TradeSelector';
import PriceChart from './components/PriceChart';
import TradeForm from './components/TradeForm';
import TradeAnalysisComponent from './components/TradeAnalysis'; // Renamed import to avoid conflict
import BacktestResults from './components/BacktestResults';

const App: React.FC = () => {
  console.log("App is rendering");

  // State variables to manage selected coin and data
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [chartData, setChartData] = useState<OHLCData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TradeAnalysisType | null>(null);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  /**
   * Fetch historical OHLC data for the selected coin.
   * Updates the `chartData` state and sets the `currentPrice` to the most recent close price.
   * Handles loading and error states.
   */
  const loadCoinData = async (coinId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching data for ${coinId}...`);
      
      const data = await getCoinData(coinId);
      console.log("Fetched coin data:", data);

      if (!data || data.length === 0) {
        throw new Error('No data available for this coin');
      }

      setChartData(data);
      setCurrentPrice(data[data.length - 1].close);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coin data');
      console.error('Error loading coin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch coin data when the selected coin changes
  useEffect(() => {
    loadCoinData(selectedCoin);
  }, [selectedCoin]);

  /**
   * Handles trade analysis and backtesting when the user submits a trade.
   * - Extracts price data from `chartData`
   * - Runs `analyzeTrade()` to get trend, momentum, and volatility scores
   * - Runs `runBacktest()` to simulate historical trades
   * - Updates the `analysis` and `backtestResult` state variables
   */
  const handleTradeAnalysis = (params: TradeParams) => {
    if (chartData.length === 0) return;

    const prices = chartData.map(d => d.close);
    console.log("Running trade analysis with prices:", prices);

    const result = analyzeTrade({
      prices,
      currentPrice: params.entryPrice,
      takeProfit: params.takeProfit,
      stopLoss: params.stopLoss,
      direction: params.direction
    });

    console.log("Trade analysis result:", result);
    setAnalysis(result);

    const backtestResults = runBacktest({
      prices: chartData,
      entryPrice: params.entryPrice,
      takeProfit: params.takeProfit,
      stopLoss: params.stopLoss,
      direction: params.direction || 'long'
    });

    console.log("Backtest results:", backtestResults);
    setBacktestResult(backtestResults);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <Navbar />

      <main className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-8">

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left: Coin Selection & Price Chart */}
            <div className="bg-white rounded-lg shadow lg:col-span-2">
              <TradeSelector selectedCoin={selectedCoin} setSelectedCoin={setSelectedCoin} />
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

            {/* Right: Trade Form & Analysis */}
            <div className="space-y-6 lg:col-span-1">
              <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="mb-6 text-lg font-semibold text-gray-900">Trade Analysis</h2>
                <TradeForm onSubmit={handleTradeAnalysis} currentPrice={currentPrice} />
              </div>

              <TradeAnalysisComponent analysis={analysis} />
            </div>
          </div>

          {/* Bottom: Backtest Results */}
          <BacktestResults backtestResult={backtestResult} />
        </div>
      </main>
    </div>
  );
};

export default App;
