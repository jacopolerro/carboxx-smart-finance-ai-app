import React, { useState, useEffect } from 'react';
import { PlusIcon, CurrencyDollarIcon, CalendarIcon, TagIcon } from '@heroicons/react/24/outline';
import { motion as Motion } from 'framer-motion';
import { db } from '../lib/database';
import Modal, { FormField, Input, Select } from './Modal';

export default function Income() {
  const [incomes, setIncomes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [totalIncome, setTotalIncome] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);

  useEffect(() => {
    loadIncomes();
  }, []);

  const loadIncomes = () => {
    const transactions = db.getTransactions({ type: 'income' });
    setIncomes(transactions);
    
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    setTotalIncome(total);
    
    const thisMonth = new Date();
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === thisMonth.getMonth() && 
             transactionDate.getFullYear() === thisMonth.getFullYear();
    });
    const monthly = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);
    setMonthlyIncome(monthly);
  };

  const handleAddIncome = (formData) => {
    db.addTransaction({
      ...formData,
      type: 'income'
    });
    loadIncomes();
    setShowModal(false);
  };

  const incomeCategories = [
    { value: 'stipendio', label: '💼 Stipendio', color: 'text-blue-600' },
    { value: 'freelance', label: '🚀 Freelance', color: 'text-purple-600' },
    { value: 'bonus', label: '🎁 Bonus', color: 'text-green-600' },
    { value: 'investimenti', label: '📈 Dividendi/Investimenti', color: 'text-orange-600' },
    { value: 'affitto', label: '🏠 Affitto Ricevuto', color: 'text-indigo-600' },
    { value: 'vendita', label: '🛒 Vendite', color: 'text-pink-600' },
    { value: 'altro', label: '📦 Altro', color: 'text-gray-600' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            💰 Le Mie Entrate
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Traccia stipendi, bonus e tutte le tue fonti di reddito
          </p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Nuova Entrata</span>
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
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Entrate Totali</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                €{totalIncome.toLocaleString('it-IT')}
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
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Questo Mese</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                €{monthlyIncome.toLocaleString('it-IT')}
              </p>
            </div>
          </div>
        </Motion.div>
      </div>

      {/* Income List */}
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          📊 Storico Entrate
        </h3>
        
        {incomes.length === 0 ? (
          <div className="text-center py-12">
            <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Nessuna entrata registrata
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Inizia registrando la tua prima entrata
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {incomes.map((income) => {
              const category = incomeCategories.find(cat => cat.value === income.category);
              return (
                <IncomeCard key={income.id} income={income} category={category} />
              );
            })}
          </div>
        )}
      </Motion.div>

      {/* Modal */}
      {showModal && (
        <AddIncomeModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAddIncome}
          categories={incomeCategories}
        />
      )}
    </div>
  );
}

function IncomeCard({ income, category }) {
  return (
    <Motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">€</span>
          </div>
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {income.description}
          </p>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span className={category?.color || 'text-gray-600'}>
              {category?.label || income.category}
            </span>
            <span>•</span>
            <span>{new Date(income.date).toLocaleDateString('it-IT')}</span>
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-lg font-bold text-green-600">
          +€{income.amount.toLocaleString('it-IT')}
        </p>
      </div>
    </Motion.div>
  );
}

function AddIncomeModal({ onClose, onSubmit, categories }) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'stipendio',
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
    <Modal isOpen={true} onClose={onClose} title="💰 Nuova Entrata" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField label="Descrizione" required error={errors.description}>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="es. Stipendio Gennaio 2024"
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
            id="recurring"
            checked={formData.recurring}
            onChange={(e) => setFormData({...formData, recurring: e.target.checked})}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="recurring" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
            💫 Entrata ricorrente (si ripete ogni mese)
          </label>
        </div>

        {formData.amount && (
          <Motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                {formData.recurring ? 'Importo mensile:' : 'Importo una tantum:'}
              </span>
              <span className="text-lg font-bold text-green-900 dark:text-green-100">
                +€{parseFloat(formData.amount || 0).toLocaleString('it-IT')}
              </span>
            </div>
            {formData.recurring && (
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
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
            💰 Aggiungi Entrata
          </button>
        </div>
      </form>
    </Modal>
  );
}