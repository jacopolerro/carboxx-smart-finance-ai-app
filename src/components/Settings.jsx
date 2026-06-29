import React, { useRef, useState } from 'react';
import { 
  Cog6ToothIcon, 
  MoonIcon, 
  SunIcon, 
  ComputerDesktopIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ShieldCheckIcon,
  BellIcon,
  UserIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { motion as Motion } from 'framer-motion';
import { useThemeContext } from '../context/ThemeContext';
import { useUserContext } from '../context/UserContext';
import { createSafeDemoData } from '../lib/demoData';

const FINANCE_TABLES = ['users', 'transactions', 'investments', 'pac_plans', 'expenses', 'budgets'];
const FINANCE_PREFIX = 'finance_app_';
const CHAT_KEYS = ['chat_messages', 'finance_chats', 'active_chat_id'];

const toExportShape = () => ({
  users: JSON.parse(localStorage.getItem(`${FINANCE_PREFIX}users`) || '[]'),
  transactions: JSON.parse(localStorage.getItem(`${FINANCE_PREFIX}transactions`) || '[]'),
  investments: JSON.parse(localStorage.getItem(`${FINANCE_PREFIX}investments`) || '[]'),
  pacPlans: JSON.parse(localStorage.getItem(`${FINANCE_PREFIX}pac_plans`) || '[]'),
  expenses: JSON.parse(localStorage.getItem(`${FINANCE_PREFIX}expenses`) || '[]'),
  budgets: JSON.parse(localStorage.getItem(`${FINANCE_PREFIX}budgets`) || '[]'),
  userProfile: JSON.parse(localStorage.getItem('user_profile') || 'null'),
  exportDate: new Date().toISOString(),
  app: 'smart-finance-demo',
  version: 1
});

const writeDataset = (data, mode = 'private') => {
  const tableData = {
    users: data.users || [],
    transactions: data.transactions || [],
    investments: data.investments || [],
    pac_plans: data.pacPlans || data.pac_plans || [],
    expenses: data.expenses || [],
    budgets: data.budgets || []
  };

  FINANCE_TABLES.forEach((table) => {
    localStorage.setItem(`${FINANCE_PREFIX}${table}`, JSON.stringify(tableData[table] || []));
  });

  CHAT_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.setItem(`${FINANCE_PREFIX}data_mode`, mode);

  if (data.userProfile) {
    localStorage.setItem('user_profile', JSON.stringify(data.userProfile));
  }
};

const clearFinanceDataset = () => {
  FINANCE_TABLES.forEach((table) => localStorage.setItem(`${FINANCE_PREFIX}${table}`, JSON.stringify([])));
  CHAT_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.setItem(`${FINANCE_PREFIX}data_mode`, 'private');
};

export default function Settings() {
  const { theme, toggleTheme } = useThemeContext();
  const { userProfile, updateProfile } = useUserContext();
  const importInputRef = useRef(null);
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    investmentUpdates: false,
    monthlyReports: true
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: userProfile.name,
    email: userProfile.email
  });

  const exportData = () => {
    const data = toExportShape();
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const hasKnownData = ['transactions', 'expenses', 'investments', 'pacPlans', 'pac_plans', 'budgets']
          .some((key) => Array.isArray(parsed[key]));

        if (!hasKnownData) {
          alert('Il file non sembra un backup valido di Smart Finance.');
          return;
        }

        if (confirm('Importare questo backup? I dati finanziari e la cronologia chat attuali verranno sostituiti.')) {
          writeDataset(parsed, 'private');
          window.location.reload();
        }
      } catch {
        alert('Non riesco a leggere il file. Verifica che sia un JSON valido.');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleSaveProfile = () => {
    updateProfile(profileForm);
    setIsEditingProfile(false);
  };

  const handleCancelEdit = () => {
    setProfileForm({
      name: userProfile.name,
      email: userProfile.email
    });
    setIsEditingProfile(false);
  };

  const clearAllData = () => {
    if (confirm('Questa azione svuota dati finanziari e chat, ma lascia tema e profilo. Hai esportato un backup se ti serve?')) {
      if (confirm('Confermi il reset del profilo finanziario privato?')) {
        clearFinanceDataset();
        window.location.reload();
      }
    }
  };

  const loadSafeDemo = () => {
    if (confirm('Caricare la demo sicura? Sostituira dati finanziari e chat attuali con dati realistici ma inventati.')) {
      writeDataset({
        ...createSafeDemoData(),
        userProfile: {
          ...userProfile,
          name: 'Demo Studente',
          email: '',
          preferences: userProfile.preferences
        }
      }, 'safe-demo');
      window.location.reload();
    }
  };

  const settingsSections = [
    {
      title: "👤 Profilo Utente",
      settings: [
        {
          name: "Nome Utente",
          description: "Come vuoi essere chiamato dall'AI",
          component: (
            <div className="flex items-center space-x-2">
              {isEditingProfile ? (
                <>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Il tuo nome"
                  />
                  <button 
                    onClick={handleSaveProfile}
                    className="btn-primary py-1 px-3 text-sm"
                  >
                    Salva
                  </button>
                  <button 
                    onClick={handleCancelEdit}
                    className="btn-secondary py-1 px-3 text-sm"
                  >
                    Annulla
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {userProfile.name}
                  </span>
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                    title="Modifica nome"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          )
        },
        {
          name: "Email (opzionale)",
          description: "Per notifiche e recupero dati",
          component: (
            <div className="flex items-center space-x-2">
              {isEditingProfile ? (
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="nome@email.com"
                />
              ) : (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {userProfile.email || 'Non impostata'}
                </span>
              )}
            </div>
          )
        }
      ]
    },
    {
      title: "🎨 Aspetto",
      settings: [
        {
          name: "Tema",
          description: "Scegli il tema dell'interfaccia",
          component: (
            <div className="flex space-x-2">
              <button 
                onClick={() => toggleTheme('light')}
                className={`p-2 rounded-lg ${theme === 'light' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <SunIcon className="h-5 w-5" />
              </button>
              <button 
                onClick={() => toggleTheme('dark')}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <MoonIcon className="h-5 w-5" />
              </button>
              <button 
                onClick={() => toggleTheme('system')}
                className={`p-2 rounded-lg ${theme === 'system' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <ComputerDesktopIcon className="h-5 w-5" />
              </button>
            </div>
          )
        }
      ]
    },
    {
      title: "🔔 Notifiche",
      settings: [
        {
          name: "Avvisi Budget",
          description: "Ricevi notifiche quando superi i limiti di budget",
          component: (
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={notifications.budgetAlerts}
                onChange={(e) => setNotifications({...notifications, budgetAlerts: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          )
        },
        {
          name: "Report Mensili",
          description: "Ricevi riassunti mensili delle tue finanze",
          component: (
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={notifications.monthlyReports}
                onChange={(e) => setNotifications({...notifications, monthlyReports: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          )
        }
      ]
    },
    {
      title: "💾 Dati & Backup",
      settings: [
        {
          name: "Demo Sicura",
          description: "Carica dati realistici ma inventati per mostrare l'app senza esporre informazioni private",
          component: (
            <button
              onClick={loadSafeDemo}
              className="btn-secondary flex items-center space-x-2"
            >
              <ShieldCheckIcon className="h-4 w-4" />
              <span>Carica Demo</span>
            </button>
          )
        },
        {
          name: "Esporta Dati",
          description: "Scarica un backup JSON dei dati attuali prima di fare prove o reset",
          component: (
            <button 
              onClick={exportData}
              className="btn-primary flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Esporta</span>
            </button>
          )
        },
        {
          name: "Importa Backup",
          description: "Ripristina un backup JSON esportato da questa app",
          component: (
            <>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json"
                onChange={importData}
                className="hidden"
              />
              <button
                onClick={() => importInputRef.current?.click()}
                className="btn-secondary flex items-center space-x-2"
              >
                <ArrowUpTrayIcon className="h-4 w-4" />
                <span>Importa</span>
              </button>
            </>
          )
        },
        {
          name: "Profilo Privato Pulito",
          description: "Svuota dati finanziari e chat per partire con i tuoi dati reali da zero",
          component: (
            <button 
              onClick={clearAllData}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
            >
              <TrashIcon className="h-4 w-4" />
              <span>Svuota</span>
            </button>
          )
        }
      ]
    },
    {
      title: "🔒 Privacy & Sicurezza",
      settings: [
        {
          name: "Archiviazione Locale",
          description: "I dati sono salvati solo nel tuo browser",
          component: (
            <div className="flex items-center text-green-600">
              <ShieldCheckIcon className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Sicuro</span>
            </div>
          )
        }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Impostazioni
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configura l'app secondo le tue preferenze
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-8">
        {settingsSections.map((section, index) => (
          <Motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {section.title}
            </h2>
            <div className="space-y-6">
              {section.settings.map((setting) => (
                <div key={setting.name} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {setting.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {setting.description}
                    </p>
                  </div>
                  <div className="ml-4">
                    {setting.component}
                  </div>
                </div>
              ))}
            </div>
          </Motion.div>
        ))}
      </div>

      {/* App Info */}
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card text-center"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Finance Dashboard
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Versione 1.0.0 • Sviluppato da Antonio Carbone
        </p>
        <div className="mt-4 flex justify-center space-x-4 text-xs text-gray-400">
          <span>React 19</span>
          <span>•</span>
          <span>Tailwind CSS</span>
          <span>•</span>
          <span>AI-Powered</span>
        </div>
      </Motion.div>
    </div>
  );
}
