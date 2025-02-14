import React from 'react';
import { TradeAnalysis as TradeAnalysisType } from '../types'; // Renamed to avoid conflict

interface TradeAnalysisProps {
  analysis: TradeAnalysisType | null;
}

const TradeAnalysisComponent: React.FC<TradeAnalysisProps> = ({ analysis }) => {
  if (!analysis) return null;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="space-y-4 text-center">
        {/* Market Score + TP Probability + Recommendation */}
        <div className="flex justify-center space-x-2 text-lg font-semibold">
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

        {/* Individual Scores */}
        {[
          { label: 'Trend', value: analysis.trendScore, colors: ['bg-green-500', 'bg-yellow-500', 'bg-red-500'] },
          { label: 'Momentum', value: analysis.momentumScore, colors: ['bg-green-500', 'bg-yellow-500', 'bg-red-500'] },
          { label: 'Volatility', value: analysis.volatilityScore, colors: ['bg-red-500', 'bg-yellow-500', 'bg-green-500'] },
        ].map((item, index) => (
          <div key={index}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-500">{item.label}</span>
              <span className="font-semibold">{item.value.toFixed(1)}%</span>
            </div>
            <div className="mt-1 h-1.5 relative rounded-full overflow-hidden bg-gray-100">
              <div
                className={`absolute h-full transition-all duration-300 ${
                  item.value >= 70 ? item.colors[0] : item.value >= 50 ? item.colors[1] : item.colors[2]
                }`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}

        {/* Target Probabilities */}
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Target Probabilities</h3>
          {[
            { label: 'Take Profit Probability', value: analysis.takeProfitProbability, color: 'bg-green-500' },
            { label: 'Stop Loss Probability', value: analysis.stopLossProbability, color: 'bg-red-500' },
          ].map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-500">{item.label}</span>
                <span className={`font-semibold ${item.color === 'bg-green-500' ? 'text-green-600' : 'text-red-600'}`}>
                  {item.value}%
                </span>
              </div>
              <div className="mt-1 h-1.5 relative rounded-full overflow-hidden bg-gray-100">
                <div className={`absolute h-full transition-all duration-300 ${item.color}`} style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Explanation */}
        <p className="mt-2 text-sm text-gray-600">{analysis.explanations.probabilities}</p>
      </div>
    </div>
  );
};

export default TradeAnalysisComponent;
