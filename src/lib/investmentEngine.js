const DEFAULTS = {
  initialCapital: 1000,
  monthlyContribution: 200,
  years: 20,
  expectedReturn: 5,
  volatility: 12,
  inflation: 2,
  annualFees: 0.25,
  taxRate: 26,
  goalAmount: 50000,
  iterations: 1200,
  seed: 42
};

export const INVESTMENT_PROFILES = {
  prudent: {
    label: 'Prudente',
    description: 'Rendimenti piu bassi, oscillazioni contenute.',
    expectedReturn: 3.2,
    volatility: 6,
    inflation: 2,
    annualFees: 0.2
  },
  balanced: {
    label: 'Bilanciato',
    description: 'Compromesso tra crescita e volatilita.',
    expectedReturn: 5,
    volatility: 12,
    inflation: 2,
    annualFees: 0.25
  },
  growth: {
    label: 'Crescita',
    description: 'Maggiore potenziale, drawdown piu profondi.',
    expectedReturn: 7,
    volatility: 18,
    inflation: 2,
    annualFees: 0.3
  }
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const normalizeAssumptions = (raw = {}) => ({
  initialCapital: clamp(toNumber(raw.initialCapital, DEFAULTS.initialCapital), 0, 100000000),
  monthlyContribution: clamp(toNumber(raw.monthlyContribution, DEFAULTS.monthlyContribution), 0, 10000000),
  years: clamp(Math.round(toNumber(raw.years, DEFAULTS.years)), 1, 60),
  expectedReturn: clamp(toNumber(raw.expectedReturn, DEFAULTS.expectedReturn), -30, 30),
  volatility: clamp(toNumber(raw.volatility, DEFAULTS.volatility), 0, 80),
  inflation: clamp(toNumber(raw.inflation, DEFAULTS.inflation), -5, 20),
  annualFees: clamp(toNumber(raw.annualFees, DEFAULTS.annualFees), 0, 5),
  taxRate: clamp(toNumber(raw.taxRate, DEFAULTS.taxRate), 0, 60),
  goalAmount: clamp(toNumber(raw.goalAmount, DEFAULTS.goalAmount), 0, 100000000),
  iterations: clamp(Math.round(toNumber(raw.iterations, DEFAULTS.iterations)), 250, 5000),
  seed: Math.round(toNumber(raw.seed, DEFAULTS.seed))
});

export const createAssumptionSet = (raw = {}) => {
  const assumptions = normalizeAssumptions(raw);
  return {
    ...assumptions,
    annualNetReturn: assumptions.expectedReturn - assumptions.annualFees,
    monthlyContributionTotal: assumptions.monthlyContribution * assumptions.years * 12,
    totalPlannedCapital: assumptions.initialCapital + assumptions.monthlyContribution * assumptions.years * 12
  };
};

const annualToMonthlyRate = (annualPercent) => Math.pow(1 + annualPercent / 100, 1 / 12) - 1;

const applyFinalTax = (balance, invested, taxRate) => {
  const taxableGain = Math.max(0, balance - invested);
  return balance - taxableGain * (taxRate / 100);
};

const realValue = (nominalValue, inflation, year) =>
  nominalValue / Math.pow(1 + inflation / 100, year);

export const runDeterministicProjection = (rawAssumptions) => {
  const assumptions = createAssumptionSet(rawAssumptions);
  const monthlyReturn = annualToMonthlyRate(assumptions.annualNetReturn);
  const data = [];
  let balance = assumptions.initialCapital;
  let invested = assumptions.initialCapital;

  data.push({
    year: 0,
    invested,
    nominalValue: balance,
    afterTaxValue: applyFinalTax(balance, invested, assumptions.taxRate),
    realAfterTaxValue: realValue(applyFinalTax(balance, invested, assumptions.taxRate), assumptions.inflation, 0)
  });

  for (let month = 1; month <= assumptions.years * 12; month += 1) {
    balance = balance * (1 + monthlyReturn) + assumptions.monthlyContribution;
    invested += assumptions.monthlyContribution;

    if (month % 12 === 0) {
      const year = month / 12;
      const afterTaxValue = applyFinalTax(balance, invested, assumptions.taxRate);
      data.push({
        year,
        invested: Math.round(invested),
        nominalValue: Math.round(balance),
        afterTaxValue: Math.round(afterTaxValue),
        realAfterTaxValue: Math.round(realValue(afterTaxValue, assumptions.inflation, year)),
        growth: Math.round(afterTaxValue - invested)
      });
    }
  }

  const finalPoint = data[data.length - 1];
  return {
    assumptions,
    data,
    summary: {
      finalNominalValue: finalPoint.nominalValue,
      finalAfterTaxValue: finalPoint.afterTaxValue,
      finalRealValue: finalPoint.realAfterTaxValue,
      totalInvested: finalPoint.invested,
      estimatedGrowth: finalPoint.afterTaxValue - finalPoint.invested,
      goalReached: assumptions.goalAmount > 0 ? finalPoint.afterTaxValue >= assumptions.goalAmount : null
    }
  };
};

const createSeededRandom = (seed) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const normalRandom = (random) => {
  const u1 = Math.max(random(), Number.EPSILON);
  const u2 = Math.max(random(), Number.EPSILON);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};

const quantile = (values, probability) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

export const runMonteCarloSimulation = (rawAssumptions) => {
  const assumptions = createAssumptionSet(rawAssumptions);
  const random = createSeededRandom(assumptions.seed);
  const monthlyMean = assumptions.annualNetReturn / 100 / 12;
  const monthlyVolatility = assumptions.volatility / 100 / Math.sqrt(12);
  const yearlyValues = Array.from({ length: assumptions.years + 1 }, () => []);
  const finalValues = [];
  const finalRealValues = [];
  const maxDrawdowns = [];
  let goalHits = 0;
  let lossHits = 0;

  for (let iteration = 0; iteration < assumptions.iterations; iteration += 1) {
    let balance = assumptions.initialCapital;
    let invested = assumptions.initialCapital;
    let peak = Math.max(balance, 1);
    let maxDrawdown = 0;

    yearlyValues[0].push(applyFinalTax(balance, invested, assumptions.taxRate));

    for (let month = 1; month <= assumptions.years * 12; month += 1) {
      const randomMonthlyReturn = clamp(monthlyMean + monthlyVolatility * normalRandom(random), -0.95, 1.25);
      balance = balance * (1 + randomMonthlyReturn) + assumptions.monthlyContribution;
      invested += assumptions.monthlyContribution;
      peak = Math.max(peak, balance);
      maxDrawdown = Math.max(maxDrawdown, peak > 0 ? (peak - balance) / peak : 0);

      if (month % 12 === 0) {
        yearlyValues[month / 12].push(applyFinalTax(balance, invested, assumptions.taxRate));
      }
    }

    const afterTaxFinal = applyFinalTax(balance, invested, assumptions.taxRate);
    const realFinal = realValue(afterTaxFinal, assumptions.inflation, assumptions.years);
    finalValues.push(afterTaxFinal);
    finalRealValues.push(realFinal);
    maxDrawdowns.push(maxDrawdown);

    if (assumptions.goalAmount > 0 && afterTaxFinal >= assumptions.goalAmount) goalHits += 1;
    if (afterTaxFinal < invested) lossHits += 1;
  }

  const percentileData = yearlyValues.map((values, year) => ({
    year,
    p10: Math.round(quantile(values, 0.1)),
    median: Math.round(quantile(values, 0.5)),
    p90: Math.round(quantile(values, 0.9))
  }));

  return {
    assumptions,
    data: percentileData,
    summary: {
      p10: Math.round(quantile(finalValues, 0.1)),
      median: Math.round(quantile(finalValues, 0.5)),
      p90: Math.round(quantile(finalValues, 0.9)),
      realMedian: Math.round(quantile(finalRealValues, 0.5)),
      probabilityOfGoal: assumptions.goalAmount > 0 ? goalHits / assumptions.iterations : null,
      probabilityOfLoss: lossHits / assumptions.iterations,
      medianMaxDrawdown: quantile(maxDrawdowns, 0.5),
      severeMaxDrawdown: quantile(maxDrawdowns, 0.9)
    }
  };
};

const simulateAnnualPath = (rawAssumptions, annualReturns, inflationOverride = null) => {
  const assumptions = createAssumptionSet(rawAssumptions);
  const inflation = inflationOverride ?? assumptions.inflation;
  const data = [];
  let balance = assumptions.initialCapital;
  let invested = assumptions.initialCapital;
  let peak = Math.max(balance, 1);
  let marketIndex = 100;
  let marketPeak = 100;
  let maxDrawdown = 0;

  data.push({
    year: 0,
    invested,
    afterTaxValue: applyFinalTax(balance, invested, assumptions.taxRate),
    realAfterTaxValue: applyFinalTax(balance, invested, assumptions.taxRate)
  });

  for (let year = 1; year <= assumptions.years; year += 1) {
    const annualReturn = annualReturns[year - 1] ?? annualReturns[annualReturns.length - 1] ?? assumptions.annualNetReturn;
    const monthlyReturn = annualToMonthlyRate(annualReturn - assumptions.annualFees);

    for (let month = 1; month <= 12; month += 1) {
      balance = balance * (1 + monthlyReturn) + assumptions.monthlyContribution;
      invested += assumptions.monthlyContribution;
      peak = Math.max(peak, balance);
      marketIndex *= (1 + monthlyReturn);
      marketPeak = Math.max(marketPeak, marketIndex);
      const portfolioDrawdown = peak > 0 ? (peak - balance) / peak : 0;
      const marketDrawdown = marketPeak > 0 ? (marketPeak - marketIndex) / marketPeak : 0;
      maxDrawdown = Math.max(maxDrawdown, portfolioDrawdown, marketDrawdown);
    }

    const afterTaxValue = applyFinalTax(balance, invested, assumptions.taxRate);
    data.push({
      year,
      invested: Math.round(invested),
      afterTaxValue: Math.round(afterTaxValue),
      realAfterTaxValue: Math.round(realValue(afterTaxValue, inflation, year))
    });
  }

  const finalPoint = data[data.length - 1];
  return {
    data,
    finalAfterTaxValue: finalPoint.afterTaxValue,
    finalRealValue: finalPoint.realAfterTaxValue,
    maxDrawdown
  };
};

export const runStressTests = (rawAssumptions) => {
  const assumptions = createAssumptionSet(rawAssumptions);
  const baseReturn = assumptions.annualNetReturn;
  const paths = [
    {
      id: 'early_crisis',
      name: 'Crisi iniziale',
      description: 'Primi anni negativi, poi recupero graduale.',
      returns: [-32, -12, 18, 11, 8, 7, baseReturn]
    },
    {
      id: 'sideways_market',
      name: 'Mercato laterale',
      description: 'Anni alterni con crescita debole.',
      returns: [1, -4, 3, -2, 4, 0, 5, baseReturn]
    },
    {
      id: 'high_inflation',
      name: 'Inflazione alta',
      description: 'Rendimenti nominali discreti, potere d acquisto sotto pressione.',
      returns: [baseReturn + 1, baseReturn - 1, baseReturn, baseReturn + 0.5],
      inflation: Math.max(assumptions.inflation + 3, 5)
    },
    {
      id: 'strong_cycle',
      name: 'Ciclo forte',
      description: 'Primi anni favorevoli, poi normalizzazione.',
      returns: [18, 14, 11, 9, 8, baseReturn]
    }
  ];

  return paths.map((path) => ({
    ...path,
    ...simulateAnnualPath(assumptions, path.returns, path.inflation)
  }));
};

export const buildInvestmentAnalysis = (rawAssumptions) => {
  const deterministic = runDeterministicProjection(rawAssumptions);
  const monteCarlo = runMonteCarloSimulation(rawAssumptions);
  const stressTests = runStressTests(rawAssumptions);

  return {
    assumptions: deterministic.assumptions,
    deterministic,
    monteCarlo,
    stressTests,
    metadata: {
      modelVersion: 'investment-engine-v1',
      generatedAt: new Date().toISOString(),
      warning: 'Modello probabilistico indicativo. Non e consulenza finanziaria e non prevede il mercato.'
    }
  };
};
