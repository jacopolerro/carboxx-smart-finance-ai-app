import React, { useState, useEffect } from 'react';
import { 
  HomeIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { useThemeContext } from '../context/ThemeContext';
import { usePrivacyContext } from '../context/PrivacyContext';
import { useUserContext } from '../context/UserContext';
import { db } from '../lib/database';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Investimenti', href: '/investments', icon: ChartBarIcon },
  { name: 'Spese', href: '/expenses', icon: CreditCardIcon },
  { name: 'Entrate', href: '/income', icon: CurrencyDollarIcon },
  { name: 'Chat AI', href: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'Impostazioni', href: '/settings', icon: Cog6ToothIcon },
];

export default function Layout({ children, currentPage = '/', onNavigate }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [portfolioSummary, setPortfolioSummary] = useState({ netWorth: 0 });
  const [dataMode, setDataMode] = useState('private');
  const { theme, toggleTheme } = useThemeContext();
  const { hideAmounts, toggleAmounts, formatAmount } = usePrivacyContext();
  const { userProfile } = useUserContext();

  useEffect(() => {
    const loadPortfolioSummary = () => {
      const summary = db.getPortfolioSummary();
      setPortfolioSummary(summary);
    };

    loadPortfolioSummary();
    setDataMode(localStorage.getItem('finance_app_data_mode') || 'private');
    // Refresh portfolio summary every 5 seconds
    const interval = setInterval(loadPortfolioSummary, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <Motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 shadow-lg lg:hidden"
            >
              <SidebarContent 
                currentPage={currentPage} 
                onNavigate={onNavigate} 
                closeSidebar={() => setSidebarOpen(false)}
                formatAmount={formatAmount}
                portfolioSummary={portfolioSummary}
              />
            </Motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent 
          currentPage={currentPage} 
          onNavigate={onNavigate}
          formatAmount={formatAmount}
          portfolioSummary={portfolioSummary}
        />
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {navigation.find(nav => nav.href === currentPage)?.name || 'Dashboard'}
              </h1>
              <span className={`ml-3 rounded-full px-2.5 py-1 text-xs font-medium ${
                dataMode === 'safe-demo'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              }`}>
                {dataMode === 'safe-demo' ? 'Demo sicura' : 'Privato locale'}
              </span>
            </div>
            
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button
                type="button"
                onClick={toggleAmounts}
                className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                title={hideAmounts ? 'Mostra importi' : 'Nascondi importi'}
              >
                {hideAmounts ? (
                  <EyeSlashIcon className="h-6 w-6" />
                ) : (
                  <EyeIcon className="h-6 w-6" />
                )}
              </button>
              
              <button
                type="button"
                onClick={toggleTheme}
                className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <SunIcon className="h-6 w-6" />
                ) : (
                  <MoonIcon className="h-6 w-6" />
                )}
              </button>

              <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <BellIcon className="h-6 w-6" />
              </button>

              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 lg:block" />

              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{userProfile.name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="hidden lg:block text-sm font-medium text-gray-900 dark:text-gray-100">
                  {userProfile.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ currentPage, onNavigate, closeSidebar, formatAmount, portfolioSummary }) {
  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <CurrencyDollarIcon className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            FinanceApp
          </h1>
        </div>
        {closeSidebar && (
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
            onClick={closeSidebar}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}
      </div>
      
      <nav className="flex flex-1 flex-col">
        <ul className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = currentPage === item.href;
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => {
                        onNavigate?.(item.href);
                        closeSidebar?.();
                      }}
                      className={`
                        group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full text-left transition-all duration-200
                        ${isActive
                          ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <item.icon
                        className={`h-6 w-6 shrink-0 ${
                          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}
                      />
                      {item.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
          
          <li className="mt-auto">
            <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">€</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Patrimonio Totale
                  </p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatAmount(portfolioSummary.netWorth)}
                  </p>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}
