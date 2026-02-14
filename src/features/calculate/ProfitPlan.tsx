import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Stack,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Slider,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  CurrencyBitcoin as CryptoIcon,
  AccountBalance as AccountBalanceIcon,
  Timeline as TimelineIcon,
  Calculate as CalculateIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Home as HomeIcon,
  ShowChart as StockIcon,
  AccountBalanceWallet as FixedIncomeIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import NumericFormatCustom, { PercentageFormatCustom } from '../../components/NumericFormatCustom';
import { useGetSpendingPlanQuery } from './CalculateAPI';

/** Tipo de rendimento para renda fixa */
export type ReturnType = 'FIXED' | 'INDEXED' | 'FIXED_PLUS_INDEXER';

/** Indexadores para renda fixa */
export type IndexerType = 'CDI' | 'SELIC' | 'IPCA' | 'POUPANCA' | 'TR' | 'IGPM';

/** Modelo de investimento cadastrado em Configurações (aparece no select) */
interface InvestmentTemplate {
  id: number;
  name: string;
  type: 'CRYPTO' | 'STOCK' | 'FIXED_INCOME' | 'REAL_ESTATE';
  expectedReturn?: number;
  returnPeriod?: 'ANNUAL' | 'MONTHLY';
  returnType?: ReturnType; // Para renda fixa: fixo, indexado ou fixo+indexado
  fixedRate?: number; // Taxa fixa % (quando returnType FIXED ou parte fixa de FIXED_PLUS_INDEXER)
  indexer?: IndexerType;
  indexerPercent?: number; // Ex: 110 para 110% CDI
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  taxRate: number;
  startDate?: string; // Data da aplicação
  maturityDate?: string; // Data do vencimento (renda fixa)
}

interface Investment {
  id: number;
  name: string;
  type: 'CRYPTO' | 'STOCK' | 'FIXED_INCOME' | 'REAL_ESTATE';
  initialValue: number;
  currentValue: number;
  monthlyContribution: number;
  expectedReturn: number;
  returnPeriod?: 'ANNUAL' | 'MONTHLY'; // Período da taxa: anual ou mensal
  returnType?: ReturnType; // Para renda fixa: FIXED, INDEXED ou FIXED_PLUS_INDEXER
  fixedRate?: number;
  indexer?: IndexerType;
  indexerPercent?: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  taxRate: number; // Taxa de imposto por investimento
  startDate?: string; // Data da aplicação
  maturityDate?: string; // Data de vencimento (formato ISO: YYYY-MM-DD) - apenas para renda fixa
}

interface ProfitSimulation {
  month: number;
  totalValue: number;
  totalContribution: number;
  totalProfit: number;
  totalTax: number;
  netProfit: number;
  cryptoValue: number;
  stockValue: number;
  fixedIncomeValue: number;
  realEstateValue: number;
}

interface SavedSimulation {
  id: string;
  name: string;
  investments: Investment[];
  simulation: ProfitSimulation[];
  simulationMonths: number;
  includeCrypto: boolean;
  cryptoVolatility: number;
  taxRate: number;
  createdAt: string;
  statistics: any;
}

const STORAGE_KEY = 'profitPlan_simulations';
const INVESTMENT_TYPES_KEY = 'profitPlan_investmentTypes';
const ESTIMATED_CDI_ANNUAL = 12; // CDI estimado anual % para simulação
/** Taxas anuais estimadas por indexador (simulação) */
const INDEXER_ESTIMATED_ANNUAL: Record<IndexerType, number> = {
  CDI: 12, SELIC: 11.25, IPCA: 6, POUPANCA: 8.5, TR: 2.5, IGPM: 7,
};

const ProfitPlan: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const userId = user?.id ?? '';
  
  // Buscar dados de receitas e despesas realizadas
  const { data: spendingData } = useGetSpendingPlanQuery(userId, { skip: !userId });
  
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [simulation, setSimulation] = useState<ProfitSimulation[]>([]);
  const [simulationMonths, setSimulationMonths] = useState(12);
  const [includeCrypto, setIncludeCrypto] = useState(true);
  const [cryptoVolatility, setCryptoVolatility] = useState(50);
  const [nextId, setNextId] = useState(1);
  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>([]);
  const [simulationName, setSimulationName] = useState<string>('');
  
  // Calcular valor não investido (receitas realizadas - despesas realizadas)
  const valorNaoInvestido = useMemo(() => {
    if (!spendingData) return 0;
    
    const receitasReais = spendingData.receitasReais || [];
    const despesasReais = spendingData.despesasReais || [];
    
    const totalReceitas = receitasReais.reduce((sum, entry) => sum + (entry.value || 0), 0);
    const totalDespesas = despesasReais.reduce((sum, entry) => sum + (entry.value || 0), 0);
    
    return totalReceitas - totalDespesas;
  }, [spendingData]);
  
  // Estados para alertas personalizados
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | string | null>(null);
  const [deleteType, setDeleteType] = useState<'investment' | 'simulation' | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Estados para o modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

  // Aba: Investimentos ou Configurações
  const [activeSection, setActiveSection] = useState<'investimentos' | 'configuracoes'>('investimentos');
  
  // Catálogo de tipos de investimento (Configurações)
  const [investmentTemplates, setInvestmentTemplates] = useState<InvestmentTemplate[]>([]);
  const [nextTemplateId, setNextTemplateId] = useState(1);
  
  // Formulário para novo template em Configurações
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<InvestmentTemplate['type']>('FIXED_INCOME');
  const [newTemplateReturnType, setNewTemplateReturnType] = useState<ReturnType>('FIXED');
  const [newTemplateFixedRate, setNewTemplateFixedRate] = useState(0);
  const [newTemplateIndexer, setNewTemplateIndexer] = useState<IndexerType>('CDI');
  const [newTemplateIndexerPercent, setNewTemplateIndexerPercent] = useState(100);
  const [newTemplateStartDate, setNewTemplateStartDate] = useState('');
  const [newTemplateMaturityDate, setNewTemplateMaturityDate] = useState('');
  const [newTemplateRiskLevel, setNewTemplateRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [newTemplateTaxRate, setNewTemplateTaxRate] = useState(15);
  const [newTemplateExpectedReturn, setNewTemplateExpectedReturn] = useState(10); // Para CRYPTO, STOCK, REAL_ESTATE

  // Carregar simulações salvas ao montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedSimulations(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar simulações salvas:', error);
    }

    // Carregar investimentos salvos ao montar
    try {
      const savedInvestments = localStorage.getItem('profitPlan_investments');
      if (savedInvestments) {
        const parsed = JSON.parse(savedInvestments);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Garantir que investimentos antigos tenham returnPeriod definido
          const updatedInvestments = parsed.map((i: Investment) => ({
            ...i,
            returnPeriod: i.returnPeriod || 'ANNUAL', // Padrão: anual se não especificado
            taxRate: i.taxRate || 15, // Garantir taxRate
          }));
          setInvestments(updatedInvestments);
          setNextId(Math.max(...parsed.map((i: Investment) => i.id), 0) + 1);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar investimentos salvos:', error);
    }

    // Carregar catálogo de tipos de investimento
    try {
      const savedTemplates = localStorage.getItem(INVESTMENT_TYPES_KEY);
      if (savedTemplates) {
        const parsed = JSON.parse(savedTemplates);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInvestmentTemplates(parsed);
          setNextTemplateId(Math.max(...parsed.map((t: InvestmentTemplate) => t.id), 0) + 1);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de investimento:', error);
    }
  }, []);

  // Salvar catálogo de tipos de investimento
  const saveInvestmentTemplates = (templates: InvestmentTemplate[]) => {
    try {
      localStorage.setItem(INVESTMENT_TYPES_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Erro ao salvar tipos de investimento:', error);
    }
  };

  // Adicionar tipo de investimento em Configurações
  const addInvestmentTemplate = () => {
    if (!newTemplateName.trim()) {
      showSnackbar('Informe o nome do investimento', 'info');
      return;
    }
    let expectedRet = newTemplateExpectedReturn;
    if (newTemplateType === 'FIXED_INCOME') {
      if (newTemplateReturnType === 'FIXED') {
        expectedRet = newTemplateFixedRate;
      } else if (newTemplateReturnType === 'INDEXED') {
        const rate = INDEXER_ESTIMATED_ANNUAL[newTemplateIndexer] ?? ESTIMATED_CDI_ANNUAL;
        expectedRet = (newTemplateIndexerPercent / 100) * rate;
      } else {
        const rate = INDEXER_ESTIMATED_ANNUAL[newTemplateIndexer] ?? ESTIMATED_CDI_ANNUAL;
        expectedRet = newTemplateFixedRate + (newTemplateIndexerPercent / 100) * rate;
      }
    }
    const hasIndexer = newTemplateType === 'FIXED_INCOME' && (newTemplateReturnType === 'INDEXED' || newTemplateReturnType === 'FIXED_PLUS_INDEXER');
    const template: InvestmentTemplate = {
      id: nextTemplateId,
      name: newTemplateName.trim(),
      type: newTemplateType,
      expectedReturn: expectedRet,
      returnPeriod: 'ANNUAL',
      returnType: newTemplateType === 'FIXED_INCOME' ? newTemplateReturnType : undefined,
      fixedRate: newTemplateType === 'FIXED_INCOME' ? newTemplateFixedRate : undefined,
      indexer: hasIndexer ? newTemplateIndexer : undefined,
      indexerPercent: hasIndexer ? newTemplateIndexerPercent : undefined,
      riskLevel: newTemplateRiskLevel,
      taxRate: newTemplateTaxRate,
      startDate: newTemplateType === 'FIXED_INCOME' ? newTemplateStartDate || undefined : undefined,
      maturityDate: newTemplateType === 'FIXED_INCOME' ? newTemplateMaturityDate || undefined : undefined,
    };
    const updated = [...investmentTemplates, template];
    setInvestmentTemplates(updated);
    setNextTemplateId(nextTemplateId + 1);
    saveInvestmentTemplates(updated);
    setNewTemplateName('');
    setNewTemplateFixedRate(0);
    setNewTemplateIndexerPercent(100);
    setNewTemplateStartDate('');
    setNewTemplateMaturityDate('');
    showSnackbar(`"${template.name}" adicionado ao catálogo!`, 'success');
  };

  // Remover tipo de investimento
  const removeInvestmentTemplate = (id: number) => {
    const updated = investmentTemplates.filter(t => t.id !== id);
    setInvestmentTemplates(updated);
    saveInvestmentTemplates(updated);
    showSnackbar('Tipo removido do catálogo', 'success');
  };

  // Salvar simulações no localStorage
  const saveSimulations = (simulations: SavedSimulation[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(simulations));
    } catch (error) {
      console.error('Erro ao salvar simulações:', error);
    }
  };

  // Adicionar novo investimento (com opção de selecionar do catálogo)
  const addInvestment = (templateId?: number) => {
    let baseInvestment: Partial<Investment> = {
      initialValue: 0,
      currentValue: 0,
      monthlyContribution: 0,
      expectedReturn: 10,
      returnPeriod: 'ANNUAL',
      riskLevel: 'MEDIUM',
      taxRate: 15,
    };
    
    if (templateId !== undefined && templateId > 0) {
      const template = investmentTemplates.find(t => t.id === templateId);
      if (template) {
        baseInvestment = {
          ...baseInvestment,
          name: template.name,
          type: template.type,
          expectedReturn: template.expectedReturn ?? 10,
          returnPeriod: template.returnPeriod ?? 'ANNUAL',
          returnType: template.returnType,
          fixedRate: template.fixedRate,
          indexer: template.indexer,
          indexerPercent: template.indexerPercent,
          riskLevel: template.riskLevel,
          taxRate: template.taxRate ?? 15,
          startDate: template.startDate,
          maturityDate: template.maturityDate,
        };
      }
    } else {
      baseInvestment.name = '';
      baseInvestment.type = 'CRYPTO';
    }
    
    const newInvestment: Investment = {
      id: nextId,
      name: baseInvestment.name ?? '',
      type: baseInvestment.type ?? 'CRYPTO',
      initialValue: baseInvestment.initialValue ?? 0,
      currentValue: baseInvestment.currentValue ?? 0,
      monthlyContribution: baseInvestment.monthlyContribution ?? 0,
      expectedReturn: baseInvestment.expectedReturn ?? 10,
      returnPeriod: baseInvestment.returnPeriod ?? 'ANNUAL',
      returnType: baseInvestment.returnType,
      fixedRate: baseInvestment.fixedRate,
      indexer: baseInvestment.indexer,
      indexerPercent: baseInvestment.indexerPercent,
      riskLevel: baseInvestment.riskLevel ?? 'MEDIUM',
      taxRate: baseInvestment.taxRate ?? 15,
      startDate: baseInvestment.startDate,
      maturityDate: baseInvestment.maturityDate,
    };
    
    setInvestments([...investments, newInvestment]);
    setNextId(nextId + 1);
    setEditingInvestment(newInvestment);
    setEditModalOpen(true);
  };
  
  // Função para converter taxa anual para mensal
  const annualToMonthly = (annualRate: number): number => {
    // Taxa mensal = (1 + taxa anual)^(1/12) - 1
    return (Math.pow(1 + annualRate / 100, 1 / 12) - 1) * 100;
  };
  
  // Função para converter taxa mensal para anual
  const monthlyToAnnual = (monthlyRate: number): number => {
    // Taxa anual = (1 + taxa mensal)^12 - 1
    return (Math.pow(1 + monthlyRate / 100, 12) - 1) * 100;
  };
  
  // Função para atualizar o período da taxa e converter automaticamente
  const updateReturnPeriod = (id: number, newPeriod: 'ANNUAL' | 'MONTHLY') => {
    setInvestments(investments.map(inv => {
      if (inv.id === id) {
        let convertedReturn = inv.expectedReturn;
        
        // Se está mudando o período, converter a taxa
        if (inv.returnPeriod && inv.returnPeriod !== newPeriod) {
          if (newPeriod === 'MONTHLY') {
            // Convertendo de anual para mensal
            convertedReturn = annualToMonthly(inv.expectedReturn);
          } else {
            // Convertendo de mensal para anual
            convertedReturn = monthlyToAnnual(inv.expectedReturn);
          }
        }
        
        return {
          ...inv,
          returnPeriod: newPeriod,
          expectedReturn: convertedReturn
        };
      }
      return inv;
    }));
  };

  // Atualizar investimento
  const updateInvestment = (id: number, field: keyof Investment, value: any) => {
    setInvestments(investments.map(inv => 
      inv.id === id ? { ...inv, [field]: value } : inv
    ));
  };

  // Abrir diálogo de confirmação para excluir investimento
  const handleDeleteInvestmentClick = (id: number) => {
    setDeleteTargetId(id);
    setDeleteType('investment');
    setDeleteDialogOpen(true);
  };

  // Remover investimento
  const removeInvestment = (id: number) => {
    setInvestments(investments.filter(inv => inv.id !== id));
    // Salvar automaticamente após excluir
    try {
      const updated = investments.filter(inv => inv.id !== id);
      localStorage.setItem('profitPlan_investments', JSON.stringify(updated));
      showSnackbar('Investimento excluído com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar após exclusão:', error);
      showSnackbar('Erro ao salvar após exclusão.', 'error');
    }
  };

  // Função auxiliar para mostrar snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Fechar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Salvar investimentos no localStorage
  const saveInvestments = () => {
    try {
      if (investments.length === 0) {
        showSnackbar('Adicione investimentos antes de salvar.', 'info');
        return;
      }
      localStorage.setItem('profitPlan_investments', JSON.stringify(investments));
      showSnackbar('Investimentos salvos com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar investimentos:', error);
      showSnackbar('Erro ao salvar investimentos.', 'error');
    }
  };

  // Carregar investimentos do localStorage
  const loadInvestments = () => {
    try {
      const saved = localStorage.getItem('profitPlan_investments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Garantir que investimentos antigos tenham returnPeriod definido
          const updatedInvestments = parsed.map((i: Investment) => ({
            ...i,
            returnPeriod: i.returnPeriod || 'ANNUAL', // Padrão: anual se não especificado
            taxRate: i.taxRate || 15, // Garantir taxRate
          }));
          setInvestments(updatedInvestments);
          setNextId(Math.max(...parsed.map((i: Investment) => i.id), 0) + 1);
          showSnackbar('Investimentos carregados com sucesso!', 'success');
        } else {
          showSnackbar('Nenhum investimento salvo encontrado.', 'info');
        }
      } else {
        showSnackbar('Nenhum investimento salvo encontrado.', 'info');
      }
    } catch (error) {
      console.error('Erro ao carregar investimentos:', error);
      showSnackbar('Erro ao carregar investimentos.', 'error');
    }
  };

  // Calcular simulação
  const calculateSimulation = () => {
    if (investments.length === 0) return;

    const simulationData: ProfitSimulation[] = [];
    let totalValue = 0;
    let totalContribution = 0;

    // Inicializar valores
    investments.forEach(inv => {
      totalValue += inv.initialValue;
      totalContribution += inv.initialValue;
    });

    for (let month = 0; month <= simulationMonths; month++) {
      let cryptoValue = 0;
      let stockValue = 0;
      let fixedIncomeValue = 0;
      let realEstateValue = 0;
      let monthTotalValue = 0;
      let monthTotalContribution = totalContribution;
      let monthTotalProfit = 0;

      let monthTotalTax = 0;
      
      investments.forEach(inv => {
        // Verificar se é renda fixa e calcular meses até o vencimento
        let monthsToCalculate = month;
        let isExpired = false;
        
        if (inv.type === 'FIXED_INCOME' && inv.maturityDate) {
          const maturityDate = new Date(inv.maturityDate);
          const currentDate = new Date();
          
          // Calcular quantos meses desde hoje até o vencimento
          const monthsUntilMaturity = Math.floor(
            (maturityDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
          );
          
          // Se o mês atual da simulação passou do vencimento
          if (month > monthsUntilMaturity) {
            isExpired = true;
            monthsToCalculate = Math.max(0, monthsUntilMaturity);
          } else {
            monthsToCalculate = month;
          }
        }
        
        // Se o investimento já venceu antes do mês atual
        if (isExpired && monthsToCalculate <= 0) {
          // Investimento já venceu antes do início da simulação
          // Usar o valor do último mês válido (mês 0)
          if (month === 0) {
            monthTotalValue += inv.initialValue;
            monthTotalContribution += inv.initialValue;
            if (inv.type === 'FIXED_INCOME') {
              fixedIncomeValue += inv.initialValue;
            }
          }
          return; // Não processar mais este investimento
        }
        
        // Calcular retorno mensal baseado no período da taxa e tipo de rendimento
        let monthlyReturn = 0;
        if (inv.type === 'FIXED_INCOME' && inv.returnType === 'INDEXED') {
          // Indexado: (indexerPercent% do indexador estimado)
          const idx = inv.indexer ?? 'CDI';
          const rateAnual = INDEXER_ESTIMATED_ANNUAL[idx] ?? ESTIMATED_CDI_ANNUAL;
          monthlyReturn = ((inv.indexerPercent ?? 100) / 100) * (rateAnual / 12 / 100);
        } else if (inv.type === 'FIXED_INCOME' && inv.returnType === 'FIXED_PLUS_INDEXER') {
          // Taxa fixa + indexador
          const fixedPart = (inv.fixedRate ?? 0) / 12 / 100;
          const idx = inv.indexer ?? 'CDI';
          const rateAnual = INDEXER_ESTIMATED_ANNUAL[idx] ?? ESTIMATED_CDI_ANNUAL;
          const indexerPart = ((inv.indexerPercent ?? 100) / 100) * (rateAnual / 12 / 100);
          monthlyReturn = fixedPart + indexerPart;
        } else if (inv.returnPeriod === 'MONTHLY') {
          monthlyReturn = inv.expectedReturn / 100;
        } else {
          // Padrão: taxa anual (ou se não especificado, assume anual)
          monthlyReturn = inv.expectedReturn / 12 / 100;
        }
        
        // Aplicar volatilidade para crypto
        if (inv.type === 'CRYPTO' && includeCrypto) {
          const volatility = cryptoVolatility / 100;
          monthlyReturn += (Math.random() - 0.5) * volatility * 2;
        }

        // Calcular valor do investimento (usar monthsToCalculate para renda fixa vencida)
        let investmentValue = 0;
        let investmentContribution = 0;
        
        if (monthsToCalculate > 0) {
          investmentValue = inv.initialValue * Math.pow(1 + monthlyReturn, monthsToCalculate) +
                           inv.monthlyContribution * ((Math.pow(1 + monthlyReturn, monthsToCalculate) - 1) / (monthlyReturn || 1));
          
          // Calcular contribuição acumulada deste investimento (apenas até o vencimento)
          investmentContribution = inv.initialValue + (inv.monthlyContribution * monthsToCalculate);
        } else {
          // Se monthsToCalculate é 0 ou negativo, usar apenas o valor inicial
          investmentValue = inv.initialValue;
          investmentContribution = inv.initialValue;
        }
        
        // Calcular lucro deste investimento
        const investmentProfit = investmentValue - investmentContribution;
        
        // Calcular imposto deste investimento sobre o lucro acumulado (apenas se houver lucro)
        const investmentTax = investmentProfit > 0 ? (investmentProfit * (inv.taxRate || 0) / 100) : 0;
        
        monthTotalValue += investmentValue;
        monthTotalContribution += inv.monthlyContribution;
        monthTotalProfit += investmentProfit;
        monthTotalTax += investmentTax;

        // Categorizar por tipo
        switch (inv.type) {
          case 'CRYPTO':
            cryptoValue += investmentValue;
            break;
          case 'STOCK':
            stockValue += investmentValue;
            break;
          case 'FIXED_INCOME':
            fixedIncomeValue += investmentValue;
            break;
          case 'REAL_ESTATE':
            realEstateValue += investmentValue;
            break;
        }
      });

      // Calcular lucro líquido total
      const monthNetProfit = monthTotalProfit - monthTotalTax;

      simulationData.push({
        month,
        totalValue: monthTotalValue,
        totalContribution: monthTotalContribution,
        totalProfit: monthTotalProfit,
        totalTax: monthTotalTax,
        netProfit: monthNetProfit,
        cryptoValue,
        stockValue,
        fixedIncomeValue,
        realEstateValue,
      });
    }

    setSimulation(simulationData);
  };

  // Salvar simulação atual
  const handleSaveSimulation = () => {
    if (!simulationName.trim()) {
      showSnackbar('Por favor, informe um nome para a simulação.', 'info');
      return;
    }

    if (simulation.length === 0) {
      showSnackbar('Execute uma simulação antes de salvar.', 'info');
      return;
    }

    const statistics = getStatistics();
    const newSimulation: SavedSimulation = {
      id: Date.now().toString(),
      name: simulationName.trim(),
      investments: [...investments],
      simulation: [...simulation],
      simulationMonths,
      includeCrypto,
      cryptoVolatility,
      taxRate: 0, // Não usado mais, mas mantido para compatibilidade
      createdAt: new Date().toISOString(),
      statistics,
    };

    const updated = [newSimulation, ...savedSimulations];
    setSavedSimulations(updated);
    saveSimulations(updated);
    setSimulationName('');
    showSnackbar('Simulação salva com sucesso!', 'success');
  };

  // Carregar simulação salva
  const handleLoadSimulation = (savedSim: SavedSimulation) => {
    setInvestments(savedSim.investments.map(inv => ({
      ...inv,
      returnPeriod: inv.returnPeriod || 'ANNUAL', // Garantir returnPeriod
      taxRate: inv.taxRate || 15 // Garantir que investimentos antigos tenham taxRate
    })));
    setSimulation(savedSim.simulation);
    setSimulationMonths(savedSim.simulationMonths);
    setIncludeCrypto(savedSim.includeCrypto);
    setCryptoVolatility(savedSim.cryptoVolatility);
    setNextId(Math.max(...savedSim.investments.map(i => i.id), 0) + 1);
  };

  // Abrir diálogo de confirmação para excluir simulação
  const handleDeleteSimulationClick = (id: string) => {
    setDeleteTargetId(id);
    setDeleteType('simulation');
    setDeleteDialogOpen(true);
  };

  // Excluir simulação salva
  const handleDeleteSimulation = (id: string) => {
    const updated = savedSimulations.filter(s => s.id !== id);
    setSavedSimulations(updated);
    saveSimulations(updated);
    showSnackbar('Simulação excluída com sucesso!', 'success');
  };

  // Confirmar exclusão
  const handleConfirmDelete = () => {
    if (deleteTargetId === null || deleteType === null) return;

    if (deleteType === 'investment') {
      removeInvestment(deleteTargetId as number);
    } else if (deleteType === 'simulation') {
      handleDeleteSimulation(deleteTargetId as string);
    }

    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
    setDeleteType(null);
  };

  // Cancelar exclusão
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
    setDeleteType(null);
  };

  // Calcular estatísticas
  const getStatistics = () => {
    if (simulation.length === 0) return null;

    const finalSim = simulation[simulation.length - 1];
    const initialValue = simulation[0]?.totalValue || 0;
    const totalReturn = ((finalSim.totalValue - initialValue) / initialValue) * 100;
    const monthlyReturn = totalReturn / simulationMonths;

    // Calcular taxa média ponderada de imposto baseada nos valores reais da simulação
    // A taxa efetiva é simplesmente: (imposto total / lucro total) * 100
    let averageTaxRate = 0;
    if (finalSim.totalProfit > 0) {
      // Taxa efetiva = imposto total / lucro total * 100
      averageTaxRate = (finalSim.totalTax / finalSim.totalProfit) * 100;
    }

    return {
      totalValue: finalSim.totalValue,
      totalContribution: finalSim.totalContribution,
      totalProfit: finalSim.totalProfit,
      totalTax: finalSim.totalTax,
      netProfit: finalSim.netProfit,
      totalReturn,
      monthlyReturn,
      profitMargin: (finalSim.totalProfit / finalSim.totalContribution) * 100,
      netProfitMargin: (finalSim.netProfit / finalSim.totalContribution) * 100,
      taxPercentage: finalSim.totalProfit > 0 ? (finalSim.totalTax / finalSim.totalProfit) * 100 : 0,
      averageTaxRate,
    };
  };

  const statistics = getStatistics();

  // Função para obter estilos do card baseado no tipo
  const getInvestmentCardStyle = (type: Investment['type']) => {
    const styles = {
      CRYPTO: {
        gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
        icon: <CryptoIcon sx={{ fontSize: 40 }} />,
        bgColor: '#fff3e0',
        borderColor: '#ff9800',
      },
      STOCK: {
        gradient: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
        icon: <StockIcon sx={{ fontSize: 40 }} />,
        bgColor: '#e3f2fd',
        borderColor: '#2196f3',
      },
      FIXED_INCOME: {
        gradient: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
        icon: <FixedIncomeIcon sx={{ fontSize: 40 }} />,
        bgColor: '#e8f5e9',
        borderColor: '#4caf50',
      },
      REAL_ESTATE: {
        gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
        icon: <HomeIcon sx={{ fontSize: 40 }} />,
        bgColor: '#f3e5f5',
        borderColor: '#9c27b0',
      },
    };
    return styles[type];
  };

  // Função para obter nome do tipo
  const getInvestmentTypeName = (type: Investment['type']) => {
    const names = {
      CRYPTO: 'Criptomoedas',
      STOCK: 'Ações',
      FIXED_INCOME: 'Renda Fixa',
      REAL_ESTATE: 'Imóveis',
    };
    return names[type];
  };

  // Função para obter nome do risco
  const getRiskLevelName = (risk: Investment['riskLevel']) => {
    const names = {
      LOW: 'Baixo',
      MEDIUM: 'Médio',
      HIGH: 'Alto',
    };
    return names[risk];
  };

  // Abrir modal de edição
  const handleOpenEditModal = (investment: Investment) => {
    setEditingInvestment({ ...investment });
    setEditModalOpen(true);
  };

  // Fechar modal de edição
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingInvestment(null);
  };

  // Salvar alterações do modal
  const handleSaveEditModal = () => {
    if (!editingInvestment) return;
    
    setInvestments(investments.map(inv => 
      inv.id === editingInvestment.id ? editingInvestment : inv
    ));
    
    // Salvar automaticamente
    try {
      const updated = investments.map(inv => 
        inv.id === editingInvestment.id ? editingInvestment : inv
      );
      localStorage.setItem('profitPlan_investments', JSON.stringify(updated));
    } catch (error) {
      console.error('Erro ao salvar após edição:', error);
    }
    
    handleCloseEditModal();
    showSnackbar('Investimento atualizado com sucesso!', 'success');
  };

  // Atualizar campo no modal
  const updateEditingInvestment = (field: keyof Investment, value: any) => {
    if (!editingInvestment) return;
    setEditingInvestment({ ...editingInvestment, [field]: value });
  };

  // Atualizar período de retorno no modal
  const updateReturnPeriodInModal = (newPeriod: 'ANNUAL' | 'MONTHLY') => {
    if (!editingInvestment) return;
    
    let convertedReturn = editingInvestment.expectedReturn;
    
    if (editingInvestment.returnPeriod && editingInvestment.returnPeriod !== newPeriod) {
      if (newPeriod === 'MONTHLY') {
        convertedReturn = annualToMonthly(editingInvestment.expectedReturn);
      } else {
        convertedReturn = monthlyToAnnual(editingInvestment.expectedReturn);
      }
    }
    
    setEditingInvestment({
      ...editingInvestment,
      returnPeriod: newPeriod,
      expectedReturn: convertedReturn
    });
  };

  return (
    <Box sx={{ p: 3, minHeight: '100%', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mb: 0 }}>
          <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Planejamento de Lucro
        </Typography>
        <Tabs value={activeSection} onChange={(_, v) => setActiveSection(v)} sx={{ minHeight: 40 }}>
          <Tab label="Investimentos" value="investimentos" />
          <Tab label="Configurações" value="configuracoes" />
        </Tabs>
      </Box>

      {activeSection === 'configuracoes' ? (
        /* Configurações - Inserir investimento */
        <Card elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
            <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Inserir Investimento no Catálogo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Os investimentos cadastrados aqui aparecerão no select ao adicionar um investimento. Ex: Ouro, CDB 110% CDI, etc.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Nome do investimento"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Ex: Ouro, CDB 110% CDI..."
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={newTemplateType}
                  onChange={(e) => setNewTemplateType(e.target.value as InvestmentTemplate['type'])}
                  label="Tipo"
                >
                  <MenuItem value="CRYPTO">Criptomoedas</MenuItem>
                  <MenuItem value="STOCK">Ações</MenuItem>
                  <MenuItem value="FIXED_INCOME">Renda Fixa</MenuItem>
                  <MenuItem value="REAL_ESTATE">Imóveis</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {newTemplateType !== 'FIXED_INCOME' && (
              <Grid item xs={12} md={4}>
                <TextField
                  label="Retorno esperado (% ao ano)"
                  type="number"
                  value={newTemplateExpectedReturn}
                  onChange={(e) => setNewTemplateExpectedReturn(Number(e.target.value.replace(',', '.')) || 10)}
                  fullWidth
                  size="small"
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
              </Grid>
            )}
            {newTemplateType === 'FIXED_INCOME' && (
              <>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Rendimento</InputLabel>
                    <Select
                      value={newTemplateReturnType}
                      onChange={(e) => setNewTemplateReturnType(e.target.value as ReturnType)}
                      label="Rendimento"
                    >
                      <MenuItem value="FIXED">Taxa fixa</MenuItem>
                      <MenuItem value="INDEXED">Indexado (CDI, SELIC, IPCA...)</MenuItem>
                      <MenuItem value="FIXED_PLUS_INDEXER">Taxa fixa + indexador</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {newTemplateReturnType === 'FIXED' && (
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Taxa fixa (% ao ano)"
                      type="number"
                      value={newTemplateFixedRate}
                      onChange={(e) => setNewTemplateFixedRate(Number(e.target.value.replace(',', '.')) || 0)}
                      fullWidth
                      size="small"
                      InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                    />
                  </Grid>
                )}
                {(newTemplateReturnType === 'INDEXED' || newTemplateReturnType === 'FIXED_PLUS_INDEXER') && (
                  <>
                    {newTemplateReturnType === 'FIXED_PLUS_INDEXER' && (
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Taxa fixa (% ao ano)"
                          type="number"
                          value={newTemplateFixedRate}
                          onChange={(e) => setNewTemplateFixedRate(Number(e.target.value.replace(',', '.')) || 0)}
                          fullWidth
                          size="small"
                          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                        />
                      </Grid>
                    )}
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Indexador</InputLabel>
                        <Select
                          value={newTemplateIndexer}
                          onChange={(e) => setNewTemplateIndexer(e.target.value as IndexerType)}
                          label="Indexador"
                        >
                          <MenuItem value="CDI">CDI</MenuItem>
                          <MenuItem value="SELIC">SELIC</MenuItem>
                          <MenuItem value="IPCA">IPCA</MenuItem>
                          <MenuItem value="POUPANCA">Poupança</MenuItem>
                          <MenuItem value="TR">TR</MenuItem>
                          <MenuItem value="IGPM">IGP-M</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="% do indexador (ex: 110 para 110% CDI)"
                        type="number"
                        value={newTemplateIndexerPercent}
                        onChange={(e) => setNewTemplateIndexerPercent(Number(e.target.value.replace(',', '.')) || 100)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </>
                )}
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Data da aplicação"
                    type="date"
                    value={newTemplateStartDate}
                    onChange={(e) => setNewTemplateStartDate(e.target.value)}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Data do vencimento"
                    type="date"
                    value={newTemplateMaturityDate}
                    onChange={(e) => setNewTemplateMaturityDate(e.target.value)}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Risco</InputLabel>
                <Select
                  value={newTemplateRiskLevel}
                  onChange={(e) => setNewTemplateRiskLevel(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                  label="Risco"
                >
                  <MenuItem value="LOW">Baixo</MenuItem>
                  <MenuItem value="MEDIUM">Médio</MenuItem>
                  <MenuItem value="HIGH">Alto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Imposto (%)"
                type="number"
                value={newTemplateTaxRate}
                onChange={(e) => setNewTemplateTaxRate(Number(e.target.value.replace(',', '.')) || 15)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={addInvestmentTemplate} fullWidth>
                Adicionar ao catálogo
              </Button>
            </Grid>
          </Grid>

          {investmentTemplates.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                Investimentos no catálogo:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {investmentTemplates.map((t) => (
                  <Chip
                    key={t.id}
                    label={`${t.name}${t.type === 'FIXED_INCOME' && t.returnType === 'INDEXED' ? ` (${t.indexerPercent}% ${t.indexer})` : t.type === 'FIXED_INCOME' && t.returnType === 'FIXED_PLUS_INDEXER' ? ` (${t.fixedRate}% + ${t.indexerPercent}% ${t.indexer})` : ''}`}
                    onDelete={() => removeInvestmentTemplate(t.id)}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Card>
      ) : (
      <Grid container spacing={3}>
        {/* Configurações da Simulação */}
        <Grid item xs={12}>
          <Card elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Configurações da Simulação
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Período de Simulação (meses)"
                  name="simulationMonths"
                  value={simulationMonths}
                  onChange={(e) => setSimulationMonths(Number(e.target.value.replace(',', '.')))}
                  InputProps={{
                    inputComponent: NumericFormatCustom as any,
                  }}
                  fullWidth
                  variant="outlined"
                  size="medium"
                  inputProps={{ min: 1, max: 120 }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={includeCrypto}
                      onChange={(e) => setIncludeCrypto(e.target.checked)}
                    />
                  }
                  label="Incluir Volatilidade Crypto"
                />
                {includeCrypto && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Volatilidade Crypto: {cryptoVolatility}%
                    </Typography>
                    <Slider
                      value={cryptoVolatility}
                      onChange={(_, value) => setCryptoVolatility(value as number)}
                      min={10}
                      max={100}
                      step={5}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  onClick={calculateSimulation}
                  startIcon={<CalculateIcon />}
                  fullWidth
                  size="large"
                  disabled={investments.length === 0}
                >
                  Calcular Simulação
                </Button>
              </Grid>
              {simulation.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                      label="Nome da Simulação"
                      value={simulationName}
                      onChange={(e) => setSimulationName(e.target.value)}
                      placeholder="Ex: Simulação Conservadora 2025"
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleSaveSimulation}
                      startIcon={<SaveIcon />}
                      disabled={!simulationName.trim()}
                    >
                      Salvar Simulação
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Card>
        </Grid>

        {/* Lista de Investimentos */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Investimentos
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SaveIcon />}
                  onClick={saveInvestments}
                  disabled={investments.length === 0}
                >
                  Salvar
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<HistoryIcon />}
                  onClick={loadInvestments}
                >
                  Carregar
                </Button>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel id="add-investment-select-label">Adicionar investimento</InputLabel>
                  <Select
                    labelId="add-investment-select-label"
                    label="Adicionar investimento"
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__new__') {
                        addInvestment();
                      } else if (val && val !== '') {
                        addInvestment(Number(val));
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>Selecione...</em>
                    </MenuItem>
                    {investmentTemplates.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name} ({t.type === 'FIXED_INCOME' ? 'Renda Fixa' : t.type === 'CRYPTO' ? 'Cripto' : t.type === 'STOCK' ? 'Ações' : 'Imóvel'})
                      </MenuItem>
                    ))}
                    <MenuItem value="__new__">
                      + Novo investimento (digitar nome)
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Cards de Resumo */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* Card de Valor Total dos Investimentos */}
              {investments.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      p: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
                          Valor Total dos Investimentos
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                          R$ {investments.reduce((sum, inv) => sum + inv.initialValue, 0).toLocaleString('pt-BR', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </Typography>
                      </Box>
                      <FixedIncomeIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </Card>
                </Grid>
              )}
              
              {/* Card de Valor Não Investido */}
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    background: valorNaoInvestido >= 0 
                      ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                      : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                    color: 'white',
                    p: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
                        Valor Não Investido
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                        R$ {valorNaoInvestido.toLocaleString('pt-BR', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                        {valorNaoInvestido >= 0 ? 'Saldo disponível' : 'Saldo negativo'}
                      </Typography>
                    </Box>
                    <AccountBalanceIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              {investments.map((investment) => {
                const cardStyle = getInvestmentCardStyle(investment.type);
                return (
                  <Grid item xs={12} sm={6} md={4} key={investment.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        border: `2px solid ${cardStyle.borderColor}`,
                        backgroundColor: cardStyle.bgColor,
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 6,
                          borderColor: cardStyle.borderColor,
                        },
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      onClick={() => handleOpenEditModal(investment)}
                    >
                      {/* Header com gradiente */}
                      <Box
                        sx={{
                          background: cardStyle.gradient,
                          p: 2,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {cardStyle.icon}
                          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                            {investment.name || 'Sem nome'}
                          </Typography>
                        </Box>
                        <EditIcon sx={{ opacity: 0.8 }} />
                      </Box>

                      {/* Conteúdo do card */}
                      <CardContent>
                        <Stack spacing={1.5}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              Tipo
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {getInvestmentTypeName(investment.type)}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              Valor Inicial
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                              R$ {investment.initialValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              Aporte Mensal
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              R$ {investment.monthlyContribution.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              Retorno Esperado
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                              {investment.type === 'FIXED_INCOME' && investment.returnType === 'INDEXED'
                                ? `${investment.indexerPercent ?? 100}% ${investment.indexer ?? 'CDI'}`
                                : investment.type === 'FIXED_INCOME' && investment.returnType === 'FIXED_PLUS_INDEXER'
                                ? `${investment.fixedRate ?? 0}% + ${investment.indexerPercent ?? 100}% ${investment.indexer ?? 'CDI'}`
                                : `${investment.expectedReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% ${investment.returnPeriod === 'MONTHLY' ? '(mensal)' : '(anual)'}`}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={`Risco: ${getRiskLevelName(investment.riskLevel)}`}
                              size="small"
                              color={
                                investment.riskLevel === 'LOW' ? 'success' :
                                investment.riskLevel === 'MEDIUM' ? 'warning' : 'error'
                              }
                              sx={{ fontSize: '0.7rem' }}
                            />
                            <Chip
                              label={`Imposto: ${investment.taxRate || 15}%`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </Box>

                          {investment.type === 'FIXED_INCOME' && investment.maturityDate && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                Vencimento
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {new Date(investment.maturityDate).toLocaleDateString('pt-BR')}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </CardContent>

                      {/* Botão de excluir no card */}
                      <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="text"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteInvestmentClick(investment.id);
                          }}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          Excluir
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
              
              {investments.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Adicione investimentos para começar a simulação.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Card>
        </Grid>

        {/* Resultados da Simulação */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              <CryptoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Resultados da Simulação
            </Typography>

            {statistics ? (
              <Stack spacing={2}>
                <TextField
                  label="Valor Total Final"
                  value={statistics.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    readOnly: true,
                  }}
                  fullWidth
                  variant="outlined"
                  size="medium"
                  sx={{ 
                    '& .MuiInputBase-input': { 
                      fontWeight: 'bold',
                      color: 'success.main',
                      fontSize: '1.1rem'
                    }
                  }}
                />

                <TextField
                  label="Total Investido"
                  value={statistics.totalContribution.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    readOnly: true,
                  }}
                  fullWidth
                  variant="outlined"
                  size="medium"
                />

                <TextField
                  label="Lucro Total (Bruto)"
                  value={statistics.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    readOnly: true,
                  }}
                  fullWidth
                  variant="outlined"
                  size="medium"
                  sx={{ 
                    '& .MuiInputBase-input': { 
                      fontWeight: 'bold',
                      color: 'primary.main',
                      fontSize: '1.1rem'
                    }
                  }}
                />

                <Divider sx={{ my: 1 }} />

                <TextField
                  label="Imposto Total"
                  value={statistics.totalTax.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    readOnly: true,
                  }}
                  fullWidth
                  variant="outlined"
                  size="medium"
                  sx={{ 
                    '& .MuiInputBase-input': { 
                      fontWeight: 'bold',
                      color: 'warning.main',
                      fontSize: '1.1rem'
                    }
                  }}
                  helperText={statistics.totalProfit > 0 ? `Taxa efetiva aplicada: ${statistics.averageTaxRate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% sobre o lucro bruto` : 'Sem lucro para calcular imposto'}
                />

                <TextField
                  label="Lucro Líquido (Após Impostos)"
                  value={statistics.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    readOnly: true,
                  }}
                  fullWidth
                  variant="outlined"
                  size="medium"
                  sx={{ 
                    '& .MuiInputBase-input': { 
                      fontWeight: 'bold',
                      color: 'success.main',
                      fontSize: '1.1rem'
                    }
                  }}
                />

                <Divider sx={{ my: 1 }} />

                <TextField
                  label="Retorno Total"
                  value={`${statistics.totalReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`}
                  InputProps={{
                    readOnly: true,
                  }}
                  fullWidth
                  variant="outlined"
                  size="medium"
                  sx={{ 
                    '& .MuiInputBase-input': { 
                      fontWeight: 'bold',
                      color: statistics.totalReturn >= 0 ? 'success.main' : 'error.main',
                      fontSize: '1.1rem'
                    }
                  }}
                />

                <TextField
                  label="Margem de Lucro (Bruta)"
                  value={`${statistics.profitMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`}
                  InputProps={{
                    readOnly: true,
                  }}
                  fullWidth
                  variant="outlined"
                  size="medium"
                />

                <TextField
                  label="Margem de Lucro Líquida"
                  value={`${statistics.netProfitMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`}
                  InputProps={{
                    readOnly: true,
                  }}
                  fullWidth
                  variant="outlined"
                  size="medium"
                  sx={{ 
                    '& .MuiInputBase-input': { 
                      fontWeight: 'bold',
                      color: 'success.main',
                      fontSize: '1.1rem'
                    }
                  }}
                />
              </Stack>
            ) : (
              <Alert severity="info">
                Execute a simulação para ver os resultados.
              </Alert>
            )}
          </Card>
        </Grid>

        {/* Gráfico da Simulação */}
        {simulation.length > 0 && (
          <Grid item xs={12}>
            <Card elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Evolução do Patrimônio
              </Typography>
              
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={simulation} margin={{ top: 20, right: 30, left: 50, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      label={{
                        value: 'Meses',
                        position: 'insideBottomRight',
                        offset: -5,
                      }}
                    />
                    <YAxis 
                      tickFormatter={(v) => `R$${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      domain={['dataMin - 1000', 'dataMax + 1000']}
                      width={80}
                    />
                    <Tooltip 
                      formatter={(v) => [`R$${(v as number).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Valor']}
                      labelFormatter={(label) => `Mês ${label}`}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalValue" 
                      name="Valor Total"
                      stroke="#1976d2"
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalContribution" 
                      name="Total Investido"
                      stroke="#ff9800"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalProfit" 
                      name="Lucro"
                      stroke="#4caf50"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>
        )}

        {/* Distribuição por Tipo de Investimento */}
        {simulation.length > 0 && (
          <Grid item xs={12}>
            <Card elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                Distribuição por Tipo de Investimento
              </Typography>
              
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={simulation.slice(-1)} margin={{ top: 20, right: 30, left: 50, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(v) => `R$${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      domain={['dataMin - 1000', 'dataMax + 1000']}
                      width={80}
                    />
                    <Tooltip formatter={(v) => [`R$${(v as number).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Valor']} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                    <Bar dataKey="cryptoValue" name="Criptomoedas" fill="#ff9800" />
                    <Bar dataKey="stockValue" name="Ações" fill="#2196f3" />
                    <Bar dataKey="fixedIncomeValue" name="Renda Fixa" fill="#4caf50" />
                    <Bar dataKey="realEstateValue" name="Imóveis" fill="#9c27b0" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>
        )}

        {/* Simulações Salvas */}
        {savedSimulations.length > 0 && (
          <Grid item xs={12}>
            <Card elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Simulações Salvas
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell align="right">Valor Total Final</TableCell>
                      <TableCell align="right">Lucro Total</TableCell>
                      <TableCell align="right">Retorno</TableCell>
                      <TableCell>Data</TableCell>
                      <TableCell align="center">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {savedSimulations.map((savedSim) => (
                      <TableRow key={savedSim.id}>
                        <TableCell>{savedSim.name}</TableCell>
                        <TableCell align="right">
                          R$ {savedSim.statistics?.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                        </TableCell>
                        <TableCell align="right">
                          R$ {savedSim.statistics?.totalProfit?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                        </TableCell>
                        <TableCell align="right">
                          {savedSim.statistics?.totalReturn?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}%
                        </TableCell>
                        <TableCell>
                          {new Date(savedSim.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleLoadSimulation(savedSim)}
                            >
                              Carregar
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleDeleteSimulationClick(savedSim.id)}
                            >
                              Excluir
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        )}
      </Grid>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteType === 'investment' 
              ? 'Deseja realmente excluir este investimento? Esta ação não pode ser desfeita.'
              : 'Deseja realmente excluir esta simulação? Esta ação não pode ser desfeita.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Edição de Investimento */}
      <Dialog
        open={editModalOpen}
        onClose={handleCloseEditModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'visible',
          }
        }}
      >
        <DialogTitle sx={{ 
          background: editingInvestment ? getInvestmentCardStyle(editingInvestment.type).gradient : undefined,
          color: editingInvestment ? 'white' : undefined,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pb: 2,
          pt: 2.5,
          px: 3,
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
        }}>
          {editingInvestment && getInvestmentCardStyle(editingInvestment.type).icon}
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {editingInvestment ? `Editar: ${editingInvestment.name || 'Investimento'}` : 'Editar Investimento'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 4, pb: 2, position: 'relative', zIndex: 0, px: 3 }}>
          {editingInvestment && (
            <Grid container spacing={3} sx={{ mt: 0 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nome do Investimento"
                  value={editingInvestment.name}
                  onChange={(e) => updateEditingInvestment('name', e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="medium"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Select
                  value={editingInvestment.type}
                  onChange={(e) => updateEditingInvestment('type', e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="medium"
                  label="Tipo de Investimento"
                >
                  <MenuItem value="CRYPTO">Criptomoedas</MenuItem>
                  <MenuItem value="STOCK">Ações</MenuItem>
                  <MenuItem value="FIXED_INCOME">Renda Fixa</MenuItem>
                  <MenuItem value="REAL_ESTATE">Imóveis</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <TextField
                    label="Valor Inicial"
                    value={editingInvestment.initialValue}
                    onChange={(e) => updateEditingInvestment('initialValue', Number(e.target.value.replace(',', '.')))}
                    InputProps={{
                      inputComponent: NumericFormatCustom as any,
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    fullWidth
                    variant="outlined"
                    size="medium"
                  />
                  {valorNaoInvestido > 0 && (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      onClick={() => updateEditingInvestment('initialValue', valorNaoInvestido)}
                      sx={{ 
                        mt: 0.5,
                        whiteSpace: 'nowrap',
                        minWidth: 'auto',
                        px: 1.5,
                      }}
                      title={`Usar valor não investido: R$ ${valorNaoInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    >
                      Usar Valor Não Investido
                    </Button>
                  )}
                </Box>
                {valorNaoInvestido > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Valor não investido disponível: R$ {valorNaoInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Aporte Mensal"
                  value={editingInvestment.monthlyContribution}
                  onChange={(e) => updateEditingInvestment('monthlyContribution', Number(e.target.value.replace(',', '.')))}
                  InputProps={{
                    inputComponent: NumericFormatCustom as any,
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  fullWidth
                  variant="outlined"
                  size="medium"
                />
              </Grid>
              {editingInvestment.type === 'FIXED_INCOME' ? (
                <>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined" size="medium">
                      <InputLabel>Tipo de Rendimento</InputLabel>
                      <Select
                        value={editingInvestment.returnType || 'FIXED'}
                        onChange={(e) => updateEditingInvestment('returnType', e.target.value as ReturnType)}
                        label="Tipo de Rendimento"
                      >
                        <MenuItem value="FIXED">Taxa fixa</MenuItem>
                        <MenuItem value="INDEXED">Indexado (CDI, SELIC, IPCA...)</MenuItem>
                        <MenuItem value="FIXED_PLUS_INDEXER">Taxa fixa + indexador</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {(editingInvestment.returnType === 'INDEXED' || editingInvestment.returnType === 'FIXED_PLUS_INDEXER') ? (
                    <>
                      {editingInvestment.returnType === 'FIXED_PLUS_INDEXER' && (
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Taxa fixa (% ao ano)"
                            value={editingInvestment.fixedRate ?? 0}
                            onChange={(e) => updateEditingInvestment('fixedRate', Number(e.target.value.replace(',', '.')))}
                            InputProps={{
                              inputComponent: PercentageFormatCustom as any,
                              endAdornment: <InputAdornment position="end">%</InputAdornment>,
                            }}
                            fullWidth
                            variant="outlined"
                            size="medium"
                          />
                        </Grid>
                      )}
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth variant="outlined" size="medium">
                          <InputLabel>Indexador</InputLabel>
                          <Select
                            value={editingInvestment.indexer || 'CDI'}
                            onChange={(e) => updateEditingInvestment('indexer', e.target.value as IndexerType)}
                            label="Indexador"
                          >
                            <MenuItem value="CDI">CDI</MenuItem>
                            <MenuItem value="SELIC">SELIC</MenuItem>
                            <MenuItem value="IPCA">IPCA</MenuItem>
                            <MenuItem value="POUPANCA">Poupança</MenuItem>
                            <MenuItem value="TR">TR</MenuItem>
                            <MenuItem value="IGPM">IGP-M</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="% do indexador (ex: 110 para 110% CDI)"
                          value={editingInvestment.indexerPercent ?? 100}
                          onChange={(e) => updateEditingInvestment('indexerPercent', Number(e.target.value.replace(',', '.')))}
                          fullWidth
                          variant="outlined"
                          size="medium"
                        />
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth variant="outlined" size="medium">
                          <InputLabel>Período da Taxa</InputLabel>
                          <Select
                            value={editingInvestment.returnPeriod || 'ANNUAL'}
                            onChange={(e) => updateReturnPeriodInModal(e.target.value as 'ANNUAL' | 'MONTHLY')}
                            label="Período da Taxa"
                          >
                            <MenuItem value="ANNUAL">Taxa Anual</MenuItem>
                            <MenuItem value="MONTHLY">Taxa Mensal</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label={`Taxa fixa (% ${editingInvestment.returnPeriod === 'MONTHLY' ? 'Mensal' : 'Anual'})`}
                          value={editingInvestment.expectedReturn}
                          onChange={(e) => updateEditingInvestment('expectedReturn', Number(e.target.value.replace(',', '.')))}
                          InputProps={{
                            inputComponent: PercentageFormatCustom as any,
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                          fullWidth
                          variant="outlined"
                          size="medium"
                        />
                      </Grid>
                    </>
                  )}
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Data da aplicação"
                      type="date"
                      value={editingInvestment.startDate || ''}
                      onChange={(e) => updateEditingInvestment('startDate', e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="medium"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Data de Vencimento"
                    type="date"
                    value={editingInvestment.maturityDate || ''}
                    onChange={(e) => updateEditingInvestment('maturityDate', e.target.value)}
                    fullWidth
                    variant="outlined"
                    size="medium"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    helperText={
                      editingInvestment.maturityDate 
                        ? (() => {
                            const maturityDate = new Date(editingInvestment.maturityDate);
                            const currentDate = new Date();
                            const monthsUntilMaturity = Math.floor(
                              (maturityDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
                            );
                            if (monthsUntilMaturity < 0) {
                              return `⚠️ Investimento já vencido. Não renderá na simulação.`;
                            } else if (monthsUntilMaturity < simulationMonths) {
                              return `⚠️ Vence em ${monthsUntilMaturity} meses. Não renderá após o vencimento.`;
                            } else {
                              return `Vence em ${monthsUntilMaturity} meses. Após esta data, não renderá mais.`;
                            }
                          })()
                        : "Após esta data, o investimento não renderá mais"
                    }
                  />
                </Grid>
                </>
              ) : (
                <>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined" size="medium">
                  <InputLabel>Período da Taxa</InputLabel>
                  <Select
                    value={editingInvestment.returnPeriod || 'ANNUAL'}
                    onChange={(e) => updateReturnPeriodInModal(e.target.value as 'ANNUAL' | 'MONTHLY')}
                    label="Período da Taxa"
                  >
                    <MenuItem value="ANNUAL">Taxa Anual</MenuItem>
                    <MenuItem value="MONTHLY">Taxa Mensal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={`Retorno Esperado (% ${editingInvestment.returnPeriod === 'MONTHLY' ? 'Mensal' : 'Anual'})`}
                  value={editingInvestment.expectedReturn}
                  onChange={(e) => updateEditingInvestment('expectedReturn', Number(e.target.value.replace(',', '.')))}
                  InputProps={{
                    inputComponent: PercentageFormatCustom as any,
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  fullWidth
                  variant="outlined"
                  size="medium"
                  helperText={editingInvestment.returnPeriod === 'MONTHLY' 
                    ? `Equivale a ${monthlyToAnnual(editingInvestment.expectedReturn).toFixed(2)}% ao ano`
                    : `Equivale a ${annualToMonthly(editingInvestment.expectedReturn).toFixed(2)}% ao mês`}
                />
              </Grid>
                </>
              )}
              <Grid item xs={12} md={editingInvestment.type === 'FIXED_INCOME' ? 6 : 12}>
                <Select
                  value={editingInvestment.riskLevel}
                  onChange={(e) => updateEditingInvestment('riskLevel', e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="medium"
                  label="Nível de Risco"
                >
                  <MenuItem value="LOW">Baixo Risco</MenuItem>
                  <MenuItem value="MEDIUM">Médio Risco</MenuItem>
                  <MenuItem value="HIGH">Alto Risco</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Taxa de Imposto (%)"
                  value={editingInvestment.taxRate || 15}
                  onChange={(e) => updateEditingInvestment('taxRate', Number(e.target.value.replace(',', '.')))}
                  InputProps={{
                    inputComponent: PercentageFormatCustom as any,
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  fullWidth
                  variant="outlined"
                  size="medium"
                  helperText="Imposto sobre o lucro deste investimento"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseEditModal} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSaveEditModal} variant="contained" color="primary" startIcon={<SaveIcon />}>
            Salvar Alterações
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensagens */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%', minWidth: '300px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfitPlan;