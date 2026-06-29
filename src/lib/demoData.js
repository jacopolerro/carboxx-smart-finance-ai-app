const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const createId = (prefix, index) => `${prefix}_${index}_${Date.now().toString(36)}`;

export const createSafeDemoData = () => ({
  users: [],
  transactions: [
    {
      id: createId('income', 1),
      type: 'income',
      amount: 350,
      category: 'altro',
      description: 'Supporto famiglia',
      date: daysAgo(26),
      createdAt: daysAgo(26)
    },
    {
      id: createId('income', 2),
      type: 'income',
      amount: 620,
      category: 'freelance',
      description: 'Sito vetrina cliente',
      date: daysAgo(18),
      createdAt: daysAgo(18)
    },
    {
      id: createId('income', 3),
      type: 'income',
      amount: 180,
      category: 'freelance',
      description: 'Manutenzione sito web',
      date: daysAgo(8),
      createdAt: daysAgo(8)
    },
    {
      id: createId('income', 4),
      type: 'income',
      amount: 90,
      category: 'altro',
      description: 'Rimborso libri universitari',
      date: daysAgo(4),
      createdAt: daysAgo(4)
    }
  ],
  expenses: [
    {
      id: createId('expense', 1),
      amount: 42,
      category: 'trasporti',
      description: 'Abbonamento mezzi',
      date: daysAgo(24),
      recurring: true,
      createdAt: daysAgo(24)
    },
    {
      id: createId('expense', 2),
      amount: 68,
      category: 'cibo',
      description: 'Spesa alimentare',
      date: daysAgo(21),
      recurring: false,
      createdAt: daysAgo(21)
    },
    {
      id: createId('expense', 3),
      amount: 16,
      category: 'cibo',
      description: 'Pranzo universita',
      date: daysAgo(13),
      recurring: false,
      createdAt: daysAgo(13)
    },
    {
      id: createId('expense', 4),
      amount: 29,
      category: 'utenze',
      description: 'Telefono',
      date: daysAgo(10),
      recurring: true,
      createdAt: daysAgo(10)
    },
    {
      id: createId('expense', 5),
      amount: 45,
      category: 'educazione',
      description: 'Corso online',
      date: daysAgo(7),
      recurring: false,
      createdAt: daysAgo(7)
    },
    {
      id: createId('expense', 6),
      amount: 24,
      category: 'intrattenimento',
      description: 'Uscita con amici',
      date: daysAgo(3),
      recurring: false,
      createdAt: daysAgo(3)
    }
  ],
  investments: [
    {
      id: createId('investment', 1),
      name: 'ETF MSCI World Demo',
      symbol: 'SWDA',
      type: 'etf',
      quantity: 4,
      purchasePrice: 82,
      purchaseDate: daysAgo(180),
      currentValue: 352,
      currentPrice: 88,
      performance: 7.32,
      createdAt: daysAgo(180)
    },
    {
      id: createId('investment', 2),
      name: 'Bitcoin Demo',
      symbol: 'BTC',
      type: 'crypto',
      quantity: 0.006,
      purchasePrice: 58000,
      purchaseDate: daysAgo(95),
      currentValue: 390,
      currentPrice: 65000,
      performance: 12.07,
      createdAt: daysAgo(95)
    }
  ],
  pacPlans: [
    {
      id: createId('pac', 1),
      assetName: 'VWCE Demo',
      assetSymbol: 'VWCE',
      amount: 150,
      frequency: 'monthly',
      startDate: daysAgo(120),
      initialCapital: 500,
      isActive: true,
      nextExecutionDate: daysAgo(-14),
      totalInvested: 1100,
      createdAt: daysAgo(120)
    }
  ],
  budgets: [
    {
      id: createId('budget', 1),
      category: 'cibo',
      amount: 180,
      spent: 84,
      period: 'monthly',
      createdAt: daysAgo(28)
    },
    {
      id: createId('budget', 2),
      category: 'intrattenimento',
      amount: 100,
      spent: 24,
      period: 'monthly',
      createdAt: daysAgo(28)
    }
  ]
});

