import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowPathIcon,
  TrashIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { db } from '../lib/database';
import Modal, { FormField, Input, Select } from './Modal';
import { usePrivacyContext } from '../context/PrivacyContext';
import InvestmentLab from './InvestmentLab';

export default function Investments() {
  const [investments, setInvestments] = useState([]);
  const [pacPlans, setPacPlans] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPacModal, setShowPacModal] = useState(false);
  const [activeTab, setActiveTab] = useState('portfolio');
  const { formatAmount } = usePrivacyContext();

  useEffect(() => {
    loadInvestments();
    loadPacPlans();
  }, []);

  const loadInvestments = () => {
    const data = db.getInvestments();
    setInvestments(data);
  };

  const loadPacPlans = () => {
    const plans = db.getPACPlans();
    setPacPlans(plans);
  };

  const handleAddInvestment = (formData) => {
    db.addInvestment(formData);
    loadInvestments();
    setShowAddModal(false);
  };

  const handleAddPac = (formData) => {
    db.addPACPlan(formData);
    loadPacPlans();
    setShowPacModal(false);
  };

  const handleDeleteInvestment = (id) => {
    if (confirm('Sei sicuro di voler eliminare questo investimento?')) {
      db.deleteInvestment(id);
      loadInvestments();
    }
  };

  const handleDeletePac = (id) => {
    if (confirm('Sei sicuro di voler eliminare questo piano PAC?')) {
      db.deletePACPlan(id);
      loadPacPlans();
    }
  };

  const getTotalPortfolioValue = () => {
    return investments.reduce((total, inv) => total + (inv.currentValue || inv.quantity * inv.purchasePrice), 0);
  };

  const getTotalGainLoss = () => {
    return investments.reduce((total, inv) => {
      const currentValue = inv.currentValue || inv.quantity * inv.purchasePrice;
      const investedAmount = inv.quantity * inv.purchasePrice;
      return total + (currentValue - investedAmount);
    }, 0);
  };

  const getTotalPacMonthlyAmount = () => {
    return pacPlans.reduce((total, plan) => {
      if (!plan.isActive) return total;
      
      switch (plan.frequency) {
        case 'weekly':
          return total + (plan.amount * 52 / 12); // Convert weekly to monthly
        case 'monthly':
          return total + plan.amount;
        case 'quarterly':
          return total + (plan.amount / 3); // Convert quarterly to monthly
        default:
          return total + plan.amount;
      }
    }, 0);
  };

  const getTotalPacInvestedAmount = () => {
    return pacPlans.reduce((total, plan) => {
      if (!plan.isActive) return total;
      
      // Use the actual invested amount calculated by the database
      const totalInvested = db.calculatePACTotalInvested(
        plan.startDate || plan.createdAt, 
        plan.amount, 
        plan.frequency, 
        plan.initialCapital || 0
      );
      
      return total + totalInvested;
    }, 0);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            I Miei Investimenti
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestisci il tuo portafoglio e i piani PAC
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nuovo Investimento</span>
          </button>
          <button
            onClick={() => setShowPacModal(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <ClockIcon className="h-5 w-5" />
            <span>Nuovo PAC</span>
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Valore Totale</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatAmount(getTotalPortfolioValue())}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${getTotalGainLoss() >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              {getTotalGainLoss() >= 0 ? (
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
              ) : (
                <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Guadagno/Perdita</p>
              <p className={`text-2xl font-bold ${getTotalGainLoss() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(getTotalGainLoss())}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Numero Posizioni</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {investments.length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'portfolio', name: 'Portafoglio', icon: ChartBarIcon },
            { id: 'pac', name: 'Piani PAC', icon: ClockIcon },
            { id: 'simulator', name: 'Simulatore', icon: BeakerIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {investments.length === 0 ? (
            <div className="text-center py-12">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                Nessun investimento
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Inizia aggiungendo il tuo primo investimento
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {investments.map((investment) => (
                <InvestmentCard 
                  key={investment.id} 
                  investment={investment} 
                  onDelete={handleDeleteInvestment}
                  formatAmount={formatAmount}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* PAC Tab */}
      {activeTab === 'pac' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* PAC Summary Cards */}
          {pacPlans.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="flex items-center">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <ArrowPathIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">PAC Mensile Totale</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatAmount(getTotalPacMonthlyAmount())}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
              >
                <div className="flex items-center">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <ChartBarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Totale Investito PAC</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatAmount(getTotalPacInvestedAmount())}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
              >
                <div className="flex items-center">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <ClockIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Piani Attivi</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {pacPlans.filter(plan => plan.isActive).length}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
          
          {pacPlans.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                Nessun piano PAC
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Crea il tuo primo Piano di Accumulo Capitale
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pacPlans.map((plan) => (
                <PacCard 
                  key={plan.id} 
                  plan={plan} 
                  onDelete={handleDeletePac}
                  formatAmount={formatAmount}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Simulator Tab */}
      {activeTab === 'simulator' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <InvestmentLab />
        </motion.div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddInvestmentModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddInvestment}
        />
      )}

      {showPacModal && (
        <AddPacModal
          onClose={() => setShowPacModal(false)}
          onSubmit={handleAddPac}
        />
      )}
    </div>
  );
}

function InvestmentCard({ investment, onDelete, formatAmount }) {
  const currentValue = investment.currentValue || investment.quantity * investment.purchasePrice;
  const investedAmount = investment.quantity * investment.purchasePrice;
  const gainLoss = currentValue - investedAmount;
  const gainLossPercentage = (gainLoss / investedAmount) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {investment.symbol?.charAt(0) || investment.name?.charAt(0)}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {investment.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {investment.symbol} • {investment.type}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Quantità</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {investment.quantity}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Prezzo Acquisto</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {formatAmount(investment.purchasePrice)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Valore Attuale</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {formatAmount(currentValue)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Guadagno/Perdita</p>
              <p className={`font-semibold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(gainLoss)} ({gainLossPercentage.toFixed(2)}%)
              </p>
            </div>
          </div>
        </div>

        <div className="ml-4 flex space-x-2">
          <button 
            onClick={() => onDelete(investment.id)}
            className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300"
            title="Elimina investimento"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function PacCard({ plan, onDelete, formatAmount }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                PAC {plan.assetName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {plan.frequency} • {formatAmount(plan.amount)} per versamento
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Iniziato il {new Date(plan.startDate || plan.createdAt).toLocaleDateString('it-IT')}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Importo Mensile</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {formatAmount ? formatAmount(plan.amount) : `€${plan.amount}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Investito Totale</p>
              <p className="font-semibold text-green-600 dark:text-green-400">
                {formatAmount(db.calculatePACTotalInvested(
                  plan.startDate || plan.createdAt, 
                  plan.amount, 
                  plan.frequency, 
                  plan.initialCapital || 0
                ))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Frequenza</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {plan.frequency}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Prossimo Versamento</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {new Date(plan.nextExecutionDate).toLocaleDateString('it-IT')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Stato</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                plan.isActive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }`}>
                {plan.isActive ? 'Attivo' : 'Sospeso'}
              </span>
            </div>
          </div>
        </div>

        <div className="ml-4 flex space-x-2">
          <button 
            onClick={() => onDelete(plan.id)}
            className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300"
            title="Elimina piano PAC"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function AddInvestmentModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'azione',
    quantity: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Il nome è obbligatorio';
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Inserisci una quantità valida';
    if (!formData.purchasePrice || formData.purchasePrice <= 0) newErrors.purchasePrice = 'Inserisci un prezzo valido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        quantity: parseFloat(formData.quantity),
        purchasePrice: parseFloat(formData.purchasePrice)
      });
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="🚀 Nuovo Investimento" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Nome Asset" required error={errors.name}>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="es. Apple Inc."
            />
          </FormField>

          <FormField label="Simbolo/Ticker">
            <Input
              value={formData.symbol}
              onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
              placeholder="es. AAPL"
            />
          </FormField>
        </div>

        <FormField label="Tipo di Investimento" required>
          <Select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
          >
            <option value="azione">📈 Azione</option>
            <option value="etf">🌐 ETF</option>
            <option value="crypto">₿ Cryptocurrency</option>
            <option value="obbligazione">📋 Obbligazione</option>
            <option value="commodity">🥇 Commodity</option>
          </Select>
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField label="Quantità" required error={errors.quantity}>
            <Input
              type="number"
              step="0.001"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Prezzo di Acquisto (€)" required error={errors.purchasePrice}>
            <Input
              type="number"
              step="0.01"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Data di Acquisto" required>
            <Input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
            />
          </FormField>
        </div>

        {formData.quantity && formData.purchasePrice && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Valore totale investimento:
              </span>
              <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                €{(parseFloat(formData.quantity || 0) * parseFloat(formData.purchasePrice || 0)).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </motion.div>
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
            🎯 Aggiungi Investimento
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddPacModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    assetName: '',
    assetSymbol: '',
    amount: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    initialCapital: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.assetName.trim()) newErrors.assetName = 'Il nome dell\'asset è obbligatorio';
    if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Inserisci un importo valido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
        initialCapital: parseFloat(formData.initialCapital) || 0
      });
    }
  };

  const frequencyOptions = {
    weekly: { label: '🗓️ Settimanale', desc: 'Ogni settimana' },
    monthly: { label: '📅 Mensile', desc: 'Ogni mese' },
    quarterly: { label: '📊 Trimestrale', desc: 'Ogni 3 mesi' }
  };

  const calculateYearlyAmount = () => {
    const amount = parseFloat(formData.amount) || 0;
    const multipliers = { weekly: 52, monthly: 12, quarterly: 4 };
    return amount * multipliers[formData.frequency];
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="🔄 Nuovo Piano PAC" size="lg">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg mb-6">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
          💡 Cos'è un Piano di Accumulo Capitale (PAC)?
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Un PAC ti permette di investire importi fissi a intervalli regolari, 
          riducendo il rischio e mediando i prezzi nel tempo (Dollar Cost Averaging).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Nome Asset" required error={errors.assetName}>
            <Input
              value={formData.assetName}
              onChange={(e) => setFormData({...formData, assetName: e.target.value})}
              placeholder="es. MSCI World ETF"
            />
          </FormField>

          <FormField label="Simbolo/ISIN">
            <Input
              value={formData.assetSymbol}
              onChange={(e) => setFormData({...formData, assetSymbol: e.target.value.toUpperCase()})}
              placeholder="es. IE00B4L5Y983"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Importo per Versamento (€)" required error={errors.amount}>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              placeholder="100.00"
            />
          </FormField>

          <FormField label="Frequenza" required>
            <Select
              value={formData.frequency}
              onChange={(e) => setFormData({...formData, frequency: e.target.value})}
            >
              {Object.entries(frequencyOptions).map(([key, option]) => (
                <option key={key} value={key}>{option.label}</option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Data di Inizio" required>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
            />
          </FormField>

          <FormField label="Capitale Iniziale (€)" description="Importo versato all'inizio (opzionale)">
            <Input
              type="number"
              step="0.01"
              value={formData.initialCapital}
              onChange={(e) => setFormData({...formData, initialCapital: e.target.value})}
              placeholder="0.00"
            />
          </FormField>
        </div>

        {formData.amount && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Importo annuale stimato:
                </span>
                <span className="text-lg font-bold text-green-900 dark:text-green-100">
                  €{calculateYearlyAmount().toLocaleString('it-IT')}
                </span>
              </div>
              {formData.initialCapital && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Capitale iniziale:
                  </span>
                  <span className="text-md font-semibold text-green-900 dark:text-green-100">
                    €{parseFloat(formData.initialCapital).toLocaleString('it-IT')}
                  </span>
                </div>
              )}
              <div className="text-xs text-green-600 dark:text-green-400">
                {frequencyOptions[formData.frequency].desc} × €{formData.amount} = €{calculateYearlyAmount().toLocaleString('it-IT')}/anno
                {formData.initialCapital && ` + €${formData.initialCapital} iniziale`}
              </div>
            </div>
          </motion.div>
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
            🚀 Crea Piano PAC
          </button>
        </div>
      </form>
    </Modal>
  );
}
