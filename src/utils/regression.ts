// src/utils/regression.ts

export interface RegressionDataPoint {
  x: number;
  y: number;
}

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  predict: (x: number) => number;
  rSquared?: number; // Optional: Coefficient of determination
}

export function calculateLinearRegression(dataPoints: RegressionDataPoint[]): LinearRegressionResult | null {
  const n = dataPoints.length;

  if (n < 2) {
    // Not enough data points to perform a meaningful regression
    return {
        slope: 0,
        intercept: 0,
        predict: (_x: number) => 0,
        rSquared: 0
    };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  // let sumYY = 0; // For R-squared

  for (const point of dataPoints) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumXX += point.x * point.x;
    // sumYY += point.y * point.y; // For R-squared
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    // Avoid division by zero, happens if all x values are the same
     return {
        slope: 0,
        intercept: sumY / n, // Average of Y values if all X are same
        predict: (_x: number) => sumY / n,
        rSquared: 0
    };
  }
  
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared (optional, but good for understanding fit)
  // let ssTotal = 0;
  // let ssResidual = 0;
  // const meanY = sumY / n;

  // for (const point of dataPoints) {
  //   ssTotal += (point.y - meanY) ** 2;
  //   const predictedY = slope * point.x + intercept;
  //   ssResidual += (point.y - predictedY) ** 2;
  // }
  // const rSquared = ssTotal === 0 ? 1 : 1 - (ssResidual / ssTotal); // if ssTotal is 0, all y are same, perfect fit if slope is 0.


  return {
    slope,
    intercept,
    predict: (x: number) => slope * x + intercept,
    // rSquared // Uncomment if you want to use R-squared
  };
}
