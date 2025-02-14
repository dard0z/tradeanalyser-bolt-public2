/**
 * TradeSelector.tsx
 *
 * This component provides a dropdown for users to select a cryptocurrency for trading analysis.
 * 
 * Features:
 * - Allows selection of a coin from an available list.
 * - Handles changes via a callback function.
 * - Displays a loading message if no coins are available.
 */

import React from 'react';

// Define the props expected by the component
interface TradeSelectorProps {
  selectedCoin: string; // Currently selected coin ID
  onCoinChange: (coinId: string) => void; // Function to handle coin selection changes
  availableCoins?: { id: string; name: string }[]; // List of available coins (optional to prevent errors)
}

/**
 * TradeSelector Component
 *
 * - Displays a dropdown menu of available cryptocurrencies.
 * - Calls `onCoinChange` when a new coin is selected.
 * - Displays a loading message if no coin data is available.
 */
const TradeSelector: React.FC<TradeSelectorProps> = ({ selectedCoin, onCoinChange, availableCoins = [] }) => {
  return (
    <div className="flex items-center">
      {/* Dropdown menu for selecting a cryptocurrency */}
      <select
        value={selectedCoin}
        onChange={(e) => onCoinChange(e.target.value)}
        className="block w-40 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        {availableCoins.length > 0 ? (
          // Map available coins into dropdown options
          availableCoins.map((coin) => (
            <option key={coin.id} value={coin.id}>
              {coin.name}
            </option>
          ))
        ) : (
          // Display a placeholder option while loading coins
          <option disabled>Loading coins...</option>
        )}
      </select>
    </div>
  );
};

export default TradeSelector;
