/**
 * BacktestResults.tsx
 * 
 * This component displays the backtest results for a given trading strategy.
 * It takes in a `backtestResult` object, which contains trade data and statistics,
 * and presents the information in a table format.
 * 
 * The table includes:
 * - Entry and Exit Time: When the trade started and ended.
 * - Open, High, Low, and Close Prices for each trade.
 * - Profit/Loss Percentage and Absolute Dollar Value.
 * - Cumulative Profit/Loss to track overall performance.
 * 
 * If no backtest data is available, the component prompts the user to run an analysis.
 * 
 * Author: Dardoz
 * Date: Feb 14 2025
 */

import React from 'react';
import { BacktestResult } from '../types';

interface BacktestResultProps {
  backtestResult: BacktestResult | null;
}

const BacktestResults: React.FC<BacktestResultProps> = ({ backtestResult }) => {
  // If no backtest result exists, display a message to prompt user action.
  if (!backtestResult) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center text-gray-500">
          Click the Analyse button above to see backtest results
        </div>
      </div>
    );
  }

  let cumulativeProfitLoss = 0; // Tracks cumulative profit/loss over trades.

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* Section Title */}
      <h2 className="mb-6 text-lg font-semibold text-gray-900">Backtest Results</h2>

      {/* Backtest Trades Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                'Entry Time', 'Exit Time', 'Open Price', 'High Price', 'Low Price', 'Close Price',
                'Profit/Loss %', 'Profit/Loss $', 'Cumulative P/L $'
              ].map((header, index) => (
                <th key={index} className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...backtestResult.trades]
              .sort((a, b) => b.entry_time - a.entry_time) // Sort trades by most recent first.
              .map((trade, index) => {
                const profitLossDollar = ((trade.entry_price ?? 0) * (trade.profit_loss ?? 0)) / 100;
                cumulativeProfitLoss += profitLossDollar; // Accumulate profit/loss.

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    {/* Entry Time (Trade start date) */}
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {new Date((trade.entry_time ?? 0) * 1000).toLocaleDateString()}
                    </td>

                    {/* Exit Time (Trade end date) */}
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {new Date((trade.exit_time ?? 0) * 1000).toLocaleDateString()}
                    </td>

                    {/* Open Price at the trade entry */}
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                      ${trade.entry_price?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "N/A"}
                    </td>

                    {/* High Price during the trade */}
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      ${trade.high_price?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "N/A"}
                    </td>

                    {/* Low Price during the trade */}
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      ${trade.low_price?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "N/A"}
                    </td>

                    {/* Close Price at the trade exit */}
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      ${trade.exit_price?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "N/A"}
                    </td>

                    {/* Profit/Loss Percentage for the trade */}
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      (trade.profit_loss ?? 0) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(trade.profit_loss ?? 0) > 0 ? '+' : ''}{(trade.profit_loss ?? 0).toFixed(2)}%
                    </td>

                    {/* Profit/Loss in dollar value */}
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      profitLossDollar > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {profitLossDollar > 0 ? '+' : ''}${profitLossDollar.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Cumulative Profit/Loss in dollar value */}
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      cumulativeProfitLoss > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {cumulativeProfitLoss > 0 ? '+' : ''}${cumulativeProfitLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BacktestResults;
