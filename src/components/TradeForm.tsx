/**
 * TradeForm.tsx
 *
 * This component allows users to define trade parameters such as entry price,
 * take profit (TP), and stop loss (SL) for a given asset.
 *
 * Features:
 * - Allows users to select trade direction (Long or Short).
 * - Adjusts TP/SL based on pre-defined percentage buttons.
 * - Automatically updates TP/SL when the current price changes.
 * - Submits the trade analysis for evaluation.
 */

import React, { useState, useEffect } from 'react';
import { TradeParams } from '../types';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

// Define the expected props for the component
interface TradeFormProps {
  onSubmit: (params: TradeParams) => void;
  currentPrice: number;
}

// Define the trade direction type
type TradeDirection = 'long' | 'short';

// Predefined percentage options for Take Profit and Stop Loss
const TAKE_PROFIT_PERCENTAGES = [10, 20];
const STOP_LOSS_PERCENTAGES = [5, 10];

/**
 * TradeForm Component
 *
 * - Provides input fields for trade parameters (entry price, TP, SL).
 * - Allows toggling between long and short trades.
 * - Offers quick percentage-based TP/SL selection.
 * - Calls `onSubmit` when the form is submitted.
 */
const TradeForm: React.FC<TradeFormProps> = ({ onSubmit, currentPrice }) => {
  const [direction, setDirection] = useState<TradeDirection>('long');
  const [activeTpPercentage, setActiveTpPercentage] = useState<number | null>(null);
  const [activeSlPercentage, setActiveSlPercentage] = useState<number | null>(null);
  const [params, setParams] = useState<TradeParams>({
    coin: 'bitcoin',
    entryPrice: currentPrice,
    takeProfit: currentPrice * 1.1,
    stopLoss: currentPrice * 0.95,
    direction: 'long'
  });

  // Update form when currentPrice changes
  useEffect(() => {
    if (currentPrice > 0) {
      const newTakeProfit = direction === 'long' ? currentPrice * 1.1 : currentPrice * 0.9;
      const newStopLoss = direction === 'long' ? currentPrice * 0.95 : currentPrice * 1.05;
      
      setParams({
        ...params,
        entryPrice: currentPrice,
        takeProfit: newTakeProfit,
        stopLoss: newStopLoss,
        direction
      });
      
      setActiveTpPercentage(direction === 'long' ? 10 : -10);
      setActiveSlPercentage(direction === 'long' ? 5 : -5);
    }
  }, [currentPrice, direction]);

  // Handles form submission by preventing the default form behavior 
// and passing the updated trade parameters to the parent component
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault(); // Prevents the form from reloading the page
  onSubmit(params); // Calls the onSubmit function with the trade parameters
};

// Toggles the trade direction between 'long' and 'short'.
// Updates the take profit and stop loss levels based on the new direction.
const toggleDirection = () => {
  const newDirection = direction === 'long' ? 'short' : 'long'; // Toggle between long and short
  setDirection(newDirection); // Update state with new direction

  if (params.entryPrice > 0) { // Ensure the entry price is valid before proceeding
      const newTakeProfit = newDirection === 'long' 
          ? params.entryPrice * 1.1  // Long: 10% above entry price
          : params.entryPrice * 0.9; // Short: 10% below entry price

      const newStopLoss = newDirection === 'long' 
          ? params.entryPrice * 0.95  // Long: 5% below entry price
          : params.entryPrice * 1.05; // Short: 5% above entry price

      // Update trade parameters with new take profit and stop loss values
      setParams(prev => ({
          ...prev,
          direction: newDirection,
          takeProfit: newTakeProfit,
          stopLoss: newStopLoss
      }));

      // Update active percentage selections based on the new direction
      setActiveTpPercentage(newDirection === 'long' ? 10 : -10);
      setActiveSlPercentage(newDirection === 'long' ? 5 : -5);
  }
};

// Adjusts the take profit level based on the selected percentage increase/decrease
const handleTakeProfitPercentage = (percentage: number) => {
  if (params.entryPrice > 0) { // Ensure entry price is valid
      const multiplier = direction === 'long' 
          ? 1 + percentage / 100  // Long: Increase price by percentage
          : 1 - percentage / 100; // Short: Decrease price by percentage

      const newTakeProfit = Number((params.entryPrice * multiplier).toFixed(2)); // Calculate new TP value with precision
      setParams(prev => ({
          ...prev,
          takeProfit: newTakeProfit // Update take profit in state
      }));
      setActiveTpPercentage(percentage); // Highlight selected TP percentage
  }
};


  /**
 * @param {number} percentage - The percentage to adjust the stop loss by.
 */
const handleStopLossPercentage = (percentage: number) => {
  if (params.entryPrice > 0) { // Ensure the entry price is valid before proceeding
      // Determine the stop loss multiplier based on trade direction:
      // - Long: Stop loss is set below entry price (1 - percentage)
      // - Short: Stop loss is set above entry price (1 + percentage)
      const multiplier = direction === 'long' 
          ? 1 - percentage / 100  // Example: 5% stop loss → 95% of entry price
          : 1 + percentage / 100; // Example: 5% stop loss → 105% of entry price

      // Calculate the new stop loss price and ensure it's rounded to 2 decimal places
      const newStopLoss = Number((params.entryPrice * multiplier).toFixed(2));

      // Update the trade parameters with the new stop loss value
      setParams(prev => ({
          ...prev,
          stopLoss: newStopLoss
      }));

      // Update the active stop loss percentage selection for UI highlight
      setActiveSlPercentage(percentage);
  }
};


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Toggle switch for trade direction (Long/Short) */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <span className={`text-sm font-medium ${direction === 'long' ? 'text-green-600' : 'text-gray-500'}`}>
          LONG
        </span>
        <button
          type="button"
          onClick={toggleDirection}
          className="relative inline-flex items-center h-8 transition-colors rounded-full w-14 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          style={{
            backgroundColor: direction === 'long' ? '#22c55e' : '#ef4444'
          }}
        >
          <span className="sr-only">Toggle direction</span>
          <span
            className={`
              ${direction === 'long' ? 'translate-x-1' : 'translate-x-7'}
              inline-block h-6 w-6 transform rounded-full bg-white transition-transform
            `}
          />
        </button>
        <span className={`text-sm font-medium ${direction === 'short' ? 'text-red-600' : 'text-gray-500'}`}>
          SHORT
        </span>
      </div>
      
      {/* Input fields for Entry Price, Take Profit, and Stop Loss */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Entry Price ($)</label>
          <input
            type="number"
            value={params.entryPrice.toFixed(2)}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value) && value > 0) {
                setParams(prev => ({ ...prev, entryPrice: value }));
              }
            }}
            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            step="0.01"
            min="0"
          />
        </div>
        
        {/* Take Profit Input + Quick Selection Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Take Profit ($)</label>
          <input
            type="number"
            value={params.takeProfit.toFixed(2)}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value) && value > 0) {
                setParams(prev => ({ ...prev, takeProfit: value }));
              }
            }}
            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            step="0.01"
            min="0"
          />
          <div className="flex gap-2 mt-2">
            {/* Quick take-profit percentage buttons */}
            {TAKE_PROFIT_PERCENTAGES.map(percentage => (
              <button
                key={`tp-${percentage}`}
                type="button"
                onClick={() => handleTakeProfitPercentage(percentage)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  activeTpPercentage === percentage
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {direction === 'long' ? '+' : '-'}{percentage}%
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Stop Loss ($)</label>
          <input
            type="number"
            value={params.stopLoss.toFixed(2)}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value) && value > 0) {
                setParams(prev => ({ ...prev, stopLoss: value }));
              }
            }}
            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            step="0.01"
            min="0"
          />
          <div className="flex gap-2 mt-2">
            {STOP_LOSS_PERCENTAGES.map(percentage => (
              <button
                key={`sl-${percentage}`}
                type="button"
                onClick={() => handleStopLossPercentage(percentage)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  activeSlPercentage === percentage
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                {direction === 'long' ? '-' : '+'}{percentage}%
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        className={`
          w-full px-4 py-2 text-sm font-medium text-white rounded-md
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${direction === 'long' 
            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
            : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'}
        `}
      >
        {direction === 'long' ? (
          <span className="flex items-center justify-center">
            <ArrowUpCircle className="w-5 h-5 mr-2" />
            Analyze Long Trade
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <ArrowDownCircle className="w-5 h-5 mr-2" />
            Analyze Short Trade
          </span>
        )}
      </button>
    </form>
  );
};

export default TradeForm;