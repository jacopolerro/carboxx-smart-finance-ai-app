// Database locale con localStorage
const DB_PREFIX = 'finance_app_';

export class Database {
  constructor() {
    this.initializeDatabase();
  }

  initializeDatabase() {
    const tables = ['users', 'transactions', 'investments', 'pac_plans', 'expenses', 'budgets'];
    tables.forEach(table => {
      if (!localStorage.getItem(DB_PREFIX + table)) {
        localStorage.setItem(DB_PREFIX + table, JSON.stringify([]));
      }
    });
  }

  // Utility methods
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getTable(tableName) {
    return JSON.parse(localStorage.getItem(DB_PREFIX + tableName) || '[]');
  }

  saveTable(tableName, data) {
    localStorage.setItem(DB_PREFIX + tableName, JSON.stringify(data));
  }

  // Transactions
  addTransaction(transaction) {
    const transactions = this.getTable('transactions');
    const newTransaction = {
      id: this.generateId(),
      ...transaction,
      date: transaction.date || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    transactions.push(newTransaction);
    this.saveTable('transactions', transactions);
    return newTransaction;
  }

  getTransactions(filters = {}) {
    let transactions = this.getTable('transactions');
    
    if (filters.type) {
      transactions = transactions.filter(t => t.type === filters.type);
    }
    if (filters.category) {
      transactions = transactions.filter(t => t.category === filters.category);
    }
    if (filters.dateFrom) {
      transactions = transactions.filter(t => new Date(t.date) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      transactions = transactions.filter(t => new Date(t.date) <= new Date(filters.dateTo));
    }
    
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // Investments
  addInvestment(investment) {
    const investments = this.getTable('investments');
    const newInvestment = {
      id: this.generateId(),
      ...investment,
      createdAt: new Date().toISOString(),
      currentValue: investment.quantity * investment.purchasePrice
    };
    investments.push(newInvestment);
    this.saveTable('investments', investments);
    return newInvestment;
  }

  getInvestments() {
    return this.getTable('investments');
  }

  updateInvestmentPrice(investmentId, currentPrice) {
    const investments = this.getTable('investments');
    const investment = investments.find(i => i.id === investmentId);
    if (investment) {
      investment.currentPrice = currentPrice;
      investment.currentValue = investment.quantity * currentPrice;
      investment.performance = ((currentPrice - investment.purchasePrice) / investment.purchasePrice) * 100;
      investment.lastUpdated = new Date().toISOString();
      this.saveTable('investments', investments);
    }
  }

  // PAC Plans (Piano di Accumulo Capitale)
  addPACPlan(plan) {
    const pacPlans = this.getTable('pac_plans');
    const newPlan = {
      id: this.generateId(),
      ...plan,
      isActive: true,
      createdAt: new Date().toISOString(),
      startDate: plan.startDate || new Date().toISOString(),
      initialCapital: plan.initialCapital || 0,
      nextExecutionDate: this.calculateNextExecution(plan.frequency, plan.startDate),
      totalInvested: this.calculatePACTotalInvested(plan.startDate, plan.amount, plan.frequency, plan.initialCapital)
    };
    pacPlans.push(newPlan);
    this.saveTable('pac_plans', pacPlans);
    return newPlan;
  }

  calculatePACTotalInvested(startDate, monthlyAmount, frequency, initialCapital = 0) {
    const start = new Date(startDate);
    const now = new Date();
    const monthsDiff = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24 * 30.44))); // Average days per month
    
    let totalMonthlyPayments = 0;
    switch (frequency) {
      case 'weekly':
        totalMonthlyPayments = monthsDiff * (monthlyAmount * 52 / 12);
        break;
      case 'monthly':
        totalMonthlyPayments = monthsDiff * monthlyAmount;
        break;
      case 'quarterly':
        totalMonthlyPayments = Math.floor(monthsDiff / 3) * monthlyAmount;
        break;
      default:
        totalMonthlyPayments = monthsDiff * monthlyAmount;
    }
    
    return initialCapital + totalMonthlyPayments;
  }

  getPACPlans() {
    return this.getTable('pac_plans');
  }

  deleteInvestment(id) {
    const investments = this.getTable('investments');
    const filtered = investments.filter(inv => inv.id !== id);
    this.saveTable('investments', filtered);
    return true;
  }

  deletePACPlan(id) {
    const pacPlans = this.getTable('pac_plans');
    const filtered = pacPlans.filter(plan => plan.id !== id);
    this.saveTable('pac_plans', filtered);
    return true;
  }

  calculateNextExecution(frequency, startDate) {
    const now = new Date();
    const start = startDate ? new Date(startDate) : now;
    
    switch (frequency) {
      case 'weekly': {
        const nextWeekly = new Date(start);
        while (nextWeekly <= now) {
          nextWeekly.setDate(nextWeekly.getDate() + 7);
        }
        return nextWeekly.toISOString();
      }
      case 'monthly': {
        const nextMonthly = new Date(start);
        while (nextMonthly <= now) {
          nextMonthly.setMonth(nextMonthly.getMonth() + 1);
        }
        return nextMonthly.toISOString();
      }
      case 'quarterly': {
        const nextQuarterly = new Date(start);
        while (nextQuarterly <= now) {
          nextQuarterly.setMonth(nextQuarterly.getMonth() + 3);
        }
        return nextQuarterly.toISOString();
      }
      default: {
        const nextDefault = new Date(start);
        while (nextDefault <= now) {
          nextDefault.setMonth(nextDefault.getMonth() + 1);
        }
        return nextDefault.toISOString();
      }
    }
  }

  // Expenses
  addExpense(expense) {
    const expenses = this.getTable('expenses');
    const newExpense = {
      id: this.generateId(),
      ...expense,
      date: expense.date || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    expenses.push(newExpense);
    this.saveTable('expenses', expenses);
    return newExpense;
  }

  getExpenses(filters = {}) {
    let expenses = this.getTable('expenses');
    
    if (filters.category) {
      expenses = expenses.filter(e => e.category === filters.category);
    }
    if (filters.recurring !== undefined) {
      expenses = expenses.filter(e => e.recurring === filters.recurring);
    }
    
    return expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // Budgets
  addBudget(budget) {
    const budgets = this.getTable('budgets');
    const newBudget = {
      id: this.generateId(),
      ...budget,
      spent: 0,
      createdAt: new Date().toISOString()
    };
    budgets.push(newBudget);
    this.saveTable('budgets', budgets);
    return newBudget;
  }

  getBudgets() {
    return this.getTable('budgets');
  }

  updateBudgetSpent(budgetId, amount) {
    const budgets = this.getTable('budgets');
    const budget = budgets.find(b => b.id === budgetId);
    if (budget) {
      budget.spent += amount;
      this.saveTable('budgets', budgets);
    }
  }

  // Analytics
  getPortfolioSummary() {
    const transactions = this.getTable('transactions');
    const investments = this.getTable('investments');
    const pacPlans = this.getTable('pac_plans');
    const expenses = this.getTable('expenses');

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = expenses
      .reduce((sum, e) => sum + e.amount, 0);

    const totalInvestments = investments
      .reduce((sum, i) => sum + (i.currentValue || i.quantity * i.purchasePrice), 0);

    // Calculate total PAC investments (amount actually invested so far)
    const totalPACInvestments = pacPlans
      .filter(pac => pac.isActive)
      .reduce((sum, pac) => {
        const totalInvested = this.calculatePACTotalInvested(
          pac.startDate || pac.createdAt, 
          pac.amount, 
          pac.frequency, 
          pac.initialCapital || 0
        );
        return sum + totalInvested;
      }, 0);

    const combinedInvestments = totalInvestments + totalPACInvestments;
    const netWorth = totalIncome - totalExpenses + combinedInvestments;

    return {
      totalIncome,
      totalExpenses,
      totalInvestments: combinedInvestments, // Include PAC in total
      totalDirectInvestments: totalInvestments, // Only direct investments  
      totalPACInvestments, // Only PAC investments
      netWorth,
      cashFlow: totalIncome - totalExpenses
    };
  }
}

export const db = new Database();
