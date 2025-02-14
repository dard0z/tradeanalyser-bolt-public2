/**
 * api.ts
 *
 * This module handles API requests to CoinGecko for cryptocurrency data.
 * 
 * - Uses Axios for HTTP requests with automatic retries in case of failures.
 * - Fetches market chart data for a specified cryptocurrency.
 * - Includes a fallback mechanism that generates sample data if the API request fails.
 */

import axios from 'axios';
import { CoinData } from '../types';

// Base URL for CoinGecko API
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Configure Axios instance with a timeout
const api = axios.create({
  timeout: 10000, // 10 seconds timeout to avoid long waits
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

/**
 * Performs an API request with automatic retries in case of failures.
 *
 * @param url - The API endpoint to call
 * @param params - Query parameters for the API request
 * @param retries - Number of times to retry the request (default: 3)
 * @param delay - Initial delay in milliseconds between retries (default: 1000)
 * @returns The API response data
 */
const fetchWithRetry = async (url: string, params: any, retries = 3, delay = 1000): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      // Attempt to fetch data from the API
      const response = await api.get(url, { params });
      return response.data;
    } catch (error) {
      // If this was the last retry, throw the error
      if (i === retries - 1) throw error;

      // Exponential backoff: Increase wait time before the next attempt
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

/**
 * Fetches market chart data for a given cryptocurrency.
 *
 * @param coinId - The cryptocurrency ID (e.g., 'bitcoin')
 * @param days - Number of past days to fetch data for (default: 90)
 * @returns The market chart data from CoinGecko API
 */
export const fetchCoinData = async (coinId: string, days: number = 90): Promise<CoinData> => {
  try {
    const data = await fetchWithRetry(
      `${COINGECKO_API}/coins/${coinId}/market_chart`,
      {
        vs_currency: 'usd', // Fetch data in USD
        days: days, // Number of past days
        interval: 'daily' // Daily data points
      }
    );
    return data;
  } catch (error) {
    console.error('Error fetching from CoinGecko, using sample data:', error instanceof Error ? error.message : 'Unknown error');
    return generateSampleData(days);
  }
};

/**
 * Generates sample OHLC data in case API calls fail.
 *
 * @param days - Number of past days to generate data for
 * @returns A CoinData object with simulated price, market cap, and volume data
 */
function generateSampleData(days: number): CoinData {
  const now = Date.now(); // Current timestamp
  const dayMs = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
  const prices: [number, number][] = [];
  
  let price = 30000; // Start with an arbitrary price

  for (let i = days; i >= 0; i--) {
    const time = now - (i * dayMs); // Compute timestamp for each past day

    // Generate a random price movement within ±1% range
    price = price * (1 + (Math.random() - 0.5) * 0.02);
    
    prices.push([time, price]);
  }

  return {
    prices,
    market_caps: prices.map(([time, price]) => [time, price * 1000000]), // Simulated market cap
    total_volumes: prices.map(([time]) => [time, Math.random() * 1000000000]) // Simulated volume data
  };
}
