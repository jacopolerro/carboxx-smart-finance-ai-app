import React, { useCallback, useState, useEffect } from 'react';
import { PlusIcon, CreditCardIcon, CalendarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { motion as Motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { db } from '../lib/database';
import Modal, { FormField, Input, Select } from './Modal';

const EXPENSE_CATEGORIES = [
  { value: 'casa', label: '🏠 Casa/Affitto', color: 'text-blue-600' },
  { value: 'trasporti', label: '🚗 Trasporti', color: 'text-red-600' },
  { value: 'cibo', label: '🍕 Cibo & Ristorazione', color: 'text-green-600' },
  { value: 'shopping', label: '🛒 Shopping', color: 'text-purple-600' },
  { value: 'intrattenimento', label: '🎬 Intrattenimento', color: 'text-yellow-600' },
  { value: 'salute', label: '💊 Salute & Benessere', color: 'text-pink-600' },
  { value: 'educazione', label: '📚 Educazione', color: 'text-indigo-600' },
  { value: 'utenze', label: '💡 Utenze', color: 'text-orange-600' },
  { value: 'altro', label: '📦 Altro', color: 'text-gray-600' }
];

const EXPENSE_CHART_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#6366F1', '#F97316', '#6B7280'];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [categoryData, setCategoryData] = useState([]);

  const loadExpenses = useCallback(() => {
    const allExpenses = db.getExpenses();
    setExpenses(allExpenses);
    
    const total = allExpenses.reduce((sum, e) => sum + e.amount, 0);
    setTotalExpenses(total);
    
    const thisMonth = new Date();
    const monthlyExp = allExpenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate.getMonth() === thisMonth.getMonth() && 
             expenseDate.getFullYear() === thisMonth.getFullYear();
    });
    const monthly = monthlyExp.reduce((sum, e) => sum + e.amount, 0);
    setMonthlyExpenses(monthly);

    // Category breakdown
    const categoryTotals = {};
    allExpenses.forEach(expense => {
      const category = EXPENSE_CATEGORIES.find(cat => cat.value === expense.category);
      const label = category ? category.label : expense.category;
      categoryTotals[label] = (categoryTotals[label] || 0) + expense.amount;
    });
    
    const chartData = Object.entries(categoryTotals).map(([name, value], index) => ({
      name,
      value,
      color: EXPENSE_CHART_COLORS[index % EXPENSE_CHART_COLORS.length]
    }));
    setCategoryData(chartData);
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleAddExpense = (formData) => {
    db.addExpense(formData);
    loadExpenses();
    setShowModal(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            💳 Le Mie Spese
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitora tutte le tue spese e controlla il budget
          </p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Nuova Spesa</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <CreditCardIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Spese Totali</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                €{totalExpenses.toLocaleString('it-IT')}
              </p>
            </div>
          </div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Questo Mese</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                €{monthlyExpenses.toLocaleString('it-IT')}
              </p>
            </div>
          </div>
        </Motion.div>
      </div>

      {/* Charts and Expenses Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              📊 Spese per Categoria
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`€${value}`, 'Spesa']} />
              </PieChart>
            </ResponsiveContainer>
          </Motion.div>
        )}

        {/* Recent Expenses */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            🕒 Spese Recenti
          </h3>
          
          {expenses.slice(0, 5).length === 0 ? (
            <div className="text-center py-8">
              <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Nessuna spesa registrata
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.slice(0, 5).map((expense) => {
                const category = EXPENSE_CATEGORIES.find(cat => cat.value === expense.category);
                return (
                  <ExpenseCard key={expense.id} expense={expense} category={category} compact />
                );
              })}
            </div>
          )}
        </Motion.div>
      </div>

      {/* Full Expense List */}
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          📝 Tutte le Spese
        </h3>
        
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Nessuna spesa registrata
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Inizia registrando la tua prima spesa
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => {
              const category = EXPENSE_CATEGORIES.find(cat => cat.value === expense.category);
              return (
                <ExpenseCard key={expense.id} expense={expense} category={category} />
              );
            })}
          </div>
        )}
      </Motion.div>

      {/* Modal */}
      {showModal && (
        <AddExpenseModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAddExpense}
          categories={EXPENSE_CATEGORIES}
        />
      )}
    </div>
  );
}

function ExpenseCard({ expense, category, compact = false }) {
  return (
    <Motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${compact ? 'py-3' : ''}`}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">-</span>
          </div>
        </div>
        <div>
          <p className={`font-semibold text-gray-900 dark:text-gray-100 ${compact ? 'text-sm' : ''}`}>
            {expense.description}
          </p>
          <div className={`flex items-center space-x-2 text-gray-500 dark:text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>
            <span className={category?.color || 'text-gray-600'}>
              {category?.label || expense.category}
            </span>
            <span>•</span>
            <span>{new Date(expense.date).toLocaleDateString('it-IT')}</span>
            {expense.recurring && (
              <>
                <span>•</span>
                <span className="text-blue-600 text-xs">🔄 Ricorrente</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <p className={`font-bold text-red-600 ${compact ? 'text-sm' : 'text-lg'}`}>
          -€{expense.amount.toLocaleString('it-IT')}
        </p>
      </div>
    </Motion.div>
  );
}

function AddExpenseModal({ onClose, onSubmit, categories }) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'altro',
    date: new Date().toISOString().split('T')[0],
    recurring: false
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.description.trim()) newErrors.description = 'La descrizione è obbligatoria';
    if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Inserisci un importo valido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        amount: parseFloat(formData.amount)
      });
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="💳 Nuova Spesa" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField label="Descrizione" required error={errors.description}>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="es. Spesa al supermercato"
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Importo (€)" required error={errors.amount}>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Data" required>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </FormField>
        </div>

        <FormField label="Categoria" required>
          <Select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="recurring-expense"
            checked={formData.recurring}
            onChange={(e) => setFormData({...formData, recurring: e.target.checked})}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="recurring-expense" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
            🔄 Spesa ricorrente (si ripete ogni mese)
          </label>
        </div>

        {formData.amount && (
          <Motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                {formData.recurring ? 'Costo mensile:' : 'Costo una tantum:'}
              </span>
              <span className="text-lg font-bold text-red-900 dark:text-red-100">
                -€{parseFloat(formData.amount || 0).toLocaleString('it-IT')}
              </span>
            </div>
            {formData.recurring && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                Annuale stimato: €{(parseFloat(formData.amount || 0) * 12).toLocaleString('it-IT')}
              </div>
            )}
          </Motion.div>
        )}

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Annulla
          </button>
          <button
            type="submit"
            className="btn-primary"
          >
            💳 Aggiungi Spesa
          </button>
        </div>
      </form>
    </Modal>
  );
}
