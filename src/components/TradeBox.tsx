import React from 'react';

interface TradeBoxProps {
  market: number;
  tpProbability: number;
  action: string;
  trend: number;
  momentum: number;
  volatility: number;
}

const TradeBox: React.FC<TradeBoxProps> = ({
  market,
  tpProbability,
  action,
  trend,
  momentum,
  volatility
}) => {
  const takeProfit = tpProbability;
  const stopLoss = 100 - tpProbability;

  return (
    <div className="p-6 bg-white shadow-md rounded-xl w-80">
      <div className="flex items-center justify-between">
        <div className="text-center">
          <p className="text-sm text-gray-500">Market</p>
          <div className="px-4 py-1 mt-1 text-xl font-semibold text-green-700 bg-green-100 rounded-full">
            {market}%
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">TP Probability</p>
          <div className="px-4 py-1 mt-1 text-xl font-semibold text-green-700 bg-green-100 rounded-full">
            {tpProbability}%
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Action</p>
          <button className="px-5 py-1 mt-1 text-lg font-semibold text-white bg-green-500 rounded-full">
            {action}
          </button>
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <p className="text-2xl font-bold text-green-600">{takeProfit}%</p>
        <p className="text-2xl font-bold text-red-500">{stopLoss}%</p>
      </div>

      <div className="flex justify-between text-sm text-gray-500">
        <p>Take Profit</p>
        <p>Stop Loss</p>
      </div>

      <div className="mt-4">
        <p className="text-gray-700">Trend</p>
        <div className="w-full h-2 mt-1 bg-gray-200 rounded-full">
          <div className="h-2 bg-green-500 rounded-full" style={{ width: `${trend}%` }}></div>
        </div>
      </div>

      <div className="mt-2">
        <p className="text-gray-700">Momentum</p>
        <div className="w-full h-2 mt-1 bg-gray-200 rounded-full">
          <div className="h-2 bg-red-500 rounded-full" style={{ width: `${momentum}%` }}></div>
        </div>
      </div>

      <div className="mt-2">
        <p className="text-gray-700">Volatility</p>
        <div className="w-full h-2 mt-1 bg-gray-200 rounded-full">
          <div className="h-2 bg-green-500 rounded-full" style={{ width: `${volatility}%` }}></div>
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-600">
        Based on current market conditions, there's a {tpProbability}% chance of hitting the profit target 
        and a {stopLoss}% chance of hitting the stop loss.
      </p>
    </div>
  );
};

export default TradeBox;
