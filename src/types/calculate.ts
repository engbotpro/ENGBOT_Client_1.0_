// src/types.ts

// Parâmetros enviados para a API de juros compostos
export interface CompoundParams {
  initial: number;            // capital inicial
  rate: number;               // taxa (%)
  ratePeriod: 'ANUAL' | 'MENSAL';
  term: number;               // valor numérico de período
  termUnit: 'ANOS' | 'MESES';
  monthly: number;            // investimento mensal
}

// Resposta da API de juros compostos
export interface CompoundResult {
  total: number;              // montante final
}

export interface CompoundSaved {
  /** PK do registro (caso precise para futuras atualizações) */
  id: string;

  /** FK do usuário dono do cálculo */
  userId: string;

  /* —— parâmetros originais —— */
  initial: number | null;                  // capital inicial
  rate: number | null;                     // taxa (%)
  ratePeriod: 'ANUAL' | 'MENSAL' | null;   // periodicidade da taxa
  term: number | null;                     // duração numérica
  termUnit: 'ANOS' | 'MESES' | null;       // unidade da duração
  monthly: number | null;                  // aporte mensal (0 no seu caso)

  /* —— campos derivados —— */
  totalMonths: number | null;              // term em meses
  interestPerMonth: number | null;         // taxa já convertida p/ mês (fração)
  montantePrincipal: number | null;        // montante sem imposto (= total)
  tax: number | null;                      // alíquota informada (%)
  total: number | null;                    // montante bruto (mesmo de cima)
  taxValue: number | null;                 // imposto em R$
  netValue: number | null;                 // montante líquido

  /* —— metadados —— */
  createdAt: string;                // ISO date
  updatedAt: string;                // ISO date
}


// src/types/calculate.ts
/** Registro salvo no banco + campos calculados */
export interface FinancialIndependenceType {
  id: string;
  userId: string;

  initial: number;
  rate: number;
  ratePeriod: 'ANUAL' | 'MENSAL';
  term: number;
  termUnit: 'ANOS' | 'MESES';

  /** aporte mensal já normalizado */
  monthly: number;

  totalMonths: number;
  interestPerMonth: number;

  montantePrincipal: number;   // FV do capital inicial
  tax: number;                 // alíquota %
  total: number;               // montante bruto
  taxValue: number;            // imposto em R$
  netValue: number;            // montante líquido

  /** saque mensal sustentável (juros) */
  safeWithdraw: number;

  createdAt: string;
  updatedAt: string;
}

export interface SpendingEntry {
  id: number;
  description: string;
  value: number;
  expenseType?: string; // Tipo de gasto selecionado pelo usuário
  period?: 'DIARIO' | 'SEMANAL' | 'MENSAL' | 'ANUAL'; // Período do planejamento
  year?: number;
  month?: number;
  week?: number;
  dayOfWeek?: number;
}
export interface SpendingPlanType {
  receitas: SpendingEntry[];
  despesas: SpendingEntry[];
  receitasReais?: SpendingEntry[];  // Dados realizados
  despesasReais?: SpendingEntry[];  // Dados realizados
}

