import React, { useEffect, useState } from 'react';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import { motion as Motion } from 'framer-motion';
import { db } from '../lib/database';
import { usePrivacyContext } from '../context/PrivacyContext';

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

export default function Dashboard({ onNavigate }) {
  const [portfolioData, setPortfolioData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatAmount } = usePrivacyContext();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    try {
      // Use the centralized portfolio summary from database
      const portfolio = db.getPortfolioSummary();
      const transactions = db.getTransactions();
      const expenses = db.getExpenses();
      const investments = db.getInvestments(); // Still needed for chart data
      
      setPortfolioData(portfolio);

      // Generate real chart data based on last 12 months
      const now = new Date();
      const chartData = [];
      
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = month.toLocaleDateString('it-IT', { month: 'short' });
        
        // Filter data for this month
        const monthIncomes = transactions.filter(t => {
          const tDate = new Date(t.date);
          return t.type === 'income' && 
                 tDate.getMonth() === month.getMonth() && 
                 tDate.getFullYear() === month.getFullYear();
        }).reduce((sum, t) => sum + t.amount, 0);
        
        const monthExpenses = expenses.filter(e => {
          const eDate = new Date(e.date);
          return eDate.getMonth() === month.getMonth() && 
                 eDate.getFullYear() === month.getFullYear();
        }).reduce((sum, e) => sum + e.amount, 0);
        
        const monthInvestments = investments.filter(i => {
          const iDate = new Date(i.purchaseDate || i.createdAt);
          return iDate.getMonth() === month.getMonth() && 
                 iDate.getFullYear() === month.getFullYear();
        }).reduce((sum, i) => sum + (i.quantity * i.purchasePrice), 0);
        
        chartData.push({
          month: monthName,
          entrate: monthIncomes,
          spese: monthExpenses,
          investimenti: monthInvestments,
        });
      }
      
      setChartData(chartData);

      // Real expense breakdown by category
      const expenseCategories = {};
      expenses.forEach(expense => {
        const categoryMap = {
          'casa': '🏠 Casa',
          'trasporti': '🚗 Trasporti', 
          'cibo': '🍕 Cibo',
          'shopping': '🛒 Shopping',
          'intrattenimento': '🎬 Intrattenimento',
          'salute': '💊 Salute',
          'educazione': '📚 Educazione',
          'utenze': '💡 Utenze',
          'altro': '📦 Altro'
        };
        
        const categoryName = categoryMap[expense.category] || expense.category;
        expenseCategories[categoryName] = (expenseCategories[categoryName] || 0) + expense.amount;
      });
      
      const realExpenseData = Object.entries(expenseCategories).map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }));
      
      setExpenseData(realExpenseData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Patrimonio Totale',
      value: portfolioData?.netWorth || 0,
      helper: 'Totale registrato',
      icon: CurrencyDollarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      name: 'Entrate Mensili',
      value: portfolioData?.totalIncome || 0,
      helper: 'Entrate registrate',
      icon: ArrowTrendingUpIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      name: 'Spese Mensili',
      value: portfolioData?.totalExpenses || 0,
      helper: 'Spese registrate',
      icon: ArrowTrendingDownIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      name: 'Investimenti',
      value: portfolioData?.totalInvestments || 0,
      helper: 'Portafoglio + PAC',
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <Motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">Benvenuto nella tua Dashboard! 👋</h1>
        <p className="text-blue-100 text-lg">
          Ecco una panoramica delle tue finanze di oggi, {new Date().toLocaleDateString('it-IT')}
        </p>
      </Motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatAmount(stat.value)}
                </p>
              </div>
              <div className="ml-3 text-right">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.helper}</span>
              </div>
            </div>
          </Motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend Chart */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Andamento Finanziario
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="month" 
                stroke="#6B7280" 
                fontSize={12}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#6B7280" 
                fontSize={12}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `€${value}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value) => [`€${value}`, '']}
              />
              <Area 
                type="monotone" 
                dataKey="entrate" 
                stackId="1" 
                stroke="#10B981" 
                fill="#10B981"
                fillOpacity={0.7}
              />
              <Area 
                type="monotone" 
                dataKey="investimenti" 
                stackId="1" 
                stroke="#3B82F6" 
                fill="#3B82F6"
                fillOpacity={0.7}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Motion.div>

        {/* Expense Breakdown */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Distribuzione Spese
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`€${value}`, 'Spesa']} />
            </PieChart>
          </ResponsiveContainer>
        </Motion.div>
      </div>

      {/* Monthly Comparison */}
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Confronto Mensile
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              stroke="#6B7280"
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="#6B7280"
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `€${value}`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value) => [`€${value}`, '']}
            />
            <Bar dataKey="entrate" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="spese" fill="#EF4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="investimenti" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Motion.div>

      {/* Quick Actions */}
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div 
          className="card hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onNavigate?.('/income')}
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Aggiungi Entrata</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Registra una nuova entrata</p>
            </div>
          </div>
        </div>

        <div 
          className="card hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onNavigate?.('/expenses')}
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Aggiungi Spesa</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Registra una nuova spesa</p>
            </div>
          </div>
        </div>

        <div 
          className="card hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onNavigate?.('/investments')}
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Nuovo Investimento</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Aggiungi un investimento</p>
            </div>
          </div>
        </div>
      </Motion.div>
    </div>
  );
}
