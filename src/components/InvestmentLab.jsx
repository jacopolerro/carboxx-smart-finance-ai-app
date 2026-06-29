import React, { useMemo, useState } from 'react';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  BeakerIcon,
  ChartBarSquareIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { buildInvestmentAnalysis, INVESTMENT_PROFILES } from '../lib/investmentEngine';
import { realAIChatbot } from '../lib/aiChatbot';
import { usePrivacyContext } from '../context/PrivacyContext';

const percentFormat = new Intl.NumberFormat('it-IT', {
  style: 'percent',
  maximumFractionDigits: 1
});

const numberFormat = new Intl.NumberFormat('it-IT', {
  maximumFractionDigits: 1
});

const DEFAULT_FORM = {
  initialCapital: 1000,
  monthlyContribution: 200,
  years: 20,
  expectedReturn: INVESTMENT_PROFILES.balanced.expectedReturn,
  volatility: INVESTMENT_PROFILES.balanced.volatility,
  inflation: INVESTMENT_PROFILES.balanced.inflation,
  annualFees: INVESTMENT_PROFILES.balanced.annualFees,
  taxRate: 26,
  goalAmount: 50000,
  iterations: 1200,
  seed: 42
};

const buildAiPayload = (analysis) => ({
  assumptions: analysis.assumptions,
  deterministic: analysis.deterministic.summary,
  monteCarlo: analysis.monteCarlo.summary,
  stressTests: analysis.stressTests.map((test) => ({
    name: test.name,
    description: test.description,
    finalAfterTaxValue: test.finalAfterTaxValue,
    finalRealValue: test.finalRealValue,
    maxDrawdown: test.maxDrawdown
  })),
  metadata: analysis.metadata
});

export default function InvestmentLab() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [profile, setProfile] = useState('balanced');
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const { formatAmount } = usePrivacyContext();

  const analysis = useMemo(() => buildInvestmentAnalysis(form), [form]);
  const { deterministic, monteCarlo, stressTests, assumptions } = analysis;

  const updateField = (field, value) => {
    setProfile('custom');
    setForm((current) => ({ ...current, [field]: value }));
  };

  const applyProfile = (profileId) => {
    const selectedProfile = INVESTMENT_PROFILES[profileId];
    setProfile(profileId);
    setForm((current) => ({
      ...current,
      expectedReturn: selectedProfile.expectedReturn,
      volatility: selectedProfile.volatility,
      inflation: selectedProfile.inflation,
      annualFees: selectedProfile.annualFees
    }));
    setAiInsight('');
  };

  const resetDefaults = () => {
    setProfile('balanced');
    setForm(DEFAULT_FORM);
    setAiInsight('');
  };

  const runAiAnalysis = async () => {
    setAiLoading(true);
    setAiInsight('');

    try {
      const result = await realAIChatbot.analyzeInvestmentSimulation(buildAiPayload(analysis), 'Utente');
      setAiInsight(result);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                <BeakerIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Laboratorio investimenti
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Calcolo locale, scenari probabilistici e commento AI separato dai numeri.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(INVESTMENT_PROFILES).map(([id, item]) => (
              <button
                key={id}
                type="button"
                onClick={() => applyProfile(id)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  profile === id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                }`}
                title={item.description}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={resetDefaults}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Ripristina"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <NumberControl label="Capitale iniziale" suffix="EUR" value={form.initialCapital} onChange={(value) => updateField('initialCapital', value)} min={0} step={100} />
          <NumberControl label="Versamento mensile" suffix="EUR" value={form.monthlyContribution} onChange={(value) => updateField('monthlyContribution', value)} min={0} step={25} />
          <NumberControl label="Durata" suffix="anni" value={form.years} onChange={(value) => updateField('years', value)} min={1} max={60} step={1} />
          <NumberControl label="Obiettivo" suffix="EUR" value={form.goalAmount} onChange={(value) => updateField('goalAmount', value)} min={0} step={1000} />
          <NumberControl label="Rendimento annuo" suffix="%" value={form.expectedReturn} onChange={(value) => updateField('expectedReturn', value)} min={-30} max={30} step={0.1} />
          <NumberControl label="Volatilita" suffix="%" value={form.volatility} onChange={(value) => updateField('volatility', value)} min={0} max={80} step={0.5} />
          <NumberControl label="Inflazione" suffix="%" value={form.inflation} onChange={(value) => updateField('inflation', value)} min={-5} max={20} step={0.1} />
          <NumberControl label="Costi annui" suffix="%" value={form.annualFees} onChange={(value) => updateField('annualFees', value)} min={0} max={5} step={0.05} />
          <NumberControl label="Tasse sui guadagni" suffix="%" value={form.taxRate} onChange={(value) => updateField('taxRate', value)} min={0} max={60} step={1} />
          <NumberControl label="Simulazioni Monte Carlo" suffix="run" value={form.iterations} onChange={(value) => updateField('iterations', value)} min={250} max={5000} step={250} />
          <NumberControl label="Seed modello" suffix="id" value={form.seed} onChange={(value) => updateField('seed', value)} min={1} step={1} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ChartBarSquareIcon}
          label="Scenario deterministico"
          value={formatAmount(deterministic.summary.finalAfterTaxValue)}
          helper={`Reale stimato: ${formatAmount(deterministic.summary.finalRealValue)}`}
          tone="blue"
        />
        <MetricCard
          icon={BeakerIcon}
          label="Mediana Monte Carlo"
          value={formatAmount(monteCarlo.summary.median)}
          helper={`Range 10-90: ${formatAmount(monteCarlo.summary.p10)} - ${formatAmount(monteCarlo.summary.p90)}`}
          tone="green"
        />
        <MetricCard
          icon={ShieldCheckIcon}
          label="Probabilita obiettivo"
          value={assumptions.goalAmount > 0 ? percentFormat.format(monteCarlo.summary.probabilityOfGoal) : 'n/d'}
          helper={`Obiettivo: ${formatAmount(assumptions.goalAmount)}`}
          tone="purple"
        />
        <MetricCard
          icon={ExclamationTriangleIcon}
          label="Drawdown severo"
          value={percentFormat.format(monteCarlo.summary.severeMaxDrawdown)}
          helper={`Perdita finale stimata: ${percentFormat.format(monteCarlo.summary.probabilityOfLoss)}`}
          tone="red"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartPanel
          title="Proiezione deterministica"
          description="Formula composta con costi, tasse sui guadagni e inflazione."
        >
          <DeterministicChart data={deterministic.data} formatAmount={formatAmount} />
        </ChartPanel>

        <ChartPanel
          title="Monte Carlo"
          description={`${assumptions.iterations.toLocaleString('it-IT')} simulazioni con volatilita ${numberFormat.format(assumptions.volatility)}%.`}
        >
          <MonteCarloChart data={monteCarlo.data} formatAmount={formatAmount} />
        </ChartPanel>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <AdjustmentsHorizontalIcon className="h-6 w-6 text-gray-500 dark:text-gray-300" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Stress test</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Percorsi estremi predefiniti per vedere dove il piano soffre.
              </p>
            </div>
          </div>
          <StressTestGrid stressTests={stressTests} formatAmount={formatAmount} />
        </div>

        <div className="card">
          <div className="mb-4 flex items-center gap-3">
            <CpuChipIcon className="h-6 w-6 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Lettura AI</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Commenta risultati gia calcolati.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={runAiAnalysis}
            disabled={aiLoading}
            className="btn-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SparklesIcon className="h-5 w-5" />
            <span>{aiLoading ? 'Analisi in corso...' : 'Analizza scenario con AI'}</span>
          </button>

          <div className="mt-4 min-h-48 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
            {aiInsight ? (
              <FormattedAiInsight content={aiInsight} />
            ) : (
              <div className="space-y-3">
                <p>
                  L'AI riceve solo assunzioni e risultati calcolati dal motore. Non decide i numeri.
                </p>
                <p>
                  Usa questa lettura per capire fragilita, non per comprare strumenti finanziari.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

const MONEY_CONTEXT_PATTERN =
  /\b(capitale|valore|patrimonio|obiettiv\w*|mediana|scenario prudente|scenario favorevole|nominale|reale|tasse|investit\w*|versat\w*|contribut\w*|accumul\w*|portafoglio|import\w*|liquidit[aà]|finale)\b/i;
const CURRENCY_WORD_PATTERN =
  /(^|[^\w€])(\d{1,3}(?:[.\s]\d{3})+(?:,\d+)?|\d+(?:,\d+)?)\s*(?:euro|eur)\b/gi;
const BARE_NUMBER_PATTERN = /(^|[^\w€])(\d{1,3}(?:[.\s]\d{3})+(?:,\d+)?|\d+(?:,\d+)?)/g;
const NON_MONEY_SUFFIX_PATTERN =
  /^\s*(?:%|(?:anni?|mesi?|giorni?|scenari?|simulazioni?|iterazioni?|run|volatilit[aà]|rendimento|inflazione|drawdown|percentuale|probabilit[aà])\b)/i;
const PROBABILITY_METRIC_PATTERN = /^\s*probabilit[aà]\b/i;

const formatAiCurrencyAmounts = (text) =>
  text
    .split('\n')
    .map((line) => {
      const withCurrencyWords = line.replace(
        CURRENCY_WORD_PATTERN,
        (match, prefix, amount, offset, source) => {
          const amountStart = offset + prefix.length;
          const left = source.slice(0, amountStart);

          if (/€\s*$/.test(left)) return match;
          return `${prefix}€${amount}`;
        }
      );

      if (!MONEY_CONTEXT_PATTERN.test(withCurrencyWords) || PROBABILITY_METRIC_PATTERN.test(withCurrencyWords)) {
        return withCurrencyWords;
      }

      return withCurrencyWords.replace(BARE_NUMBER_PATTERN, (match, prefix, amount, offset, source) => {
        const amountStart = offset + prefix.length;
        const left = source.slice(0, amountStart);
        const right = source.slice(amountStart + amount.length);

        if (/€\s*$/.test(left) || NON_MONEY_SUFFIX_PATTERN.test(right)) {
          return match;
        }

        return `${prefix}€${amount}`;
      });
    })
    .join('\n');

const cleanAiText = (text) =>
  formatAiCurrencyAmounts(text
    .replace(/\*\*/g, '')
    .replace(/^\s*#+\s*/gm, '')
    .replace(/\s+$/gm, '')
    .trim());

const parseAiInsight = (content) => {
  const lines = cleanAiText(content).split('\n');
  const sections = [];
  let current = null;

  const pushCurrent = () => {
    if (current && (current.title || current.items.length || current.paragraphs.length)) {
      sections.push(current);
    }
  };

  const ensureSection = () => {
    if (!current) {
      current = { title: 'Sintesi', paragraphs: [], items: [] };
    }
    return current;
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    const numberedHeading = line.match(/^\d+\.\s+(.+)$/);
    const isShortHeading = /^[A-ZÀ-Ý][^.!?]{2,60}:?$/.test(line) && !line.includes('€');
    const isListItem = /^[-*•]\s+/.test(line);
    const isMetricLine = /^[^:]{3,55}:\s+.+(?:euro|%|\d)/i.test(line);

    if (numberedHeading && numberedHeading[1].length <= 70) {
      pushCurrent();
      current = { title: numberedHeading[1].replace(/:$/, ''), paragraphs: [], items: [] };
      return;
    }

    if (isShortHeading && !isListItem) {
      pushCurrent();
      current = { title: line.replace(/:$/, ''), paragraphs: [], items: [] };
      return;
    }

    if (isListItem) {
      ensureSection().items.push(line.replace(/^[-*•]\s+/, ''));
      return;
    }

    if (isMetricLine) {
      ensureSection().items.push(line);
      return;
    }

    ensureSection().paragraphs.push(line);
  });

  pushCurrent();
  return sections.length ? sections : [{ title: 'Sintesi', paragraphs: [cleanAiText(content)], items: [] }];
};

function FormattedAiInsight({ content }) {
  const sections = parseAiInsight(content);

  return (
    <div className="space-y-3">
      {sections.map((section, index) => (
        <section
          key={`${section.title}-${index}`}
          className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          {section.title && (
            <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              {section.title}
            </h4>
          )}

          {section.paragraphs.length > 0 && (
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex}>{paragraph}</p>
              ))}
            </div>
          )}

          {section.items.length > 0 && (
            <ul className="mt-3 space-y-2">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

function NumberControl({ label, suffix, value, onChange, min, max, step }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <div className="flex overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-gray-700">
        <input
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          min={min}
          max={max}
          step={step}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-gray-900 outline-none dark:text-gray-100"
        />
        <span className="flex min-w-14 items-center justify-center bg-gray-50 px-2 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          {suffix}
        </span>
      </div>
    </label>
  );
}

function MetricCard({ icon: Icon, label, value, helper, tone }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
  };

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-3 ${tones[tone]}`}>
          {React.createElement(Icon, { className: 'h-6 w-6' })}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helper}</p>
        </div>
      </div>
    </div>
  );
}

function ChartPanel({ title, description, children }) {
  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <div className="h-80 w-full">{children}</div>
    </div>
  );
}

function DeterministicChart({ data, formatAmount }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="year" tickFormatter={(value) => `${value}a`} tick={{ fontSize: 12 }} stroke="#6b7280" />
        <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fontSize: 12 }} stroke="#6b7280" width={42} />
        <Tooltip formatter={(value) => formatAmount(value)} labelFormatter={(value) => `Anno ${value}`} />
        <Legend />
        <Line type="monotone" dataKey="invested" name="Versato" stroke="#2563eb" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="afterTaxValue" name="Dopo tasse" stroke="#16a34a" strokeWidth={3} dot={false} />
        <Line type="monotone" dataKey="realAfterTaxValue" name="Reale" stroke="#7c3aed" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function MonteCarloChart({ data, formatAmount }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="year" tickFormatter={(value) => `${value}a`} tick={{ fontSize: 12 }} stroke="#6b7280" />
        <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fontSize: 12 }} stroke="#6b7280" width={42} />
        <Tooltip formatter={(value) => formatAmount(value)} labelFormatter={(value) => `Anno ${value}`} />
        <Legend />
        <Area type="monotone" dataKey="p90" name="Scenario favorevole" stroke="#22c55e" fill="#bbf7d0" fillOpacity={0.45} />
        <Area type="monotone" dataKey="p10" name="Scenario prudente" stroke="#ef4444" fill="#fee2e2" fillOpacity={0.65} />
        <Line type="monotone" dataKey="median" name="Mediana" stroke="#2563eb" strokeWidth={3} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function StressTestGrid({ stressTests, formatAmount }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {stressTests.map((test) => (
        <div key={test.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">{test.name}</h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{test.description}</p>
            </div>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {percentFormat.format(test.maxDrawdown)}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Finale dopo tasse</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{formatAmount(test.finalAfterTaxValue)}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Valore reale</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{formatAmount(test.finalRealValue)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
