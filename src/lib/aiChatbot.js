import { Groq } from 'groq-sdk';
import { db } from './database';

class RealAIChatbot {
  constructor() {
    const apiKey = import.meta.env?.VITE_GROQ_API_KEY || null;
    
    if (apiKey) {
      this.groq = new Groq({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });
    } else {
      this.groq = null;
    }
    
    this.model = "llama-3.1-8b-instant";
    this.conversationHistory = [];
  }

  // Get financial data for context
  getFinancialContext() {
    try {
      const portfolio = db.getPortfolioSummary();
      const investments = db.getInvestments();
      const pacPlans = db.getPACPlans();
      const expenses = db.getExpenses().slice(0, 10); // Last 10 expenses
      const transactions = db.getTransactions().slice(0, 10); // Last 10 transactions

      return {
        portfolio: {
          totalIncome: portfolio.totalIncome || 0,
          totalExpenses: portfolio.totalExpenses || 0,
          totalInvestments: portfolio.totalInvestments || 0,
          netWorth: portfolio.netWorth || 0,
          cashFlow: portfolio.cashFlow || 0
        },
        investments: investments.map(inv => ({
          name: inv.name,
          symbol: inv.symbol,
          type: inv.type,
          quantity: inv.quantity,
          purchasePrice: inv.purchasePrice,
          currentValue: inv.currentValue || inv.quantity * inv.purchasePrice
        })),
        pacPlans: pacPlans.map(pac => ({
          assetName: pac.assetName,
          amount: pac.amount,
          frequency: pac.frequency,
          isActive: pac.isActive,
          totalInvested: pac.totalInvested || 0
        })),
        recentExpenses: expenses.map(exp => ({
          category: exp.category,
          amount: exp.amount,
          description: exp.description,
          date: exp.date
        })),
        recentTransactions: transactions.map(trans => ({
          type: trans.type,
          amount: trans.amount,
          category: trans.category,
          description: trans.description,
          date: trans.date
        }))
      };
    } catch (error) {
      console.error('Error getting financial context:', error);
      return {
        portfolio: { totalIncome: 0, totalExpenses: 0, totalInvestments: 0, netWorth: 0, cashFlow: 0 },
        investments: [],
        pacPlans: [],
        recentExpenses: [],
        recentTransactions: []
      };
    }
  }

  // Create system prompt with financial context
  createSystemPrompt(userName = 'Utente') {
    const financialData = this.getFinancialContext();
    
    return `Sei un assistente finanziario AI esperto che aiuta con la gestione delle finanze personali. 
    
L'utente si chiama ${userName}. Usa sempre il suo nome quando parli con lui in modo naturale e professionale. 

DATI FINANZIARI ATTUALI DELL'UTENTE:
Portfolio Summary:
- Patrimonio netto: €${financialData.portfolio.netWorth.toLocaleString('it-IT')}
- Entrate totali: €${financialData.portfolio.totalIncome.toLocaleString('it-IT')}
- Spese totali: €${financialData.portfolio.totalExpenses.toLocaleString('it-IT')}
- Investimenti totali: €${financialData.portfolio.totalInvestments.toLocaleString('it-IT')}
- Cash flow: €${financialData.portfolio.cashFlow.toLocaleString('it-IT')}

Investimenti attuali:
${financialData.investments.map(inv => 
  `- ${inv.name} (${inv.symbol}): ${inv.quantity} unità a €${inv.purchasePrice} cad. (Valore: €${inv.currentValue.toLocaleString('it-IT')})`
).join('\\n')}

Piani PAC attivi:
${financialData.pacPlans.filter(pac => pac.isActive).map(pac => 
  `- ${pac.assetName}: €${pac.amount}/${pac.frequency} (Totale investito: €${pac.totalInvested.toLocaleString('it-IT')})`
).join('\\n')}

Ultime spese (${financialData.recentExpenses.length}):
${financialData.recentExpenses.map(exp => 
  `- ${exp.category}: €${exp.amount} (${exp.description})`
).join('\\n')}

ISTRUZIONI:
- Rispondi sempre in italiano
- Sii specifico e usa i dati reali dell'utente
- Fornisci consigli pratici e personalizzati
- Se l'utente chiede analisi, usa i dati sopra riportati
- Se l'utente chiede grafici o simulazioni, non fingere di disegnare grafici con tabelle markdown: spiega i risultati in modo sintetico. L'interfaccia generera' il grafico vero quando possibile.
- Sii professionale ma amichevole
- Non inventare dati che non hai
- Concentrati su consigli di investimento, budgeting, e pianificazione finanziaria`;
  }

  // Send message to AI
  async sendMessage(userMessage, userName = 'Utente') {
    try {
      // Add user message to conversation history
      this.conversationHistory.push({
        role: "user",
        content: userMessage
      });

      // Keep only last 10 messages to avoid token limit
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      const systemPrompt = this.createSystemPrompt(userName);

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          ...this.conversationHistory
        ],
        model: this.model,
        temperature: 0.7,
        max_tokens: 1024
      });

      const aiResponse = completion.choices[0]?.message?.content || "Scusa, non riesco a rispondere al momento.";

      // Add AI response to conversation history
      this.conversationHistory.push({
        role: "assistant",
        content: aiResponse
      });

      return aiResponse;

    } catch (error) {
      console.error('AI Chat Error:', error);
      
      // Fallback to simulated responses if API fails
      return this.getSimulatedResponse(userMessage);
    }
  }

  // Fallback simulated response
  getSimulatedResponse(query) {
    const financialData = this.getFinancialContext();
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('portafoglio') || queryLower.includes('situazione')) {
      return `📈 **Analisi del tuo portafoglio (Simulata - API non disponibile):**

💰 **Patrimonio netto**: €${financialData.portfolio.netWorth.toLocaleString('it-IT')}
📊 **Cash flow**: €${financialData.portfolio.cashFlow.toLocaleString('it-IT')}
💼 **Investimenti**: €${financialData.portfolio.totalInvestments.toLocaleString('it-IT')}

**Raccomandazioni:**
• Il tuo patrimonio netto di €${financialData.portfolio.netWorth.toLocaleString('it-IT')} è ${financialData.portfolio.netWorth > 10000 ? 'buono' : 'in crescita'}
• Cash flow ${financialData.portfolio.cashFlow >= 0 ? 'positivo - ottimo lavoro!' : 'negativo - considera di ridurre le spese'}
• Hai ${financialData.investments.length} investimenti attivi

*Nota: Questa è una risposta simulata. Per l'AI reale, configura l'API key di Groq.*`;
    }
    
    return `🤖 **Risposta Simulata** (API AI non configurata)

Ho ricevuto la tua domanda: "${query}"

**I tuoi dati attuali:**
- Patrimonio: €${financialData.portfolio.netWorth.toLocaleString('it-IT')}
- Investimenti: €${financialData.portfolio.totalInvestments.toLocaleString('it-IT')}
- Cash Flow: €${financialData.portfolio.cashFlow.toLocaleString('it-IT')}

Per abilitare l'AI reale:
1. Ottieni una API key gratuita da console.groq.com
2. Aggiungi la chiave nel file .env
3. Ricarica l'app

*Questa è una demo della funzionalità AI.*`;
  }

  async analyzeInvestmentSimulation(payload, userName = 'Utente') {
    if (!this.groq) {
      return `Analisi locale: scenario calcolato dall'app. La mediana Monte Carlo e' ${payload?.monteCarlo?.median ?? 'non disponibile'}, mentre lo scenario prudente e' ${payload?.monteCarlo?.p10 ?? 'non disponibile'}. Configura Groq per ottenere una lettura discorsiva piu completa.`;
    }

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `Sei un analista finanziario prudente. Rispondi in italiano.
Non inventare numeri e non modificare i dati ricevuti.
Non dare ordini di acquisto o vendita.
Chiama p10 "scenario prudente" e p90 "scenario favorevole"; non chiamarli minimo o massimo.
Drawdown significa calo massimo dal picco, non disinvestimento.
Non usare markdown, asterischi, tabelle o elenchi lunghi.
Per ogni importo monetario usa sempre il simbolo € prima della cifra, ad esempio €1.876. Non scrivere importi senza valuta.
Usa sezioni con titoli semplici, una riga vuota tra sezioni, massimo 2 paragrafi brevi per sezione.
Spiega in modo chiaro:
- cosa indicano scenario deterministico, Monte Carlo e stress test
- quali sono le ipotesi piu fragili
- quali domande dovrebbe farsi ${userName}
- cosa renderebbe il piano piu robusto
Chiudi sempre ricordando che e' una simulazione, non consulenza finanziaria.`
          },
          {
            role: "user",
            content: JSON.stringify(payload, null, 2)
          }
        ],
        model: this.model,
        temperature: 0.35,
        max_tokens: 900
      });

      return completion.choices[0]?.message?.content || "Non sono riuscito a generare l'analisi AI.";
    } catch (error) {
      console.error('Investment AI analysis error:', error);
      return "Non sono riuscito a contattare Groq per l'analisi AI. I calcoli locali restano disponibili e verificabili.";
    }
  }

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
  }

  // Check if API is configured
  isConfigured() {
    return !!(import.meta.env?.VITE_GROQ_API_KEY);
  }
}

export const realAIChatbot = new RealAIChatbot();
