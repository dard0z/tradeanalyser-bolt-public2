import React from 'react';
import { OHLCData } from '../types'; // Importing OHLCData type

interface TradeResultProps {
  analysis: {
    marketScore: number;
    takeProfitProbability: number;
    action: string;
    trendScore: number;
    momentumScore: number;
    volatilityScore: number;
    stopLossProbability: number;
  };
  tradeData: OHLCData[]; // Accepts an array of historical OHLC data
}

const TradeResult: React.FC<TradeResultProps> = ({ analysis, tradeData }) => {
  if (!tradeData.length) return null;

  // Get the correct open price for today based on tradeData
  const todayTrade = tradeData[tradeData.length - 1]; // Last available OHLC data
  const openPrice = todayTrade.open; // Use the open price for today's trade

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="space-y-4">
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
            {analysis.action}
          </span>
        </div>

        {/* Open Price Display */}
        <div className="text-sm text-center text-gray-600">
          <span className="font-medium">Today's Open Price: </span>
          <span className="font-semibold text-gray-900">${openPrice.toFixed(2)}</span>
        </div>

        {/* Take Profit & Stop Loss Probabilities */}
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {analysis.takeProfitProbability}% Take Profit
          </div>
          <div className="text-2xl font-bold text-red-600">
            {analysis.stopLossProbability}% Stop Loss
          </div>
        </div>

        {/* Trend, Momentum, Volatility */}
        {[
          { label: 'Trend', value: analysis.trendScore, color: 'bg-green-500' },
          { label: 'Momentum', value: analysis.momentumScore, color: 'bg-red-500' },
          { label: 'Volatility', value: analysis.volatilityScore, color: 'bg-green-500' }
        ].map((item, index) => (
          <div key={index}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-500">{item.label}</span>
              <span className="font-semibold">{item.value.toFixed(1)}%</span>
            </div>
            <div className="relative h-2 mt-1 overflow-hidden bg-gray-100 rounded-full">
              <div className={`absolute h-full ${item.color}`} style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradeResult;
