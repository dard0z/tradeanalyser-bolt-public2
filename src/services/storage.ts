/**
 * getCoinData.ts
 *
 * This module manages fetching and caching cryptocurrency OHLC (Open, High, Low, Close) data.
 * 
 * - Retrieves data from local storage if available and recent.
 * - Fetches fresh data from the API if the stored data is outdated (older than 1 hour).
 * - Transforms raw price data into OHLC format.
 * - Saves the processed OHLC data back to local storage for future use.
 */

import { fetchCoinData } from './api';
import { OHLCData } from '../types';

// Define a prefix for storing data in localStorage to avoid conflicts
const STORAGE_PREFIX = 'crypto_trade_';

/**
 * Determines whether stored data needs to be updated.
 * 
 * @param lastUpdated - Timestamp (in milliseconds) when the data was last fetched
 * @returns `true` if data is older than 1 hour, `false` otherwise
 */
const needsUpdate = (lastUpdated: number) => {
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  return Date.now() - lastUpdated > oneHour;
};

/**
 * Clears all stored cryptocurrency data from localStorage.
 * This function is useful for resetting stored data or handling updates.
 */
export const clearCoinData = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing coin data:', error instanceof Error ? error.message : 'Unknown error');
  }
};

/**
 * Retrieves OHLC (Open, High, Low, Close) price data for a given cryptocurrency.
 * 
 * @param coinId - The identifier of the cryptocurrency (e.g., 'bitcoin')
 * @returns A promise that resolves to an array of OHLC data
 */
export const getCoinData = async (coinId: string): Promise<OHLCData[]> => {
  const storageKey = `${STORAGE_PREFIX}${coinId}`;
  let storedData: { lastUpdated: number; prices: OHLCData[] } | null = null;
  
  // Attempt to retrieve stored data from localStorage
  try {
    const storedJson = localStorage.getItem(storageKey);
    if (storedJson) {
      storedData = JSON.parse(storedJson);
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error instanceof Error ? error.message : 'Unknown error');
  }
  
  // If no stored data exists or it's outdated, fetch fresh data from the API
  if (!storedData || needsUpdate(storedData.lastUpdated)) {
    try {
      const data = await fetchCoinData(coinId);

      // Convert raw price data into OHLC format
      const ohlcData: OHLCData[] = [];
      let currentDay = -1; // Tracks the current processing day
      let currentCandle: OHLCData | null = null; // Holds the current day's OHLC data

      for (const [timestamp, price] of data.prices) {
        const date = new Date(timestamp); // Convert timestamp to a Date object
        const day = date.getUTCDate(); // Extract the day of the month
        
        // If still on the same day, update high/low/close prices
        if (currentDay === day && currentCandle) {
          currentCandle.high = Math.max(currentCandle.high, price);
          currentCandle.low = Math.min(currentCandle.low, price);
          currentCandle.close = price;
        } else {
          // If it's a new day, store the previous day's data and start a new candle
          if (currentCandle) {
            ohlcData.push({ ...currentCandle });
          }

          // Initialize a new OHLC candle for the new day
          currentDay = day;
          currentCandle = {
            time: Math.floor(timestamp / 1000), // Store timestamp in seconds
            open: price,
            high: price,
            low: price,
            close: price
          };
        }
      }

      // Push the last processed candle to the array
      if (currentCandle) {
        ohlcData.push({ ...currentCandle });
      }

      // Save the new data in localStorage for future use
      const newData = {
        lastUpdated: Date.now(),
        prices: ohlcData,
      };
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(newData));
      } catch (error) {
        console.error('Error saving to localStorage:', error instanceof Error ? error.message : 'Unknown error');
      }
      
      return ohlcData;
    } catch (error) {
      console.error(`Error fetching data for ${coinId}:`, error instanceof Error ? error.message : 'Unknown error');
      return storedData?.prices || []; // Return stored data if available, otherwise empty array
    }
  }
  
  return storedData.prices;
};
