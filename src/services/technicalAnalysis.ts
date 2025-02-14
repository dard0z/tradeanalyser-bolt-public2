import { OHLCData } from '../types';

export function calculateEMA(prices: number[], period: number): number[] {
  const multiplier = 2 / (period + 1);
  const ema: number[] = [prices[0]];

  for (let i = 1; i < prices.length; i++) {
    const currentEMA = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
    ema.push(currentEMA);
  }

  return ema;
}

export function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  rsi.push(100 - (100 / (1 + avgGain / avgLoss)));

  for (let i = period; i < prices.length - 1; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    rsi.push(100 - (100 / (1 + avgGain / avgLoss)));
  }

  return rsi;
}

export function calculateBollingerBands(
  prices: number[], 
  period: number = 20, 
  stdDev: number = 2,
  lookback: number = 100
): {
  upper: number[];
  middle: number[];
  lower: number[];
  bandWidths: number[];
  averageBandWidth: number;
} {
  const bands = {
    upper: [],
    middle: [],
    lower: [],
    bandWidths: [],
    averageBandWidth: 0
  };

  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b) / period;
    
    const squaredDiffs = slice.map(price => Math.pow(price - sma, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b) / period;
    const standardDeviation = Math.sqrt(variance);

    bands.middle.push(sma);
    bands.upper.push(sma + (standardDeviation * stdDev));
    bands.lower.push(sma - (standardDeviation * stdDev));
    
    const bandWidth = ((sma + (standardDeviation * stdDev)) - (sma - (standardDeviation * stdDev))) / sma * 100;
    bands.bandWidths.push(bandWidth);
  }

  const recentBandWidths = bands.bandWidths.slice(-lookback);
  bands.averageBandWidth = recentBandWidths.reduce((a, b) => a + b, 0) / recentBandWidths.length;

  return bands;
}

function calculateVolatilityScore(
  bb: { bandWidths?: number[]; averageBandWidth?: number }
): number {
  if (!bb.bandWidths || !bb.averageBandWidth) {
    return 50;
  }

  const currentBandWidth = bb.bandWidths[bb.bandWidths.length - 1];
  const volatilityRatio = currentBandWidth / bb.averageBandWidth;

  // Higher score now means higher volatility
  return Math.max(0, Math.min(100, (volatilityRatio - 0.5) * 100));
}

function calculateTargetFeasibility(
  currentPrice: number,
  targetPrice: number,
  direction: 'long' | 'short',
  volatilityScore: number
): number {
  const percentageMove = Math.abs((targetPrice - currentPrice) / currentPrice) * 100;
  const baseScore = Math.max(0, 100 - Math.pow(percentageMove / 5, 1.5));
  const correctDirection = direction === 'long' 
    ? targetPrice > currentPrice 
    : targetPrice < currentPrice;
    
  // Adjust feasibility based on volatility
  // Higher volatility = lower feasibility for distant targets
  const volatilityAdjustment = volatilityScore / 100;
  const adjustedScore = baseScore * (1 - volatilityAdjustment * 0.5);
  
  return correctDirection ? adjustedScore : 0;
}

export function analyzeTrade(params: {
  prices: number[];
  currentPrice: number;
  takeProfit: number;
  stopLoss: number;
  direction?: 'long' | 'short';
}): {
  trendScore: number;
  momentumScore: number;
  volatilityScore: number;
  overallScore: number;
  marketScore: number;  // <-- Add this
  recommendation: string;
  takeProfitProbability: number;
  stopLossProbability: number;
  explanations: {
    trend: string;
    momentum: string;
    volatility: string;
    probabilities: string;
  };
} {
  const { prices, currentPrice, takeProfit, stopLoss, direction = 'long' } = params;

  // Calculate market condition indicators
  const ema20 = calculateEMA(prices, 20);
  const rsi = calculateRSI(prices);
  const bb = calculateBollingerBands(prices);

  const lastEMA = ema20[ema20.length - 1];
  const lastRSI = rsi[rsi.length - 1];
  const lastBB = {
    upper: bb.upper[bb.upper.length - 1],
    middle: bb.middle[bb.middle.length - 1],
    lower: bb.lower[bb.lower.length - 1],
    bandWidths: bb.bandWidths,
    averageBandWidth: bb.averageBandWidth
  };

  // Calculate market condition scores
  const trendScore = calculateTrendScore(prices, lastEMA, direction);
  const momentumScore = calculateMomentumScore(lastRSI, direction);
  const volatilityScore = calculateVolatilityScore(lastBB);

  // **NEW: Market Score Calculation**
  const marketScore = Math.round(
    (0.4 * trendScore) +
    (0.3 * momentumScore) +
    (0.3 * (100 - volatilityScore)) // Lower volatility is preferable
  );

  // Calculate trade probabilities
  const { tpProbability, slProbability } = calculateTargetProbabilities(
    currentPrice, takeProfit, stopLoss, direction,
    trendScore, momentumScore, volatilityScore
  );

  // Generate explanations
  const explanations = {
    trend: generateTrendExplanation(currentPrice, lastEMA, direction),
    momentum: generateMomentumExplanation(lastRSI, trendScore, direction),
    volatility: generateVolatilityExplanation(lastBB, direction),
    probabilities: generateProbabilityExplanation(tpProbability, slProbability, direction)
  };

  // Calculate overall trade success likelihood
  const overallScore = calculateTradeSuccessLikelihood(
    trendScore, momentumScore, volatilityScore, 
    tpProbability, slProbability
  );

  return {
    trendScore,
    momentumScore,
    volatilityScore,
    overallScore,
    marketScore,  // <-- Add this to the return object
    recommendation: generateRecommendation(overallScore, direction),
    takeProfitProbability: tpProbability,
    stopLossProbability: slProbability,
    explanations
  };
}


function calculateTargetProbabilities(
  currentPrice: number,
  takeProfit: number,
  stopLoss: number,
  direction: 'long' | 'short',
  trendScore: number,
  momentumScore: number,
  volatilityScore: number
): { tpProbability: number; slProbability: number } {
  // Calculate distance to targets as percentages
  const tpDistance = Math.abs((takeProfit - currentPrice) / currentPrice) * 100;
  const slDistance = Math.abs((stopLoss - currentPrice) / currentPrice) * 100;

  // Base probabilities start from market condition scores
  let tpBaseProbability = (trendScore * 0.4 + momentumScore * 0.4 + (100 - volatilityScore) * 0.2);
  let slBaseProbability = 100 - tpBaseProbability;

  // Adjust for direction alignment with trend
  if (direction === 'long') {
    tpBaseProbability *= (trendScore / 100);
    slBaseProbability *= (1 - trendScore / 100);
  } else {
    tpBaseProbability *= (1 - trendScore / 100);
    slBaseProbability *= (trendScore / 100);
  }

  // Adjust for distance (further targets are harder to reach)
  const tpDistanceImpact = Math.max(0, 1 - (tpDistance / 20));
  const slDistanceImpact = Math.max(0, 1 - (slDistance / 20));

  // Adjust for volatility (higher volatility increases both probabilities)
  const volatilityMultiplier = volatilityScore / 100;

  // Calculate final probabilities
  let tpProbability = tpBaseProbability * tpDistanceImpact * (1 - volatilityMultiplier);
  let slProbability = slBaseProbability * slDistanceImpact * volatilityMultiplier;

  // Normalize probabilities to sum to 100%
  const total = tpProbability + slProbability;
  tpProbability = (tpProbability / total) * 100;
  slProbability = (slProbability / total) * 100;

  return {
    tpProbability: Math.round(tpProbability),
    slProbability: Math.round(slProbability)
  };
}

function generateProbabilityExplanation(
  tpProbability: number,
  slProbability: number,
  direction: 'long' | 'short'
): string {
  const tpWord = direction === 'long' ? 'profit target' : 'short target';
  const slWord = direction === 'long' ? 'stop loss' : 'stop out';

  return `Based on current market conditions, there's a ${tpProbability}% chance of hitting the ${tpWord} and a ${slProbability}% chance of hitting the ${slWord}.`;
}

function calculateTrendScore(
  prices: number[],
  ema: number,
  direction: 'long' | 'short'
): number {
  const recentPrices = prices.slice(-20);
  const priceChange = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0] * 100;
  const emaDiff = ((prices[prices.length - 1] - ema) / ema) * 100;
  
  const trendStrength = (priceChange + emaDiff) / 2;
  
  const score = direction === 'long' ? 
    50 + (trendStrength * 5) : 
    50 - (trendStrength * 5);
    
  return Math.max(0, Math.min(100, score));
}

function calculateMomentumScore(
  rsi: number,
  direction: 'long' | 'short'
): number {
  if (direction === 'long') {
    if (rsi < 30) return 90;
    if (rsi < 40) return 70;
    if (rsi > 70) return 20;
    return Math.max(0, 70 - rsi);
  } else {
    if (rsi > 70) return 90;
    if (rsi > 60) return 70;
    if (rsi < 30) return 20;
    return Math.max(0, rsi - 30);
  }
}

function calculateTradeSuccessLikelihood(
  trendScore: number,
  momentumScore: number,
  volatilityScore: number,
  riskRewardRatio: number,
  tpProbability: number,
  slProbability: number
): number {
  // Market conditions (60% of total score)
  const marketConditionScore = (
    trendScore * 0.4 +
    momentumScore * 0.4 +
    (100 - volatilityScore) * 0.2  // Invert volatility score since high volatility is risky
  );

  // Trade parameters (40% of total score)
  const tradeParametersScore = (
    Math.min(100, riskRewardRatio * 33.33) * 0.4 +
    tpProbability * 0.4 +
    (100 - slProbability) * 0.2
  );

  return Math.min(100,
    marketConditionScore * 0.6 +
    tradeParametersScore * 0.4
  );
}

function generateRecommendation(score: number, direction: 'long' | 'short'): string {
  if (direction === 'long') {
    if (score >= 80) return "Strong Buy";
    if (score >= 60) return "Buy";
    if (score >= 40) return "Neutral";
    if (score >= 20) return "Avoid Long";
    return "Strong Avoid Long";
  } else {
    if (score >= 80) return "Strong Short";
    if (score >= 60) return "Short";
    if (score >= 40) return "Neutral";
    if (score >= 20) return "Avoid Short";
    return "Strong Avoid Short";
  }
}

function generateTrendExplanation(
  currentPrice: number,
  ema: number,
  direction: 'long' | 'short'
): string {
  const priceDiff = ((currentPrice - ema) / ema) * 100;
  const aboveBelowEma = currentPrice > ema ? 'above' : 'below';

  if (direction === 'long') {
    if (currentPrice > ema) {
      return `Price is ${aboveBelowEma} EMA by ${Math.abs(priceDiff).toFixed(1)}%, showing upward trend.`;
    } else {
      return `Price is ${aboveBelowEma} EMA by ${Math.abs(priceDiff).toFixed(1)}%, suggesting caution for longs.`;
    }
  } else {
    if (currentPrice < ema) {
      return `Price is ${aboveBelowEma} EMA by ${Math.abs(priceDiff).toFixed(1)}%, showing downward trend.`;
    } else {
      return `Price is ${aboveBelowEma} EMA by ${Math.abs(priceDiff).toFixed(1)}%, suggesting caution for shorts.`;
    }
  }
}

function generateMomentumExplanation(
  rsi: number,
  riskRewardRatio: number,
  direction: 'long' | 'short'
): string {
  let momentumText = '';
  if (rsi > 70) {
    momentumText = 'Overbought conditions';
  } else if (rsi < 30) {
    momentumText = 'Oversold conditions';
  } else {
    momentumText = 'Neutral RSI conditions';
  }

  const rrText = riskRewardRatio >= 2 
    ? 'Favorable risk-reward ratio'
    : 'Risk-reward ratio needs improvement';

  if (direction === 'long') {
    if (rsi < 30) {
      return `${momentumText} suggest potential reversal up. ${rrText}.`;
    } else if (rsi > 70) {
      return `${momentumText} suggest caution for longs. ${rrText}.`;
    }
  } else {
    if (rsi > 70) {
      return `${momentumText} suggest potential reversal down. ${rrText}.`;
    } else if (rsi < 30) {
      return `${momentumText} suggest caution for shorts. ${rrText}.`;
    }
  }

  return `${momentumText}. ${rrText}.`;
}

function generateVolatilityExplanation(
  bb: { bandWidths?: number[]; averageBandWidth?: number },
  direction: 'long' | 'short'
): string {
  if (!bb.bandWidths || !bb.averageBandWidth) {
    return "Volatility data not available";
  }

  const currentBandWidth = bb.bandWidths[bb.bandWidths.length - 1];
  const volatilityRatio = currentBandWidth / bb.averageBandWidth;
  const percentDiff = ((volatilityRatio - 1) * 100).toFixed(1);

  const baseMessage = volatilityRatio > 1.5
    ? `High volatility (${percentDiff}% above average) increases trade risk.`
    : volatilityRatio > 1.1
    ? `Elevated volatility (${percentDiff}% above average) suggests caution.`
    : volatilityRatio < 0.9
    ? `Low volatility (${Math.abs(Number(percentDiff))}% below average) improves predictability.`
    : `Normal volatility conditions (${percentDiff}% from average).`;

  const directionAdvice = direction === 'long'
    ? volatilityRatio > 1.2
      ? ' Consider tighter stops for long positions.'
      : ' Favorable conditions for long positions.'
    : volatilityRatio > 1.2
      ? ' Consider tighter stops for short positions.'
      : ' Favorable conditions for short positions.';

  return baseMessage + directionAdvice;
}

export { calculateTrendScore, calculateMomentumScore }

export { calculateVolatilityScore }