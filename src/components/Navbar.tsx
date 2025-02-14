/**
 * Navbar.tsx
 *
 * This component serves as the top navigation bar for the Crypto Trade Analyzer.
 *
 * **Features:**
 * - 📌 Displays the app title and logo.
 * - 🔄 Includes a **TradeSelector** dropdown to switch between coins.
 * - 🎨 Styled using Tailwind CSS for a clean and modern look.
 *
 * **Props:**
 * - `selectedCoin` (string) → The currently selected cryptocurrency.
 * - `onCoinChange` (function) → Callback function to update the selected coin.
 * - `availableCoins` (array) → List of available cryptocurrencies with `id` and `name`.
 */

import React from 'react';
import { Coins } from 'lucide-react';
import TradeSelector from './TradeSelector';

interface NavbarProps {
  selectedCoin: string;
  onCoinChange: (coinId: string) => void;
  availableCoins: { id: string; name: string }[];
}

const Navbar: React.FC<NavbarProps> = ({ selectedCoin, onCoinChange, availableCoins }) => {
  return (
    <nav className="bg-white shadow-sm">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & App Title */}
          <div className="flex items-center">
            <Coins className="w-8 h-8 text-blue-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">
              Crypto Trade Analyzer
            </span>
          </div>

          {/* Trade Selector Dropdown */}
          <TradeSelector
            selectedCoin={selectedCoin}
            onCoinChange={onCoinChange}
            availableCoins={availableCoins}
          />

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
