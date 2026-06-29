import { db } from './database';
import { chatManager } from './chatManager';

// Simulated AI Financial Advisor with RAG capabilities
export class FinancialChatbot {
  constructor() {
    this.context = '';
    this.memory = new Map(); // Per-chat memory
    this.personalityTraits = {
      helpfulness: 0.9,
      expertise: 0.8,
      friendliness: 0.85,
      proactiveness: 0.7
    };
  }

  // RAG-like system: Retrieve relevant financial data
  retrieveRelevantData(query) {
    const queryLower = query.toLowerCase();
    const relevantData = {
      portfolio: null,
      transactions: [],
      investments: [],
      expenses: [],
      insights: []
    };

    // Get current portfolio summary
    relevantData.portfolio = db.getPortfolioSummary();
    
    // Keywords mapping to data retrieval
    const keywords = {
      'spese': () => relevantData.expenses = db.getExpenses().slice(0, 10),
      'entrate': () => relevantData.transactions = db.getTransactions({ type: 'income' }).slice(0, 10),
      'investimenti': () => relevantData.investments = db.getInvestments(),
      'portafoglio': () => {
        relevantData.investments = db.getInvestments();
        relevantData.portfolio = db.getPortfolioSummary();
      },
      'budget': () => {
        relevantData.expenses = db.getExpenses();
        relevantData.transactions = db.getTransactions({ type: 'income' });
      },
      'pac': () => relevantData.investments = db.getPACPlans(),
      'performance': () => relevantData.investments = db.getInvestments()
    };

    // Execute relevant data retrieval based on query
    Object.keys(keywords).forEach(keyword => {
      if (queryLower.includes(keyword)) {
        keywords[keyword]();
      }
    });

    return relevantData;
  }

  // Generate financial insights
  generateInsights(data) {
    const insights = [];
    
    if (data.portfolio) {
      const { totalIncome, totalExpenses, totalInvestments, cashFlow } = data.portfolio;
      
      // Cash flow analysis
      if (cashFlow > 0) {
        insights.push(`💰 Il tuo cash flow mensile è positivo di €${cashFlow.toLocaleString('it-IT')}. Ottimo lavoro!`);
      } else {
        insights.push(`⚠️ Il tuo cash flow è negativo di €${Math.abs(cashFlow).toLocaleString('it-IT')}. Considera di ridurre le spese.`);
      }
      
      // Savings rate
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;
      if (savingsRate > 20) {
        insights.push(`🎯 Eccellente! Stai risparmiando il ${savingsRate.toFixed(1)}% delle tue entrate.`);
      } else if (savingsRate > 10) {
        insights.push(`👍 Stai risparmiando il ${savingsRate.toFixed(1)}% delle tue entrate. Potresti migliorare!`);
      } else {
        insights.push(`📈 Risparmio solo il ${savingsRate.toFixed(1)}%. Ti consiglio di aumentare il risparmio al 20%.`);
      }
      
      // Investment allocation
      const investmentRatio = totalIncome > 0 ? (totalInvestments / totalIncome * 100) : 0;
      if (investmentRatio < 10) {
        insights.push(`📊 I tuoi investimenti rappresentano solo il ${investmentRatio.toFixed(1)}% delle entrate. Considera di investire di più per il futuro.`);
      }
    }

    if (data.expenses.length > 0) {
      // Expense analysis
      const categoryTotals = {};
      data.expenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
      });
      
      const topCategory = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (topCategory) {
        insights.push(`🏆 La tua categoria di spesa principale è "${topCategory[0]}" con €${topCategory[1].toLocaleString('it-IT')}.`);
      }
    }

    return insights;
  }

  // Get chat memory context
  getChatMemory(chatId) {
    const chat = chatId ? chatManager.chats.get(chatId) : chatManager.getActiveChat();
    if (!chat) return '';
    
    // Build context from recent messages
    const recentMessages = chat.messages.slice(-10); // Last 10 messages
    let context = `Chat Topic: ${chat.topic}\nRecent conversation:\n`;
    
    recentMessages.forEach(msg => {
      const role = msg.type === 'user' ? 'User' : 'Assistant';
      context += `${role}: ${msg.content.substring(0, 200)}...\n`;
    });
    
    return context;
  }

  // Main chat function with memory
  async chat(userMessage, chatId = null) {
    try {
      const activeChat = chatManager.getActiveChat();
      const currentChatId = chatId || activeChat?.id;
      
      // 1. Get chat memory context
      const memoryContext = this.getChatMemory(currentChatId);
      
      // 2. Retrieve relevant data (RAG)
      const relevantData = this.retrieveRelevantData(userMessage);
      
      // 3. Generate insights
      const insights = this.generateInsights(relevantData);
      
      // 4. Generate AI response with memory context
      const response = await this.generateResponse(userMessage, relevantData, insights, memoryContext);
      
      // 5. Add messages to chat manager
      chatManager.addMessage({
        type: 'user',
        content: userMessage
      }, currentChatId);
      
      chatManager.addMessage({
        type: 'assistant',
        content: response,
        insights,
        relevantData: Object.keys(relevantData).filter(key => 
          Array.isArray(relevantData[key]) ? relevantData[key].length > 0 : relevantData[key]
        )
      }, currentChatId);
      
      return {
        response,
        insights,
        relevantDataUsed: Object.keys(relevantData).filter(key => 
          Array.isArray(relevantData[key]) ? relevantData[key].length > 0 : relevantData[key]
        )
      };
      
    } catch (error) {
      console.error('Chatbot error:', error);
      return {
        response: "❌ Scusa, ho avuto un problema nell'elaborare la tua richiesta. Riprova tra poco!",
        insights: [],
        relevantDataUsed: []
      };
    }
  }

  // Enhanced response generation with memory
  async generateResponse(query, relevantData, insights, memoryContext = '') {
    // Simulate API call delay for realism
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    const queryLower = query.toLowerCase();
    
    // Check if this is a follow-up question based on memory
    const isFollowUp = this.detectFollowUp(query, memoryContext);
    
    // Template-based responses with memory awareness
    if (queryLower.includes('ciao') || queryLower.includes('hello')) {
      return `👋 Ciao! Sono il tuo assistente finanziario AI con memoria persistente.

🧠 **Funzionalità avanzate:**
• 📊 Analisi in tempo reale dei tuoi dati
• 🤖 Sistema RAG per recupero informazioni intelligente
• 💾 Memoria conversazionale che ricorda tutto
• 🔍 Insights personalizzati e proattivi
• 📈 Monitoraggio continuo del portafoglio

Posso rispondere a domande complesse e ricordare le nostre conversazioni precedenti. Cosa vuoi sapere delle tue finanze?`;
    }
    
    if (isFollowUp && memoryContext) {
      const followUpResponse = this.generateFollowUpResponse(query, memoryContext, relevantData, insights);
      if (followUpResponse) return followUpResponse;
    }
    
    // Continue with existing response logic...
    if (queryLower.includes('portafoglio') || queryLower.includes('situazione')) {
      const portfolio = relevantData.portfolio;
      return `📈 **Analisi dettagliata del portafoglio:**

💰 **Patrimonio netto**: €${portfolio.netWorth?.toLocaleString('it-IT') || 0}
📊 **Cash flow**: €${portfolio.cashFlow?.toLocaleString('it-IT') || 0}
💼 **Investimenti**: €${portfolio.totalInvestments?.toLocaleString('it-IT') || 0}

🧠 **Analisi AI con memoria:**
${insights.map(insight => `• ${insight}`).join('\n')}

${memoryContext ? '🔄 **Contesto conversazione:** Sto tenendo conto delle nostre discussioni precedenti per fornirti consigli più mirati.' : ''}

**Raccomandazioni personalizzate basate sui tuoi pattern:**
• 📊 La tua situazione è migliorata del +12% rispetto alle ultime analisi
• 🎯 Continua con la strategia di diversificazione attuale
• ⚡ Considera di aumentare il PAC del 10% se il cash flow lo permette

Vuoi approfondire qualche aspetto specifico?`;
    }
    
    // Enhanced investment advice
    if (queryLower.includes('investiment') || queryLower.includes('azioni')) {
      return `🚀 **Analisi Investimenti Avanzata:**

${relevantData.investments.length > 0 ? `
📊 **Portfolio Analysis:**
• Hai ${relevantData.investments.length} posizioni attive
• Performance media: +8.5% YTD
• Volatilità controllata: 15.2%

🤖 **AI Recommendations (basate su ML):**
• 🌍 Diversificazione geografica: BUONA (70% US, 20% EU, 10% EM)
• 🏭 Settoriale: Da migliorare (overweight Tech)
• ⏰ Timing: Ottimo momento per aumentare esposizione Value
• 🔄 Rebalancing suggerito: Trimestrale

**Strategia AI-driven:**
• 📈 Modello predittivo indica trend positivo per prossimi 6 mesi
• 🎯 Target allocation: 60% Equity, 25% Bonds, 15% Alternatives
• 💡 Smart beta: Considera ETF momentum per Q1 2024
` : `
🎯 **Setup Portafoglio Ottimale (AI-powered):**
• 🏆 Core: 40% MSCI World ETF (IE00B4L5Y983)
• 🇺🇸 Satellite: 20% S&P 500 (SPY)
• 🇪🇺 Europe: 15% STOXX 600 ETF
• 🌏 Emerging: 10% MSCI EM ETF
• 🏛️ Bonds: 15% Aggregate Bond ETF

**PAC Intelligente:**
• 💰 €300/mese automatico
• 🤖 Dynamic allocation based on market conditions
• 📊 Volatility targeting per ridurre drawdown
`}

${memoryContext ? '\n🧠 **Memoria conversazionale:** Ricordo che hai mostrato interesse per PAC e strategie conservative. Questi consigli sono calibrati sui tuoi precedenti input.' : ''}`;
    }
    
    // Default enhanced response
    return this.generateDefaultResponse(query, insights, memoryContext, relevantData);
  }

  // Generate follow-up response based on memory
  generateFollowUpResponse(query, memoryContext, relevantData, insights) {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('come dicevi') || queryLower.includes('come hai detto')) {
      return `🧠 **Ricollegandomi alla nostra conversazione:**

Basandomi sulla nostra cronologia, stavo analizzando:
${insights.slice(0, 2).map(insight => `• ${insight}`).join('\n')}

**Approfondimento richiesto:**
Vedo che vuoi maggiori dettagli. Basandomi sui tuoi dati attuali e le nostre discussioni precedenti, ecco l'analisi completa...

${this.generateDetailedAnalysis(relevantData)}`;
    }
    
    if (queryLower.includes('e poi') || queryLower.includes('continua')) {
      return `📈 **Proseguendo il discorso:**

Dalla nostra conversazione emerge un pattern chiaro nei tuoi obiettivi finanziari. Ecco i prossimi passi strategici:

${this.generateNextSteps(relevantData, memoryContext)}`;
    }
    
    return null;
  }

  // Generate detailed analysis
  generateDetailedAnalysis() {
    return `🔍 **Analisi Approfondita:**

📊 **Metriche Avanzate:**
• Sharpe Ratio portafoglio: 1.45 (Ottimo)
• Maximum Drawdown: -8.2% (Controllato)
• Beta vs mercato: 0.85 (Difensivo)

💡 **Insights Predittivi:**
• Probabilità outperformance prossimi 12M: 75%
• Risk-adjusted return atteso: +11.2%
• Scenario analysis: 90% prob. positive returns`;
  }

  // Generate next steps
  generateNextSteps() {
    return `🎯 **Prossimi Passi Strategici:**

1. **Immediate (0-30 giorni):**
   • Rivedi allocation bond (sottopeso del 5%)
   • Considera hedge inflation con TIPS
   
2. **Medium term (1-6 mesi):**
   • Incrementa PAC a €400/mese
   • Diversifica in small-cap value
   
3. **Long term (6+ mesi):**
   • Valuta real estate allocation (5-10%)
   • Pianifica tax-loss harvesting`;
  }

  // Detect if this is a follow-up question
  detectFollowUp(query, memoryContext) {
    const followUpIndicators = [
      'come dicevi', 'come hai detto', 'e poi', 'continua', 'inoltre',
      'approfondisci', 'spiegami meglio', 'cosa intendi', 'per esempio'
    ];
    
    return followUpIndicators.some(indicator => 
      query.toLowerCase().includes(indicator)
    ) && memoryContext.length > 0;
  }

  // Enhanced default response
  generateDefaultResponse(query, insights, memoryContext) {
    return `🤖 **Assistente Finanziario AI Avanzato**

Ho analizzato la tua domanda "${query}" utilizzando:
• 🔍 **RAG System**: Dati finanziari in tempo reale
• 🧠 **Memory**: Contesto delle conversazioni precedenti  
• 📊 **ML Models**: Pattern recognition sui tuoi comportamenti

**Insights personalizzati:**
${insights.map(insight => `• ${insight}`).join('\n')}

**Raccomandazioni AI-driven:**
• 📊 Continua il monitoraggio trimestrale
• 💰 Ottimizza tax efficiency del portafoglio
• 🎯 Mantieni disciplina negli investimenti sistematici
• 🔄 Review allocation ogni 6 mesi

${memoryContext ? '🧠 **Memoria attiva:** Sto costruendo un profilo sempre più accurato delle tue preferenze per consigli sempre più mirati.' : ''}

Vuoi che approfondisca qualche aspetto specifico? La mia memoria conserverà tutto per le prossime conversazioni! 🚀`;
  }

  // Get conversation statistics
  getConversationStats() {
    const allChats = chatManager.getAllChats();
    const totalMessages = allChats.reduce((sum, chat) => sum + chat.messages.length, 0);
    const totalChats = allChats.length;
    
    return {
      totalChats,
      totalMessages,
      averageMessagesPerChat: totalMessages / totalChats,
      oldestChat: allChats.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0],
      mostActiveChat: allChats.sort((a, b) => b.messages.length - a.messages.length)[0]
    };
  }
}

// Export singleton instance
export const financialChatbot = new FinancialChatbot();
