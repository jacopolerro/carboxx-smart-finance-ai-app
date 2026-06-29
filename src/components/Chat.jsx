import React, { useState, useRef, useEffect } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  SparklesIcon, 
  PaperAirplaneIcon,
  UserCircleIcon,
  CpuChipIcon,
  TrashIcon,
  LightBulbIcon,
  PlusIcon,
  Bars3Icon,
  EllipsisVerticalIcon,
  ArchiveBoxIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { financialChatbot } from '../lib/chatbot';
import { realAIChatbot } from '../lib/aiChatbot';
import { useUserContext } from '../context/UserContext';

const formatCurrency = (value) =>
  new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value || 0);

const parseItalianNumber = (value) => {
  if (!value) return null;
  const normalized = value
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
};

const extractFirstNumber = (text, patterns) => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const parsed = parseItalianNumber(match?.[1]);
    if (parsed !== null) return parsed;
  }

  return null;
};

const buildInvestmentSimulationChart = (query) => {
  const lowerQuery = query.toLowerCase();
  const isSimulationRequest = /(grafico|simul|proiez|scenario|piano di accumulo|pac)/i.test(lowerQuery);

  if (!isSimulationRequest) return null;

  const monthlyAmount = extractFirstNumber(query, [
    /(?:€\s*)?(\d+(?:[.,]\d+)?)\s*(?:€|euro)?\s*(?:al mese|\/mese|mensili|mensile|ogni mese)/i,
    /(?:pac|piano di accumulo|investire|investimento)\D{0,25}(?:€\s*)?(\d+(?:[.,]\d+)?)/i
  ]);
  const years = extractFirstNumber(query, [
    /(\d{1,2})\s*(?:anni|anno)/i,
    /per\s+(\d{1,2})/i
  ]);

  if (!monthlyAmount || !years || years < 1) return null;

  const annualReturn = extractFirstNumber(query, [
    /(\d+(?:[.,]\d+)?)\s*%/i,
    /rendimento\D{0,20}(\d+(?:[.,]\d+)?)/i
  ]) ?? 5;
  const initialCapital = extractFirstNumber(query, [
    /capitale iniziale\D{0,15}(?:€\s*)?(\d+(?:[.,]\d+)?)/i,
    /partendo da\D{0,15}(?:€\s*)?(\d+(?:[.,]\d+)?)/i
  ]) ?? 0;

  const cappedYears = Math.min(Math.round(years), 60);
  const cappedAnnualReturn = Math.min(Math.max(annualReturn, -20), 25);
  const monthlyReturn = Math.pow(1 + cappedAnnualReturn / 100, 1 / 12) - 1;
  const data = [{
    year: 0,
    versato: Math.round(initialCapital),
    valoreStimato: Math.round(initialCapital),
    crescita: 0
  }];
  let balance = initialCapital;
  let invested = initialCapital;

  for (let month = 1; month <= cappedYears * 12; month += 1) {
    balance = balance * (1 + monthlyReturn) + monthlyAmount;
    invested += monthlyAmount;

    if (month % 12 === 0) {
      data.push({
        year: month / 12,
        versato: Math.round(invested),
        valoreStimato: Math.round(balance),
        crescita: Math.round(balance - invested)
      });
    }
  }

  return {
    type: 'investment-simulation',
    title: `Simulazione PAC: ${formatCurrency(monthlyAmount)} al mese per ${cappedYears} anni`,
    subtitle: `Rendimento annuo ipotizzato ${cappedAnnualReturn.toLocaleString('it-IT')}%. Dati indicativi, non consulenza finanziaria.`,
    parameters: {
      monthlyAmount,
      years: cappedYears,
      annualReturn: cappedAnnualReturn,
      initialCapital
    },
    data
  };
};

const buildInvestmentSimulationSummary = (chart) => {
  const finalPoint = chart.data[chart.data.length - 1];
  const totalInvested = finalPoint.versato;
  const estimatedValue = finalPoint.valoreStimato;
  const estimatedGrowth = finalPoint.crescita;

  return `Ho generato una simulazione PAC con dati calcolati dall'app, non inventati dall'AI.

Parametri usati:
- Versamento mensile: ${formatCurrency(chart.parameters.monthlyAmount)}
- Durata: ${chart.parameters.years} anni
- Rendimento annuo ipotizzato: ${chart.parameters.annualReturn.toLocaleString('it-IT')}%
- Capitale iniziale: ${formatCurrency(chart.parameters.initialCapital)}

Risultato stimato:
- Capitale versato: ${formatCurrency(totalInvested)}
- Valore finale stimato: ${formatCurrency(estimatedValue)}
- Crescita stimata: ${formatCurrency(estimatedGrowth)}

Assunzione: rendimento composto mensile e versamenti costanti. Questa e' una simulazione indicativa, non consulenza finanziaria.`;
};

export default function Chat() {
  const { userProfile } = useUserContext();
  const [messages, setMessages] = useState([]);

  // Load messages from localStorage on component mount
  useEffect(() => {
    const loadMessages = () => {
      try {
        const savedMessages = localStorage.getItem('chat_messages');
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          // Convert timestamp strings back to Date objects
          const messagesWithDates = parsedMessages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(messagesWithDates);
        } else {
          // Set default welcome message if no saved messages
          setMessages([{
            id: '1',
            type: 'assistant',
            content: `👋 **Ciao ${userProfile.name}! Assistente Finanziario AI - Versione Avanzata**

Sono connesso a una **vera AI (Groq)** con accesso completo ai tuoi dati finanziari!

✨ **Caratteristiche uniche:**
• 🧠 **Vera AI**: Powered by Llama-3-8B
• 📊 **Dati in tempo reale**: Accesso diretto al tuo portafoglio
• 💬 **Conversazione naturale**: Memoria delle chat precedenti
• 🔍 **Analisi avanzate**: Insights personalizzati e consigli professionali
• 🎯 **RAG System**: Recupero intelligente delle informazioni

**Prova a chiedere:**
• "Come va il mio portafoglio questo mese?"
• "Dammi consigli sui miei investimenti"
• "Analizza le mie spese per categoria"
• "Devo aumentare il mio piano PAC?"

Cosa vorresti sapere delle tue finanze? 💰`,
            timestamp: new Date(),
            insights: [],
            relevantData: []
          }]);
        }
      } catch (error) {
        console.error('Error loading chat messages:', error);
        // Fallback to default message
        setMessages([{
          id: '1',
          type: 'assistant',
          content: `👋 **Ciao ${userProfile.name}! Assistente Finanziario AI - Versione Avanzata**`,
          timestamp: new Date(),
          insights: [],
          relevantData: []
        }]);
      }
    };
    
    loadMessages();
  }, [userProfile.name]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat_messages', JSON.stringify(messages));
    }
  }, [messages]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useRealAI, setUseRealAI] = useState(true);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    "Come sta andando il mio portafoglio?",
    "Consigli per i miei investimenti",
    "Analizza le mie spese",
    "Aiutami con un piano PAC"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      let aiResponse;
      const generatedChart = buildInvestmentSimulationChart(inputMessage);
      
      if (generatedChart) {
        aiResponse = buildInvestmentSimulationSummary(generatedChart);
      } else if (useRealAI) {
        // Use real AI (Groq)
        aiResponse = await realAIChatbot.sendMessage(inputMessage, userProfile.name);
      } else {
        // Use simulated AI
        aiResponse = await financialChatbot.generateResponse(
          inputMessage,
          financialChatbot.retrieveRelevantData(inputMessage),
          financialChatbot.generateInsights(financialChatbot.retrieveRelevantData(inputMessage))
        );
      }
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse,
        chart: generatedChart,
        timestamp: new Date(),
        insights: [],
        relevantData: []
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `❌ Errore nell'AI: ${error.message || 'Problema di connessione'}. 
        
🔧 **Soluzioni:**
• Verifica la connessione internet
• L'API key Groq potrebbe essere scaduta
• Prova a ricaricare la pagina
        
Sto passando al sistema simulato...`,
        timestamp: new Date(),
        insights: [],
        relevantData: []
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Fallback to simulated AI
      setUseRealAI(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    const welcomeMessage = {
      id: '1',
      type: 'assistant',
      content: `👋 Ciao ${userProfile.name}! Sono il tuo assistente finanziario AI con **memoria persistente**!

🧠 **Funzionalità avanzate:**
• 📊 Analisi in tempo reale dei tuoi dati
• 🤖 Sistema RAG per recupero informazioni intelligente
• 💾 Memoria conversazionale che ricorda tutto
• 🔍 Insights personalizzati e proattivi
• 📈 Monitoraggio continuo del portafoglio

Posso rispondere a domande complesse e ricordare le nostre conversazioni precedenti. Cosa vuoi sapere delle tue finanze?`,
      timestamp: new Date(),
      insights: [],
      relevantData: []
    };
    
    setMessages([welcomeMessage]);
    // Also clear from localStorage
    localStorage.setItem('chat_messages', JSON.stringify([welcomeMessage]));
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <div className="relative">
              <ChatBubbleLeftRightIcon className="h-8 w-8" />
              <SparklesIcon className="absolute -top-1 -right-1 h-4 w-4 text-blue-500" />
            </div>
            Assistente AI Finanziario
            {useRealAI && (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900/20 dark:text-green-400">
                AI Reale
              </span>
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {useRealAI ? 'Powered by Groq Llama-3-8B' : 'Modalità simulata'} - Analisi personalizzate per le tue finanze
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setUseRealAI(!useRealAI)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              useRealAI 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}
            title={useRealAI ? 'Passa ad AI simulata' : 'Passa ad AI reale'}
          >
            {useRealAI ? '🤖 AI Reale' : '🎭 Simulata'}
          </button>
          
          <button
            onClick={clearChat}
            className="btn-secondary flex items-center space-x-2"
            title="Pulisci chat"
          >
            <TrashIcon className="h-4 w-4" />
            <span>Pulisci</span>
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex flex-col h-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-t-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </AnimatePresence>
          
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-x border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <LightBulbIcon className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Domande suggerite:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-b-lg border border-t-0 border-gray-200 dark:border-gray-700">
          <div className="flex space-x-3">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Chiedi qualcosa sulle tue finanze..."
              className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="btn-primary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ message }) {
  const isUser = message.type === 'user';

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex space-x-3 max-w-3xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-500' 
            : 'bg-gradient-to-r from-purple-500 to-blue-600'
        }`}>
          {isUser ? (
            <UserCircleIcon className="h-5 w-5 text-white" />
          ) : (
            <CpuChipIcon className="h-5 w-5 text-white" />
          )}
        </div>
        
        {/* Message */}
        <div className={`rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
        }`}>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </div>

          {message.chart?.type === 'investment-simulation' && (
            <InvestmentSimulationChart chart={message.chart} />
          )}
          
          {/* Metadata for assistant messages */}
          {!isUser && message.relevantData?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                <SparklesIcon className="h-3 w-3" />
                <span>Dati analizzati: {message.relevantData.join(', ')}</span>
              </div>
            </div>
          )}
          
          <div className={`text-xs mt-2 opacity-70 ${
            isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {message.timestamp.toLocaleTimeString('it-IT', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    </Motion.div>
  );
}

function InvestmentSimulationChart({ chart }) {
  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">{chart.title}</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{chart.subtitle}</p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chart.data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              tickFormatter={(value) => `${value}a`}
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              width={42}
            />
            <Tooltip
              formatter={(value, name) => [formatCurrency(value), name]}
              labelFormatter={(value) => `Anno ${value}`}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="versato"
              name="Capitale versato"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="valoreStimato"
              name="Valore stimato"
              stroke="#16a34a"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
          <div className="text-gray-500 dark:text-gray-400">Mensile</div>
          <div className="font-semibold">{formatCurrency(chart.parameters.monthlyAmount)}</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
          <div className="text-gray-500 dark:text-gray-400">Durata</div>
          <div className="font-semibold">{chart.parameters.years} anni</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
          <div className="text-gray-500 dark:text-gray-400">Rendimento</div>
          <div className="font-semibold">{chart.parameters.annualReturn.toLocaleString('it-IT')}%</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
          <div className="text-gray-500 dark:text-gray-400">Capitale iniziale</div>
          <div className="font-semibold">{formatCurrency(chart.parameters.initialCapital)}</div>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="flex space-x-3 max-w-3xl">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center">
          <CpuChipIcon className="h-5 w-5 text-white" />
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </Motion.div>
  );
}
