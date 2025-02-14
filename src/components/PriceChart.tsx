/**
 * PriceChart.tsx
 *
 * This component displays a candlestick chart with technical indicators
 * to analyze price trends and market momentum.
 *
 * **Features:**
 * - 📈 **Candlestick Chart**: Displays historical price action.
 * - 🔵 **EMA (Exponential Moving Average)**: Helps identify trend direction.
 * - 📊 **Bollinger Bands**: Shows volatility and price deviations.
 * - 🟣 **RSI (Relative Strength Index)**: Measures market momentum.
 * - 🏷️ **Crosshair Legend**: Displays real-time values on hover.
 * - 🔄 **Responsive**: Adjusts to window size dynamically.
 *
 * **How It Works:**
 * - Uses `lightweight-charts` for smooth rendering.
 * - Auto-syncs the RSI and main chart time scales.
 * - Dynamically resizes when the window size changes.
 * - Updates the legend on crosshair movement.
 */

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { OHLCData } from '../types';
import { calculateEMA, calculateRSI, calculateBollingerBands } from '../services/technicalAnalysis';

interface PriceChartProps {
  data: OHLCData[];
}

const PriceChart: React.FC<PriceChartProps> = ({ data }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartContainerRef.current && rsiContainerRef.current && data.length > 0) {
      const container = chartContainerRef.current;
      const rsiContainer = rsiContainerRef.current;
      const mainChartHeight = 400;
      const rsiChartHeight = 120;

      const chart = createChart(container, {
        layout: {
          background: { type: ColorType.Solid, color: 'white' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#E0E0E0' },
          horzLines: { color: '#E0E0E0' },
        },
        width: container.clientWidth,
        height: mainChartHeight,
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: '#D1D5DB',
        },
        rightPriceScale: {
          borderColor: '#D1D5DB',
        },
        crosshair: {
          mode: 1,
          vertLine: {
            width: 1,
            color: '#758696',
            style: 3,
          },
          horzLine: {
            width: 1,
            color: '#758696',
            style: 3,
          },
        },
      });

      // Main candlestick series
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      // Set the data
      candlestickSeries.setData(data.map(d => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      })));

      // Add EMA
      const prices = data.map(d => d.close);
      const times = data.map(d => d.time);
      const ema = calculateEMA(prices, 20);
      
      const emaSeries = chart.addLineSeries({
        color: '#2962FF',
        lineWidth: 1,
        title: 'EMA 20',
      });

      emaSeries.setData(ema.map((value, i) => ({
        time: times[i],
        value: value
      })));

      // Add Bollinger Bands
      const bb = calculateBollingerBands(prices);
      
      const bbUpper = chart.addLineSeries({
        color: 'rgba(41, 98, 255, 0.2)',
        lineWidth: 1,
        title: 'BB Upper',
      });

      const bbMiddle = chart.addLineSeries({
        color: 'rgba(41, 98, 255, 0.2)',
        lineWidth: 1,
        title: 'BB Middle',
      });

      const bbLower = chart.addLineSeries({
        color: 'rgba(41, 98, 255, 0.2)',
        lineWidth: 1,
        title: 'BB Lower',
      });

      bbUpper.setData(bb.upper.map((value, i) => ({ time: times[i], value })));
      bbMiddle.setData(bb.middle.map((value, i) => ({ time: times[i], value })));
      bbLower.setData(bb.lower.map((value, i) => ({ time: times[i], value })));

      // Create RSI chart
      const rsiChart = createChart(rsiContainer, {
        layout: {
          background: { type: ColorType.Solid, color: 'white' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#E0E0E0' },
          horzLines: { color: '#E0E0E0' },
        },
        width: container.clientWidth,
        height: rsiChartHeight,
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: '#D1D5DB',
        },
        rightPriceScale: {
          borderColor: '#D1D5DB',
        },
      });

      // RSI series
      const rsi = calculateRSI(prices);
      const rsiSeries = rsiChart.addLineSeries({
        color: '#7B1FA2',
        lineWidth: 1,
        title: 'RSI (14)',
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });

      rsiSeries.setData(rsi.map((value, i) => ({
        time: times[i],
        value: value
      })));

      // RSI overbought/oversold lines
      const rsiUpper = rsiChart.addLineSeries({
        color: '#FF5252',
        lineWidth: 1,
        lineStyle: 2,
        title: 'Overbought',
      });

      const rsiLower = rsiChart.addLineSeries({
        color: '#4CAF50',
        lineWidth: 1,
        lineStyle: 2,
        title: 'Oversold',
      });

      rsiUpper.setData(times.map(time => ({ time, value: 70 })));
      rsiLower.setData(times.map(time => ({ time, value: 30 })));

      // Sync the time scales
      chart.timeScale().subscribeVisibleTimeRangeChange(() => {
        const timeRange = chart.timeScale().getVisibleRange();
        if (timeRange) {
          rsiChart.timeScale().setVisibleRange(timeRange);
        }
      });

      rsiChart.timeScale().subscribeVisibleTimeRangeChange(() => {
        const timeRange = rsiChart.timeScale().getVisibleRange();
        if (timeRange) {
          chart.timeScale().setVisibleRange(timeRange);
        }
      });

      // Add legend
      chart.subscribeCrosshairMove(param => {
        if (param.time && legendRef.current) {
          const candleData = param.seriesData.get(candlestickSeries) as { open: number; high: number; low: number; close: number } | undefined;
          const emaValue = param.seriesData.get(emaSeries) as { value: number } | undefined;
          const rsiValue = param.seriesData.get(rsiSeries) as { value: number } | undefined;

          legendRef.current.innerHTML = `
            <div class="flex flex-wrap gap-4 text-sm">
              ${candleData ? `
                <span class="font-medium">
                  <span class="text-gray-500">O:</span> ${candleData.open.toFixed(2)}
                  <span class="text-gray-500">H:</span> ${candleData.high.toFixed(2)}
                  <span class="text-gray-500">L:</span> ${candleData.low.toFixed(2)}
                  <span class="text-gray-500">C:</span> ${candleData.close.toFixed(2)}
                </span>
              ` : ''}
              ${emaValue ? `
                <span class="text-blue-600 font-medium">
                  EMA: ${emaValue.value.toFixed(2)}
                </span>
              ` : ''}
              ${rsiValue ? `
                <span class="text-purple-600 font-medium">
                  RSI: ${rsiValue.value.toFixed(2)}
                </span>
              ` : ''}
            </div>
          `;
        }
      });

      // Fit content
      chart.timeScale().fitContent();
      rsiChart.timeScale().fitContent();

      const handleResize = () => {
        if (container) {
          const width = container.clientWidth;
          chart.applyOptions({ width });
          rsiChart.applyOptions({ width });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
        rsiChart.remove();
      };
    }
  }, [data]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <div ref={legendRef} className="absolute z-10 p-2 rounded shadow-sm top-2 right-2 bg-white/90" />
        <div ref={chartContainerRef} className="w-full" style={{ height: '400px' }} />
      </div>
      <div ref={rsiContainerRef} className="w-full" style={{ height: '120px' }} />
    </div>
  );
};

export default PriceChart;