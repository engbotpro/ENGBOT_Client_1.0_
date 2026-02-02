import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Stack,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  FormControlLabel,
  Switch,
  Tooltip,
  Tabs,
  Tab,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { 
  Delete, 
  Add as AddIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as ContentCopyIcon,
  Settings as SettingsIcon,
  ArrowBack as ArrowBackIcon,
  UploadFile as UploadFileIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
// ----- REPLACE these imports with your real hooks -----
import {
  useGetSpendingPlanQuery,
  useSaveSpendingPlanMutation,
} from '../calculate/CalculateAPI';
import { RootState } from '../../store';
import { useSelector, useDispatch } from 'react-redux';
import { SpendingEntry } from '../../types/calculate';
import NumericFormatCustom from '../../components/NumericFormatCustom';
import { sendSuccess, sendError } from '../../features/notificationSlice';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import {
  useGetExpenseTypesQuery,
  useCreateExpenseTypeMutation,
  useDeleteExpenseTypeMutation,
  ExpenseType
} from '../../services/expenseTypesAPI';
// --------------------------------------------------------

type PlanningPeriod = 'DIARIO' | 'SEMANAL' | 'MENSAL' | 'ANUAL';

// Funções auxiliares para datas
const getMonthName = (month: number): string => {
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  return months[month - 1] || '';
};

const getDayName = (dayOfWeek: number): string => {
  const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  return days[dayOfWeek] || '';
};

interface SpendingEntryWithSource extends SpendingEntry {
  isFixed?: boolean; // Indica se é uma entrada fixa (oriunda de outro período)
  sourcePeriod?: PlanningPeriod; // Período de origem (quando é fixo)
  expenseType?: string; // Tipo de gasto selecionado
}

interface PeriodData {
  receitas: SpendingEntryWithSource[];
  despesas: SpendingEntryWithSource[];
}

interface SpendingPlanData {
  DIARIO: PeriodData;
  SEMANAL: PeriodData;
  MENSAL: PeriodData;
  ANUAL: PeriodData;
}

const SpendingPlan: React.FC = () => {
  // fetch initial data
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const userId = user?.id ?? '';
  const { data, isLoading, isError, refetch: refetchSpendingPlan } = useGetSpendingPlanQuery(userId, { skip: !userId });
  const [savePlan, { isLoading: isSaving, isError: saveError, isSuccess }] =
    useSaveSpendingPlanMutation();

  // Função para verificar se o usuário tem plano ativo
  const hasActivePlan = useMemo(() => {
    if (!user?.currentPlan) return false;
    
    // Se não tem data de expiração, considera como plano ativo (plano permanente ou sem expiração)
    if (!user.planExpiresAt) return true;
    
    // Verifica se a data de expiração ainda não passou
    const expirationDate = new Date(user.planExpiresAt);
    const now = new Date();
    return expirationDate > now;
  }, [user?.currentPlan, user?.planExpiresAt]);

  // Estrutura de dados por período (PLANEJADO)
  const [planData, setPlanData] = useState<SpendingPlanData>({
    DIARIO: { receitas: [], despesas: [] },
    SEMANAL: { receitas: [], despesas: [] },
    MENSAL: { receitas: [], despesas: [] },
    ANUAL: { receitas: [], despesas: [] },
  });
  
  // Estrutura de dados por período (REALIZADO)
  const [realData, setRealData] = useState<SpendingPlanData>({
    DIARIO: { receitas: [], despesas: [] },
    SEMANAL: { receitas: [], despesas: [] },
    MENSAL: { receitas: [], despesas: [] },
    ANUAL: { receitas: [], despesas: [] },
  });
  
  const [nextId, setNextId] = useState(1);
  const [nextRealId, setNextRealId] = useState(10000); // IDs diferentes para dados reais
  
  // Refs para manter arrays estáveis durante drag
  const stableReceitasRef = useRef<SpendingEntryWithSource[]>([]);
  const stableDespesasRef = useRef<SpendingEntryWithSource[]>([]);
  const stableReceitasPlanejadasRef = useRef<SpendingEntryWithSource[]>([]);
  const stableDespesasPlanejadasRef = useRef<SpendingEntryWithSource[]>([]);
  const isDraggingRef = useRef(false);
  
  // Estado para controlar qual aba está ativa
  // Se o usuário não tem plano, força sempre 'planejado'
  const [activeTab, setActiveTab] = useState<'planejado' | 'realizado' | 'analise' | 'configuracoes'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('spendingPlan_activeTab');
      if (saved === 'realizado') return 'realizado';
      if (saved === 'analise') return 'analise';
      if (saved === 'configuracoes') return 'configuracoes';
    }
    return 'planejado';
  });
  const [isChangingSubTab, setIsChangingSubTab] = useState(false);

  // Estado e API para tipos de gastos personalizados
  const { data: expenseTypesData, isLoading: expenseTypesLoading, error: expenseTypesError } = useGetExpenseTypesQuery();
  const [createExpenseType, { isLoading: creatingExpenseType }] = useCreateExpenseTypeMutation();
  const [deleteExpenseType] = useDeleteExpenseTypeMutation();
  
  const [newExpenseType, setNewExpenseType] = useState('');
  
  // Estado para controlar tipo de gráfico na aba análise
  const [chartType, setChartType] = useState<'pie' | 'bar'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('spendingPlan_chartType');
      if (saved === 'bar' || saved === 'pie') return saved;
    }
    return 'pie';
  });

  // Estados para gráficos interativos
  const [selectedExpenseType, setSelectedExpenseType] = useState<string | null>(null);
  const [selectedChartCategory, setSelectedChartCategory] = useState<string | null>(null);
  const [showDetailChart, setShowDetailChart] = useState(false);

  // Estados para importação de CSV/PDF
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importedData, setImportedData] = useState<Array<{ description: string; value: number }>>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Estados para configurações de replicação e vinculação
  const [linkPeriods, setLinkPeriods] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('spendingPlan_linkPeriods');
      return saved === 'true';
    }
    return false;
  });


  // Converter dados da API para o formato usado pelos componentes
  const expenseTypes = expenseTypesData?.map(type => type.name) || [];
  
  // Inicializar estados com valores do localStorage se disponível
  const [planningPeriod, setPlanningPeriod] = useState<PlanningPeriod>(() => {
    // Tentar carregar do localStorage usando uma chave genérica primeiro
    if (typeof window !== 'undefined') {
      const savedPeriod = localStorage.getItem('spendingPlan_period');
      if (savedPeriod && ['DIARIO', 'SEMANAL', 'MENSAL', 'ANUAL'].includes(savedPeriod)) {
        return savedPeriod as PlanningPeriod;
      }
    }
    return 'MENSAL';
  });
  
  const [initialCapital, setInitialCapital] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('spendingPlan_initialCapital');
      if (saved) return saved;
    }
    return '0';
  });
  
  // Estados para seleções específicas do período
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('spendingPlan_selectedYear');
      return saved ? Number(saved) : currentYear;
    }
    return currentYear;
  });
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('spendingPlan_selectedMonth');
      return saved ? Number(saved) : currentMonth;
    }
    return currentMonth;
  });
  
  const [selectedWeek, setSelectedWeek] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('spendingPlan_selectedWeek');
      return saved ? Number(saved) : 1;
    }
    return 1;
  });
  
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('spendingPlan_selectedDayOfWeek');
      return saved ? Number(saved) : 1; // Segunda-feira por padrão
    }
    return 1; // Segunda-feira por padrão
  });
  
  // Estados para replicar receitas e despesas para todos os meses
  const [replicateReceitasToAllMonths, setReplicateReceitasToAllMonths] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('spendingPlan_replicateReceitasToAllMonths');
      return saved === 'true';
    }
    return false;
  });
  
  const [replicateDespesasToAllMonths, setReplicateDespesasToAllMonths] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('spendingPlan_replicateDespesasToAllMonths');
      return saved === 'true';
    }
    return false;
  });
  
  // Carregar estados salvos do localStorage quando userId estiver disponível (sobrescreve valores genéricos)
  useEffect(() => {
    if (userId) {
      const savedPeriod = localStorage.getItem(`spendingPlan_${userId}_period`);
      if (savedPeriod && ['DIARIO', 'SEMANAL', 'MENSAL', 'ANUAL'].includes(savedPeriod)) {
        setPlanningPeriod(savedPeriod as PlanningPeriod);
      }
      
      const savedCapital = localStorage.getItem(`spendingPlan_${userId}_initialCapital`);
      if (savedCapital) {
        setInitialCapital(savedCapital);
      }
      
      const savedLinkPeriods = localStorage.getItem(`spendingPlan_${userId}_linkPeriods`);
      if (savedLinkPeriods === 'true') {
        setLinkPeriods(true);
      } else if (savedLinkPeriods === 'false') {
        setLinkPeriods(false);
      }
      
      // Carregar seleções específicas
      const savedYear = localStorage.getItem(`spendingPlan_${userId}_selectedYear`);
      if (savedYear) {
        setSelectedYear(Number(savedYear));
      }
      
      const savedMonth = localStorage.getItem(`spendingPlan_${userId}_selectedMonth`);
      if (savedMonth) {
        setSelectedMonth(Number(savedMonth));
      }
      
      const savedWeek = localStorage.getItem(`spendingPlan_${userId}_selectedWeek`);
      if (savedWeek) {
        setSelectedWeek(Number(savedWeek));
      }
      
      const savedDayOfWeek = localStorage.getItem(`spendingPlan_${userId}_selectedDayOfWeek`);
      if (savedDayOfWeek) {
        setSelectedDayOfWeek(Number(savedDayOfWeek));
      }
      
      // Carregar opções de replicação
      const savedReplicateReceitas = localStorage.getItem(`spendingPlan_${userId}_replicateReceitasToAllMonths`);
      if (savedReplicateReceitas === 'true') {
        setReplicateReceitasToAllMonths(true);
      }
      
      const savedReplicateDespesas = localStorage.getItem(`spendingPlan_${userId}_replicateDespesasToAllMonths`);
      if (savedReplicateDespesas === 'true') {
        setReplicateDespesasToAllMonths(true);
      }
    }
  }, [userId]);

  // Garantir que usuários sem plano sempre vejam apenas 'planejado' e desativar funcionalidades premium
  useEffect(() => {
    if (!hasActivePlan) {
      // Força aba para 'planejado' se estiver em 'realizado'
      if (activeTab === 'realizado') {
        setActiveTab('planejado');
      }
      // Desativa linkPeriods se estiver ativo
      if (linkPeriods) {
        setLinkPeriods(false);
      }
      // Desativa replicação se estiver ativa
      if (replicateReceitasToAllMonths) {
        setReplicateReceitasToAllMonths(false);
      }
      if (replicateDespesasToAllMonths) {
        setReplicateDespesasToAllMonths(false);
      }
    }
  }, [hasActivePlan, activeTab, linkPeriods, replicateReceitasToAllMonths, replicateDespesasToAllMonths]);
  
  // Salvar preferência de tipo de gráfico no localStorage
  useEffect(() => {
    localStorage.setItem('spendingPlan_chartType', chartType);
  }, [chartType]);
  
  // Salvar período no localStorage quando mudar (salva tanto com userId quanto genérico)
  useEffect(() => {
    localStorage.setItem('spendingPlan_period', planningPeriod);
    if (userId) {
      localStorage.setItem(`spendingPlan_${userId}_period`, planningPeriod);
    }
  }, [planningPeriod, userId]);
  
  // Salvar capital inicial no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('spendingPlan_initialCapital', initialCapital);
    if (userId) {
      localStorage.setItem(`spendingPlan_${userId}_initialCapital`, initialCapital);
    }
  }, [initialCapital, userId]);
  
  // Salvar linkPeriods no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('spendingPlan_linkPeriods', linkPeriods.toString());
    if (userId) {
      localStorage.setItem(`spendingPlan_${userId}_linkPeriods`, linkPeriods.toString());
    }
  }, [linkPeriods, userId]);
  
  // Salvar seleções específicas no localStorage
  useEffect(() => {
    localStorage.setItem('spendingPlan_selectedYear', selectedYear.toString());
    if (userId) {
      localStorage.setItem(`spendingPlan_${userId}_selectedYear`, selectedYear.toString());
    }
  }, [selectedYear, userId]);
  
  useEffect(() => {
    localStorage.setItem('spendingPlan_selectedMonth', selectedMonth.toString());
    if (userId) {
      localStorage.setItem(`spendingPlan_${userId}_selectedMonth`, selectedMonth.toString());
    }
  }, [selectedMonth, userId]);
  
  useEffect(() => {
    localStorage.setItem('spendingPlan_selectedWeek', selectedWeek.toString());
    if (userId) {
      localStorage.setItem(`spendingPlan_${userId}_selectedWeek`, selectedWeek.toString());
    }
  }, [selectedWeek, userId]);
  
  useEffect(() => {
    localStorage.setItem('spendingPlan_selectedDayOfWeek', selectedDayOfWeek.toString());
    if (userId) {
      localStorage.setItem(`spendingPlan_${userId}_selectedDayOfWeek`, selectedDayOfWeek.toString());
    }
  }, [selectedDayOfWeek, userId]);
  
  // Salvar opções de replicação no localStorage
  useEffect(() => {
    localStorage.setItem('spendingPlan_replicateReceitasToAllMonths', replicateReceitasToAllMonths.toString());
    if (userId) {
      localStorage.setItem(`spendingPlan_${userId}_replicateReceitasToAllMonths`, replicateReceitasToAllMonths.toString());
    }
  }, [replicateReceitasToAllMonths, userId]);
  
  useEffect(() => {
    localStorage.setItem('spendingPlan_replicateDespesasToAllMonths', replicateDespesasToAllMonths.toString());
    if (userId) {
      localStorage.setItem(`spendingPlan_${userId}_replicateDespesasToAllMonths`, replicateDespesasToAllMonths.toString());
    }
  }, [replicateDespesasToAllMonths, userId]);
  
  // Função para replicar receitas/despesas quando o mês mudar
  const replicateToNewMonth = (newMonth: number, previousMonth: number) => {
    if (newMonth === previousMonth) return; // Não fazer nada se for o mesmo mês
    
    setPlanData((prev) => {
      const newData: SpendingPlanData = {
        DIARIO: {
          receitas: [...prev.DIARIO.receitas],
          despesas: [...prev.DIARIO.despesas],
        },
        SEMANAL: {
          receitas: [...prev.SEMANAL.receitas],
          despesas: [...prev.SEMANAL.despesas],
        },
        MENSAL: {
          receitas: [...prev.MENSAL.receitas],
          despesas: [...prev.MENSAL.despesas],
        },
        ANUAL: {
          receitas: [...prev.ANUAL.receitas],
          despesas: [...prev.ANUAL.despesas],
        },
      };
      
      // Calcular o maior ID existente para gerar novos IDs únicos
      const allIds = [
        ...prev.DIARIO.receitas.map(e => e.id),
        ...prev.DIARIO.despesas.map(e => e.id),
        ...prev.SEMANAL.receitas.map(e => e.id),
        ...prev.SEMANAL.despesas.map(e => e.id),
        ...prev.MENSAL.receitas.map(e => e.id),
        ...prev.MENSAL.despesas.map(e => e.id),
        ...prev.ANUAL.receitas.map(e => e.id),
        ...prev.ANUAL.despesas.map(e => e.id),
      ];
      const maxId = allIds.length > 0 ? Math.max(...allIds) : 0;
      let currentNextId = maxId + 1;
      
      // Replicar receitas se a opção estiver marcada
      if (replicateReceitasToAllMonths) {
        // Verificar se já existem receitas para o novo mês
        const existingReceitasForNewMonth = prev[planningPeriod].receitas.filter((entry) => {
          return entry.month === newMonth && entry.year === selectedYear && !entry.isFixed;
        });
        
        // Se não existirem receitas para o novo mês, replicar do mês anterior
        if (existingReceitasForNewMonth.length === 0) {
          const previousReceitas = prev[planningPeriod].receitas.filter((entry) => {
            return entry.month === previousMonth && entry.year === selectedYear && !entry.isFixed;
          });
          
          // Adicionar receitas replicadas do mês anterior com novos IDs para evitar conflitos
          previousReceitas.forEach((entry) => {
            const replicatedEntry: SpendingEntryWithSource = {
              ...entry,
              month: newMonth,
              id: currentNextId++, // Novo ID único para cada entrada replicada
            };
            newData[planningPeriod].receitas.push(replicatedEntry);
          });
          
          // Atualizar nextId se necessário
          if (previousReceitas.length > 0) {
            setNextId(currentNextId);
          }
        }
      }
      
      // Replicar despesas se a opção estiver marcada
      if (replicateDespesasToAllMonths) {
        // Verificar se já existem despesas para o novo mês
        const existingDespesasForNewMonth = prev[planningPeriod].despesas.filter((entry) => {
          return entry.month === newMonth && entry.year === selectedYear && !entry.isFixed;
        });
        
        // Se não existirem despesas para o novo mês, replicar do mês anterior
        if (existingDespesasForNewMonth.length === 0) {
          const previousDespesas = prev[planningPeriod].despesas.filter((entry) => {
            return entry.month === previousMonth && entry.year === selectedYear && !entry.isFixed;
          });
          
          // Adicionar despesas replicadas do mês anterior com novos IDs para evitar conflitos
          previousDespesas.forEach((entry) => {
            const replicatedEntry: SpendingEntryWithSource = {
              ...entry,
              month: newMonth,
              id: currentNextId++, // Novo ID único para cada entrada replicada
            };
            newData[planningPeriod].despesas.push(replicatedEntry);
          });
          
          // Atualizar nextId se necessário
          if (previousDespesas.length > 0) {
            setNextId(currentNextId);
          }
        }
      }
      
      return newData;
    });
  };
  
  // Monitorar mudança de mês e replicar se necessário
  const [previousMonth, setPreviousMonth] = useState(selectedMonth);
  
  useEffect(() => {
    // Apenas replicar se o período for MENSAL, DIARIO ou SEMANAL (que têm mês)
    // E se pelo menos uma das opções de replicação estiver marcada
    if ((planningPeriod === 'MENSAL' || planningPeriod === 'DIARIO' || planningPeriod === 'SEMANAL') && 
        selectedMonth !== previousMonth &&
        (replicateReceitasToAllMonths || replicateDespesasToAllMonths)) {
      replicateToNewMonth(selectedMonth, previousMonth);
    }
    setPreviousMonth(selectedMonth);
  }, [selectedMonth, planningPeriod, replicateReceitasToAllMonths, replicateDespesasToAllMonths, selectedYear]);

  // Receitas e despesas do período atual filtradas pela seleção específica
  // Usando useMemo com dependências específicas para garantir atualização
  const receitas = useMemo(() => {
    const allReceitas = planData[planningPeriod]?.receitas || [];
    
    // Filtrar baseado na seleção específica do período
    return allReceitas.filter((entry) => {
      if (planningPeriod === 'ANUAL') {
        // ANUAL: filtrar por ano
        return !entry.year || entry.year === selectedYear;
      } else if (planningPeriod === 'MENSAL') {
        // MENSAL: filtrar por ano e mês
        const yearMatch = !entry.year || entry.year === selectedYear;
        const monthMatch = !entry.month || entry.month === selectedMonth;
        return yearMatch && monthMatch;
      } else if (planningPeriod === 'SEMANAL') {
        // SEMANAL: filtrar por ano, mês e semana
        const yearMatch = !entry.year || entry.year === selectedYear;
        const monthMatch = !entry.month || entry.month === selectedMonth;
        const weekMatch = !entry.week || entry.week === selectedWeek;
        return yearMatch && monthMatch && weekMatch;
      } else if (planningPeriod === 'DIARIO') {
        // DIARIO: filtrar por ano, mês e dia da semana
        const yearMatch = !entry.year || entry.year === selectedYear;
        const monthMatch = !entry.month || entry.month === selectedMonth;
        const dayMatch = entry.dayOfWeek === undefined || entry.dayOfWeek === selectedDayOfWeek;
        return yearMatch && monthMatch && dayMatch;
      }
      return true;
    });
  }, [
    planData.DIARIO.receitas,
    planData.SEMANAL.receitas,
    planData.MENSAL.receitas,
    planData.ANUAL.receitas,
    planningPeriod,
    selectedYear,
    selectedMonth,
    selectedWeek,
    selectedDayOfWeek
  ]);
  
  const despesas = useMemo(() => {
    const allDespesas = planData[planningPeriod]?.despesas || [];
    
    // Filtrar baseado na seleção específica do período
    return allDespesas.filter((entry) => {
      if (planningPeriod === 'ANUAL') {
        // ANUAL: filtrar por ano
        return !entry.year || entry.year === selectedYear;
      } else if (planningPeriod === 'MENSAL') {
        // MENSAL: filtrar por ano e mês
        const yearMatch = !entry.year || entry.year === selectedYear;
        const monthMatch = !entry.month || entry.month === selectedMonth;
        return yearMatch && monthMatch;
      } else if (planningPeriod === 'SEMANAL') {
        // SEMANAL: filtrar por ano, mês e semana
        const yearMatch = !entry.year || entry.year === selectedYear;
        const monthMatch = !entry.month || entry.month === selectedMonth;
        const weekMatch = !entry.week || entry.week === selectedWeek;
        return yearMatch && monthMatch && weekMatch;
      } else if (planningPeriod === 'DIARIO') {
        // DIARIO: filtrar por ano, mês e dia da semana
        const yearMatch = !entry.year || entry.year === selectedYear;
        const monthMatch = !entry.month || entry.month === selectedMonth;
        const dayMatch = entry.dayOfWeek === undefined || entry.dayOfWeek === selectedDayOfWeek;
        return yearMatch && monthMatch && dayMatch;
      }
      return true;
    });
  }, [
    planData.DIARIO.despesas,
    planData.SEMANAL.despesas,
    planData.MENSAL.despesas,
    planData.ANUAL.despesas,
    planningPeriod,
    selectedYear,
    selectedMonth,
    selectedWeek,
    selectedDayOfWeek
  ]);

  // Funções de conversão entre períodos
  const convertValue = (value: number, fromPeriod: PlanningPeriod, toPeriod: PlanningPeriod): number => {
    if (fromPeriod === toPeriod) return value;
    
    // Converter para base mensal primeiro
    let monthlyValue = value;
    switch (fromPeriod) {
      case 'DIARIO': monthlyValue = value * 30; break;
      case 'SEMANAL': monthlyValue = value * 4.33; break;
      case 'MENSAL': monthlyValue = value; break;
      case 'ANUAL': monthlyValue = value / 12; break;
    }
    
    // Converter de mensal para o período destino
    switch (toPeriod) {
      case 'DIARIO': return monthlyValue / 30;
      case 'SEMANAL': return monthlyValue / 4.33;
      case 'MENSAL': return monthlyValue;
      case 'ANUAL': return monthlyValue * 12;
      default: return monthlyValue;
    }
  };

  // Adiciona ou atualiza uma entrada apenas no período atual (sem propagação)
  const updateEntryInPeriod = (
    entry: SpendingEntryWithSource,
    period: PlanningPeriod,
    type: 'receitas' | 'despesas'
  ) => {
    setPlanData((prev) => {
      // Criar uma cópia profunda da estrutura de dados
      const newData: SpendingPlanData = {
        DIARIO: {
          receitas: [...prev.DIARIO.receitas],
          despesas: [...prev.DIARIO.despesas],
        },
        SEMANAL: {
          receitas: [...prev.SEMANAL.receitas],
          despesas: [...prev.SEMANAL.despesas],
        },
        MENSAL: {
          receitas: [...prev.MENSAL.receitas],
          despesas: [...prev.MENSAL.despesas],
        },
        ANUAL: {
          receitas: [...prev.ANUAL.receitas],
          despesas: [...prev.ANUAL.despesas],
        },
      };
      
      // Atualizar apenas no período especificado
      const existingIndex = newData[period][type].findIndex((e) => e.id === entry.id);
      if (existingIndex >= 0) {
        // Criar novo array com o item atualizado
        newData[period][type] = newData[period][type].map((e) =>
          e.id === entry.id ? entry : e
        );
      } else {
        newData[period][type] = [entry, ...newData[period][type]];
      }
      
      return newData;
    });
  };

  // Retorna os períodos maiores que o período de origem
  const getLargerPeriods = (sourcePeriod: PlanningPeriod): PlanningPeriod[] => {
    const periodOrder: PlanningPeriod[] = ['DIARIO', 'SEMANAL', 'MENSAL', 'ANUAL'];
    const sourceIndex = periodOrder.indexOf(sourcePeriod);
    return periodOrder.slice(sourceIndex + 1);
  };

  // Propaga uma entrada apenas para períodos maiores quando linkPeriods está ativo
  const propagateEntryToLargerPeriods = (
    entry: SpendingEntryWithSource,
    sourcePeriod: PlanningPeriod,
    type: 'receitas' | 'despesas'
  ) => {
    setPlanData((prev) => {
      const newData: SpendingPlanData = {
        DIARIO: {
          receitas: [...prev.DIARIO.receitas],
          despesas: [...prev.DIARIO.despesas],
        },
        SEMANAL: {
          receitas: [...prev.SEMANAL.receitas],
          despesas: [...prev.SEMANAL.despesas],
        },
        MENSAL: {
          receitas: [...prev.MENSAL.receitas],
          despesas: [...prev.MENSAL.despesas],
        },
        ANUAL: {
          receitas: [...prev.ANUAL.receitas],
          despesas: [...prev.ANUAL.despesas],
        },
      };
      
      // No período de origem, marca como não fixo (é a entrada original)
      const entryWithSource: SpendingEntryWithSource = {
        ...entry,
        isFixed: false,
        sourcePeriod: undefined,
      };
      const existingIndex = newData[sourcePeriod][type].findIndex((e) => e.id === entry.id);
      if (existingIndex >= 0) {
        newData[sourcePeriod][type] = newData[sourcePeriod][type].map((e) =>
          e.id === entry.id ? entryWithSource : e
        );
      } else {
        newData[sourcePeriod][type] = [entryWithSource, ...newData[sourcePeriod][type]];
      }
      
      // Propaga apenas para períodos maiores
      const largerPeriods = getLargerPeriods(sourcePeriod);
      largerPeriods.forEach((period) => {
        const convertedValue = convertValue(entry.value, sourcePeriod, period);
        const fixedEntry: SpendingEntryWithSource = {
          ...entry,
          value: convertedValue,
          isFixed: true,
          sourcePeriod: sourcePeriod,
        };
        
        const existingIndex = newData[period][type].findIndex((e) => e.id === entry.id);
        if (existingIndex >= 0) {
          newData[period][type] = newData[period][type].map((e) =>
            e.id === entry.id ? fixedEntry : e
          );
        } else {
          newData[period][type] = [fixedEntry, ...newData[period][type]];
        }
      });
      
      return newData;
    });
  };

  // Removido: Carregamento de dados realizados do localStorage
  // Agora os dados são carregados apenas da API (banco de dados)
  
  // Removido: Salvamento automático de dados realizados no localStorage
  // Agora os dados são salvos apenas no banco de dados via API
  
  // Salvar aba ativa no localStorage
  useEffect(() => {
    localStorage.setItem('spendingPlan_activeTab', activeTab);
    if (userId) {
      localStorage.setItem(`spendingPlan_${userId}_activeTab`, activeTab);
    }
  }, [activeTab, userId]);
  
  // populate from API
  useEffect(() => {
    console.log('🟣 [Frontend] useEffect de carregamento executado. data existe?', !!data, 'userId:', userId);
    if (data) {
      console.log('🟣 [Frontend] Carregando dados da API. Keys:', Object.keys(data));
      // Tentar carregar dados do localStorage primeiro (com informações de período)
      const savedPeriods = localStorage.getItem(`spendingPlan_${userId}_periods`);
      
      if (savedPeriods) {
        try {
          const parsed = JSON.parse(savedPeriods) as {
            receitas: Array<SpendingEntry & { period?: PlanningPeriod }>;
            despesas: Array<SpendingEntry & { period?: PlanningPeriod }>;
          };
          
          const newData: SpendingPlanData = {
            DIARIO: { receitas: [], despesas: [] },
            SEMANAL: { receitas: [], despesas: [] },
            MENSAL: { receitas: [], despesas: [] },
            ANUAL: { receitas: [], despesas: [] },
          };
          
          // Distribuir receitas por período (preservando todos os campos de período)
          parsed.receitas.forEach((entry) => {
            const period = entry.period || 'MENSAL'; // Fallback para MENSAL se não tiver período
            const { period: _, ...cleanEntry } = entry;
            // Preservar todos os campos de período (year, month, week, dayOfWeek)
            newData[period].receitas.push(cleanEntry as SpendingEntryWithSource);
          });
          
          // Distribuir despesas por período (preservando todos os campos de período)
          parsed.despesas.forEach((entry) => {
            const period = entry.period || 'MENSAL'; // Fallback para MENSAL se não tiver período
            const { period: _, ...cleanEntry } = entry;
            // Preservar todos os campos de período (year, month, week, dayOfWeek)
            newData[period].despesas.push(cleanEntry as SpendingEntryWithSource);
          });
          
          setPlanData(newData);
          
          // set nextId past the highest
          const allIds = [
            ...parsed.receitas.map((e) => e.id),
            ...parsed.despesas.map((e) => e.id)
          ];
          const maxId = Math.max(0, ...allIds);
          setNextId(maxId + 1);
          
          // IMPORTANTE: Mesmo carregando dados planejados do localStorage,
          // SEMPRE carregar dados realizados da API (banco de dados)
          // Não fazer return aqui, continuar para carregar dados realizados
        } catch (error) {
          console.error('Erro ao carregar dados do localStorage:', error);
        }
      }
      
      // Fallback: Se não houver dados no localStorage, usar dados da API
      // Tentar distribuir por período se os dados tiverem informações de período
      const newData: SpendingPlanData = {
        DIARIO: { receitas: [], despesas: [] },
        SEMANAL: { receitas: [], despesas: [] },
        MENSAL: { receitas: [], despesas: [] },
        ANUAL: { receitas: [], despesas: [] },
      };
      
      // Verificar se os dados têm campos de período (year, month, etc.)
      const receitasFromAPI = data.receitas || [];
      const despesasFromAPI = data.despesas || [];
      
      // Se os dados têm campos de período, distribuir corretamente
      receitasFromAPI.forEach((entry: any) => {
        // Se tiver month, pode ser DIARIO, SEMANAL ou MENSAL
        if (entry.month !== undefined) {
          if (entry.dayOfWeek !== undefined) {
            newData.DIARIO.receitas.push(entry as SpendingEntryWithSource);
          } else if (entry.week !== undefined) {
            newData.SEMANAL.receitas.push(entry as SpendingEntryWithSource);
          } else {
            newData.MENSAL.receitas.push(entry as SpendingEntryWithSource);
          }
        } else if (entry.year !== undefined && entry.month === undefined) {
          // Se só tem year, é ANUAL
          newData.ANUAL.receitas.push(entry as SpendingEntryWithSource);
        } else {
          // Fallback: sem informações de período, colocar em MENSAL
          newData.MENSAL.receitas.push(entry as SpendingEntryWithSource);
        }
      });
      
      despesasFromAPI.forEach((entry: any) => {
        // Se tiver month, pode ser DIARIO, SEMANAL ou MENSAL
        if (entry.month !== undefined) {
          if (entry.dayOfWeek !== undefined) {
            newData.DIARIO.despesas.push(entry as SpendingEntryWithSource);
          } else if (entry.week !== undefined) {
            newData.SEMANAL.despesas.push(entry as SpendingEntryWithSource);
          } else {
            newData.MENSAL.despesas.push(entry as SpendingEntryWithSource);
          }
        } else if (entry.year !== undefined && entry.month === undefined) {
          // Se só tem year, é ANUAL
          newData.ANUAL.despesas.push(entry as SpendingEntryWithSource);
        } else {
          // Fallback: sem informações de período, colocar em MENSAL
          newData.MENSAL.despesas.push(entry as SpendingEntryWithSource);
        }
      });
      
      setPlanData(newData);
      
      // Carregar dados realizados da API (sempre, mesmo que vazios, para sincronizar com banco)
      const receitasReaisFromAPI = (data as any).receitasReais !== undefined 
        ? ((data as any).receitasReais || [])
        : [];
      const despesasReaisFromAPI = (data as any).despesasReais !== undefined 
        ? ((data as any).despesasReais || [])
        : [];
      
      console.log('🟣 [Frontend] Dados recebidos da API:', {
        receitasCount: receitasFromAPI.length,
        despesasCount: despesasFromAPI.length,
        receitasReaisCount: receitasReaisFromAPI.length,
        despesasReaisCount: despesasReaisFromAPI.length,
        receitasReaisExists: (data as any).receitasReais !== undefined,
        despesasReaisExists: (data as any).despesasReais !== undefined,
        dataKeys: Object.keys(data || {}),
      });
      
      // SEMPRE carregar dados realizados da API (mesmo que vazios) para garantir sincronização
      // Isso garante que sempre temos os dados mais recentes do banco
      console.log('🟣 [Frontend] Carregando dados realizados no estado local (sempre da API)...');
      const newRealData: SpendingPlanData = {
          DIARIO: { receitas: [], despesas: [] },
          SEMANAL: { receitas: [], despesas: [] },
          MENSAL: { receitas: [], despesas: [] },
          ANUAL: { receitas: [], despesas: [] },
        };
        
        // Distribuir receitas realizadas por período
        console.log('🟣 [Frontend] Distribuindo receitas realizadas:', receitasReaisFromAPI.length);
        receitasReaisFromAPI.forEach((entry: any, index: number) => {
          if (index < 3) {
            console.log(`🟣 [Frontend] Receita ${index}:`, {
              id: entry.id,
              month: entry.month,
              week: entry.week,
              dayOfWeek: entry.dayOfWeek,
              year: entry.year,
              period: entry.period,
            });
          }
          
          // Verificar se tem campo period primeiro (mais confiável)
          if (entry.period) {
            if (entry.period === 'DIARIO') {
              newRealData.DIARIO.receitas.push(entry as SpendingEntryWithSource);
            } else if (entry.period === 'SEMANAL') {
              newRealData.SEMANAL.receitas.push(entry as SpendingEntryWithSource);
            } else if (entry.period === 'MENSAL') {
              newRealData.MENSAL.receitas.push(entry as SpendingEntryWithSource);
            } else if (entry.period === 'ANUAL') {
              newRealData.ANUAL.receitas.push(entry as SpendingEntryWithSource);
            }
          } else if (entry.month !== undefined) {
            if (entry.dayOfWeek !== undefined) {
              newRealData.DIARIO.receitas.push(entry as SpendingEntryWithSource);
            } else if (entry.week !== undefined) {
              newRealData.SEMANAL.receitas.push(entry as SpendingEntryWithSource);
            } else {
              newRealData.MENSAL.receitas.push(entry as SpendingEntryWithSource);
            }
          } else if (entry.year !== undefined && entry.month === undefined) {
            newRealData.ANUAL.receitas.push(entry as SpendingEntryWithSource);
          } else {
            newRealData.MENSAL.receitas.push(entry as SpendingEntryWithSource);
          }
        });
        
        // Distribuir despesas realizadas por período
        console.log('🟣 [Frontend] Distribuindo despesas realizadas:', despesasReaisFromAPI.length);
        despesasReaisFromAPI.forEach((entry: any, index: number) => {
          if (index < 3) {
            console.log(`🟣 [Frontend] Despesa ${index}:`, {
              id: entry.id,
              month: entry.month,
              week: entry.week,
              dayOfWeek: entry.dayOfWeek,
              year: entry.year,
              period: entry.period,
            });
          }
          
          // Verificar se tem campo period primeiro (mais confiável)
          if (entry.period) {
            if (entry.period === 'DIARIO') {
              newRealData.DIARIO.despesas.push(entry as SpendingEntryWithSource);
            } else if (entry.period === 'SEMANAL') {
              newRealData.SEMANAL.despesas.push(entry as SpendingEntryWithSource);
            } else if (entry.period === 'MENSAL') {
              newRealData.MENSAL.despesas.push(entry as SpendingEntryWithSource);
            } else if (entry.period === 'ANUAL') {
              newRealData.ANUAL.despesas.push(entry as SpendingEntryWithSource);
            }
          } else if (entry.month !== undefined) {
            if (entry.dayOfWeek !== undefined) {
              newRealData.DIARIO.despesas.push(entry as SpendingEntryWithSource);
            } else if (entry.week !== undefined) {
              newRealData.SEMANAL.despesas.push(entry as SpendingEntryWithSource);
            } else {
              newRealData.MENSAL.despesas.push(entry as SpendingEntryWithSource);
            }
          } else if (entry.year !== undefined && entry.month === undefined) {
            newRealData.ANUAL.despesas.push(entry as SpendingEntryWithSource);
          } else {
            newRealData.MENSAL.despesas.push(entry as SpendingEntryWithSource);
          }
        });
        
        console.log('🟣 [Frontend] ✅ Distribuição concluída. Resumo:', {
          receitas_DIARIO: newRealData.DIARIO.receitas.length,
          receitas_SEMANAL: newRealData.SEMANAL.receitas.length,
          receitas_MENSAL: newRealData.MENSAL.receitas.length,
          receitas_ANUAL: newRealData.ANUAL.receitas.length,
          despesas_DIARIO: newRealData.DIARIO.despesas.length,
          despesas_SEMANAL: newRealData.SEMANAL.despesas.length,
          despesas_MENSAL: newRealData.MENSAL.despesas.length,
          despesas_ANUAL: newRealData.ANUAL.despesas.length,
        });
        
        console.log('🟣 [Frontend] ⚠️ ANTES de setRealData - Verificando dados:', {
          receitasReaisFromAPI: receitasReaisFromAPI.length,
          despesasReaisFromAPI: despesasReaisFromAPI.length,
          primeiraDespesa: despesasReaisFromAPI[0] || null,
          primeiraDespesaPeriod: despesasReaisFromAPI[0]?.period || 'SEM PERIOD',
        });
        
        setRealData(newRealData);
        
        console.log('🟣 [Frontend] ✅ DEPOIS de setRealData - Dados realizados carregados no estado:', {
          DIARIO_receitas: newRealData.DIARIO.receitas.length,
          DIARIO_despesas: newRealData.DIARIO.despesas.length,
          SEMANAL_receitas: newRealData.SEMANAL.receitas.length,
          SEMANAL_despesas: newRealData.SEMANAL.despesas.length,
          MENSAL_receitas: newRealData.MENSAL.receitas.length,
          MENSAL_despesas: newRealData.MENSAL.despesas.length,
          ANUAL_receitas: newRealData.ANUAL.receitas.length,
          ANUAL_despesas: newRealData.ANUAL.despesas.length,
        });
        
        // Calcular próximo ID real
        const allRealIds = [
          ...receitasReaisFromAPI.map((e: any) => e.id),
          ...despesasReaisFromAPI.map((e: any) => e.id)
        ];
        if (allRealIds.length > 0) {
          const maxRealId = Math.max(10000, ...allRealIds);
          setNextRealId(maxRealId + 1);
      } else {
        // Se não há dados, garantir que nextRealId começa em 10000
        setNextRealId(10000);
      }
      
      // set nextId past the highest
      const allIds = [
        ...receitasFromAPI.map((e: any) => e.id),
        ...despesasFromAPI.map((e: any) => e.id)
      ];
      const maxId = Math.max(0, ...allIds);
      setNextId(maxId + 1);
    }
  }, [data, userId]);

  const addEntry = (type: 'receitas' | 'despesas') => {
    const currentId = nextId;
    const newEntry: SpendingEntryWithSource = { 
      id: currentId, 
      description: '', 
      value: 0,
      isFixed: false,
      sourcePeriod: undefined,
      year: selectedYear,
    };
    
    // Adicionar campos específicos do período baseado na seleção
    if (planningPeriod === 'DIARIO') {
      newEntry.month = selectedMonth;
      newEntry.dayOfWeek = selectedDayOfWeek;
    } else if (planningPeriod === 'SEMANAL') {
      newEntry.month = selectedMonth;
      newEntry.week = selectedWeek;
    } else if (planningPeriod === 'MENSAL') {
      newEntry.month = selectedMonth;
    }
    // ANUAL só precisa do year, que já foi definido
    
    // Se linkPeriods está ativo, propaga apenas para períodos maiores
    if (linkPeriods) {
      propagateEntryToLargerPeriods(newEntry, planningPeriod, type);
    } else {
      // Adiciona apenas no período atual (sem propagação)
      updateEntryInPeriod(newEntry, planningPeriod, type);
    }
    setNextId((id) => id + 1);
  };

  const updateEntry = (
    id: number,
    key: 'description' | 'value' | 'expenseType',
    val: string,
    type: 'receitas' | 'despesas'
  ) => {
    const currentList = planData[planningPeriod][type];
    const entry = currentList.find((e) => e.id === id);
    
    if (!entry) return;
    
    // Se for uma entrada fixa, não permite editar (só pode editar no período de origem)
    if (entry.isFixed && entry.sourcePeriod) {
      // Não permite editar entradas fixas - deve editar no período de origem
      return;
    }
    
    const updatedEntry: SpendingEntryWithSource = {
      ...entry,
      [key]: key === 'value' 
        ? parseFloat(val.replace(',', '.')) || 0 
        : val,
      isFixed: false,
      sourcePeriod: undefined,
    };
    
    // Se linkPeriods está ativo, propaga apenas para períodos maiores
    if (linkPeriods) {
      propagateEntryToLargerPeriods(updatedEntry, planningPeriod, type);
    } else {
      // Atualiza apenas no período atual (sem propagação)
      updateEntryInPeriod(updatedEntry, planningPeriod, type);
    }
  };

  const removeEntry = (id: number, type: 'receitas' | 'despesas') => {
    setPlanData((prev) => {
      // Se linkPeriods está ativo, remove de todos os períodos
      // Se não está, remove apenas do período atual
      if (linkPeriods) {
        return {
          DIARIO: {
            receitas: prev.DIARIO.receitas.filter((e) => e.id !== id),
            despesas: prev.DIARIO.despesas.filter((e) => e.id !== id),
          },
          SEMANAL: {
            receitas: prev.SEMANAL.receitas.filter((e) => e.id !== id),
            despesas: prev.SEMANAL.despesas.filter((e) => e.id !== id),
          },
          MENSAL: {
            receitas: prev.MENSAL.receitas.filter((e) => e.id !== id),
            despesas: prev.MENSAL.despesas.filter((e) => e.id !== id),
          },
          ANUAL: {
            receitas: prev.ANUAL.receitas.filter((e) => e.id !== id),
            despesas: prev.ANUAL.despesas.filter((e) => e.id !== id),
          },
        };
      } else {
        // Remove apenas do período atual
        const newData: SpendingPlanData = {
          DIARIO: {
            receitas: [...prev.DIARIO.receitas],
            despesas: [...prev.DIARIO.despesas],
          },
          SEMANAL: {
            receitas: [...prev.SEMANAL.receitas],
            despesas: [...prev.SEMANAL.despesas],
          },
          MENSAL: {
            receitas: [...prev.MENSAL.receitas],
            despesas: [...prev.MENSAL.despesas],
          },
          ANUAL: {
            receitas: [...prev.ANUAL.receitas],
            despesas: [...prev.ANUAL.despesas],
          },
        };
        newData[planningPeriod][type] = newData[planningPeriod][type].filter((e) => e.id !== id);
        return newData;
      }
    });
  };
  
  // ========== FUNÇÕES PARA DADOS REAIS ==========
  
  // Receitas e despesas reais do período atual filtradas pela seleção específica
  const receitasReais = useMemo(() => {
    const allReceitas = realData[planningPeriod]?.receitas || [];
    console.log('🔴 [Frontend] Filtrando receitas realizadas:', {
      planningPeriod,
      totalNoPeriodo: allReceitas.length,
      selectedYear,
      selectedMonth,
      selectedWeek,
      selectedDayOfWeek,
    });
    
    const filtered = allReceitas.filter((entry) => {
      if (planningPeriod === 'ANUAL') {
        return !entry.year || entry.year === selectedYear;
      } else if (planningPeriod === 'MENSAL') {
        const yearMatch = !entry.year || entry.year === selectedYear;
        const monthMatch = !entry.month || entry.month === selectedMonth;
        return yearMatch && monthMatch;
      } else if (planningPeriod === 'SEMANAL') {
        const yearMatch = !entry.year || entry.year === selectedYear;
        const monthMatch = !entry.month || entry.month === selectedMonth;
        const weekMatch = !entry.week || entry.week === selectedWeek;
        return yearMatch && monthMatch && weekMatch;
      } else if (planningPeriod === 'DIARIO') {
        const yearMatch = !entry.year || entry.year === selectedYear;
        const monthMatch = !entry.month || entry.month === selectedMonth;
        const dayMatch = entry.dayOfWeek === undefined || entry.dayOfWeek === selectedDayOfWeek;
        return yearMatch && monthMatch && dayMatch;
      }
      return true;
    });
    
    console.log('🔴 [Frontend] Receitas realizadas após filtro:', filtered.length, 'de', allReceitas.length);
    if (filtered.length === 0 && allReceitas.length > 0) {
      console.log('🔴 [Frontend] ⚠️ Todas as receitas foram filtradas! Primeira entrada:', allReceitas[0]);
    }
    return filtered;
  }, [
    realData.DIARIO.receitas,
    realData.SEMANAL.receitas,
    realData.MENSAL.receitas,
    realData.ANUAL.receitas,
    planningPeriod,
    selectedYear,
    selectedMonth,
    selectedWeek,
    selectedDayOfWeek
  ]);
  
  const despesasReais = useMemo(() => {
    const allDespesas = realData[planningPeriod]?.despesas || [];
    console.log('🔴 [Frontend] Filtrando despesas realizadas:', {
      planningPeriod,
      totalNoPeriodo: allDespesas.length,
      selectedYear,
      selectedMonth,
      selectedWeek,
      selectedDayOfWeek,
    });
    
    const filtered = allDespesas.filter((entry) => {
      if (planningPeriod === 'ANUAL') {
        return !entry.year || entry.year === selectedYear;
      } else if (planningPeriod === 'MENSAL') {
        const yearMatch = !entry.year || entry.year === selectedYear;
        const monthMatch = !entry.month || entry.month === selectedMonth;
        return yearMatch && monthMatch;
      } else if (planningPeriod === 'SEMANAL') {
        const yearMatch = !entry.year || entry.year === selectedYear;
        const monthMatch = !entry.month || entry.month === selectedMonth;
        const weekMatch = !entry.week || entry.week === selectedWeek;
        return yearMatch && monthMatch && weekMatch;
      } else if (planningPeriod === 'DIARIO') {
        const yearMatch = !entry.year || entry.year === selectedYear;
        const monthMatch = !entry.month || entry.month === selectedMonth;
        const dayMatch = entry.dayOfWeek === undefined || entry.dayOfWeek === selectedDayOfWeek;
        return yearMatch && monthMatch && dayMatch;
      }
      return true;
    });
    
    console.log('🔴 [Frontend] Despesas realizadas após filtro:', filtered.length, 'de', allDespesas.length);
    if (filtered.length === 0 && allDespesas.length > 0) {
      console.log('🔴 [Frontend] ⚠️ Todas as despesas foram filtradas! Primeira entrada:', allDespesas[0]);
    }
    return filtered;
  }, [
    realData.DIARIO.despesas,
    realData.SEMANAL.despesas,
    realData.MENSAL.despesas,
    realData.ANUAL.despesas,
    planningPeriod,
    selectedYear,
    selectedMonth,
    selectedWeek,
    selectedDayOfWeek
  ]);
  
  // Arrays estáveis para drag and drop planejado - usando useMemo e refs para evitar recálculos durante drag
  const stableReceitasPlanejadas = useMemo(() => {
    // Se estiver arrastando, usar o ref em vez de recalcular
    if (isDraggingRef.current) {
      console.log('🔄 [DragDrop] Drag ativo, usando ref para receitas planejadas');
      return stableReceitasPlanejadasRef.current;
    }
    
    const filtered = receitas.filter(e => {
      const isValid = e && e.id;
      if (!isValid) {
        console.warn('⚠️ [DragDrop] Receita planejada inválida encontrada:', e);
      }
      return isValid;
    });
    
    // Verificar IDs duplicados
    const ids = filtered.map(e => e.id);
    const duplicados = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicados.length > 0) {
      console.error('❌ [DragDrop] IDs duplicados em receitas planejadas:', duplicados);
    }
    
    // Atualizar ref
    stableReceitasPlanejadasRef.current = filtered;
    return filtered;
  }, [receitas]);
  
  const stableDespesasPlanejadas = useMemo(() => {
    // Se estiver arrastando, usar o ref em vez de recalcular
    if (isDraggingRef.current) {
      console.log('🔄 [DragDrop] Drag ativo, usando ref para despesas planejadas');
      return stableDespesasPlanejadasRef.current;
    }
    
    const filtered = despesas.filter(e => {
      const isValid = e && e.id;
      if (!isValid) {
        console.warn('⚠️ [DragDrop] Despesa planejada inválida encontrada:', e);
      }
      return isValid;
    });
    
    // Verificar IDs duplicados
    const ids = filtered.map(e => e.id);
    const duplicados = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicados.length > 0) {
      console.error('❌ [DragDrop] IDs duplicados em despesas planejadas:', duplicados);
    }
    
    // Atualizar ref
    stableDespesasPlanejadasRef.current = filtered;
    return filtered;
  }, [despesas]);
  
  // Arrays estáveis para drag and drop - usando useMemo e refs para evitar recálculos durante drag
  const stableReceitasReais = useMemo(() => {
    // Se estiver arrastando, usar o ref em vez de recalcular
    if (isDraggingRef.current) {
      console.log('🔄 [DragDrop] Drag ativo, usando ref para receitas');
      return stableReceitasRef.current;
    }
    
    const filtered = receitasReais.filter(e => {
      const isValid = e && e.id;
      if (!isValid) {
        console.warn('⚠️ [DragDrop] Receita inválida encontrada:', e);
      }
      return isValid;
    });
    
    // Verificar IDs duplicados
    const ids = filtered.map(e => e.id);
    const duplicados = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicados.length > 0) {
      console.error('❌ [DragDrop] IDs duplicados em receitas:', duplicados);
    }
    
    console.log('🔄 [DragDrop] Calculando receitas estáveis:', {
      original: receitasReais.length,
      filtered: filtered.length,
      ids: ids,
      draggableIds: ids.map(id => `receita-${String(id)}`)
    });
    
    // Atualizar ref
    stableReceitasRef.current = filtered;
    return filtered;
  }, [receitasReais]);
  
  const stableDespesasReais = useMemo(() => {
    // Se estiver arrastando, usar o ref em vez de recalcular
    if (isDraggingRef.current) {
      console.log('🔄 [DragDrop] Drag ativo, usando ref para despesas');
      return stableDespesasRef.current;
    }
    
    const filtered = despesasReais.filter(e => {
      const isValid = e && e.id;
      if (!isValid) {
        console.warn('⚠️ [DragDrop] Despesa inválida encontrada:', e);
      }
      return isValid;
    });
    
    // Verificar IDs duplicados
    const ids = filtered.map(e => e.id);
    const duplicados = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicados.length > 0) {
      console.error('❌ [DragDrop] IDs duplicados em despesas:', duplicados);
    }
    
    console.log('🔄 [DragDrop] Calculando despesas estáveis:', {
      original: despesasReais.length,
      filtered: filtered.length,
      ids: ids,
      draggableIds: ids.map(id => `despesa-${String(id)}`)
    });
    
    // Atualizar ref
    stableDespesasRef.current = filtered;
    return filtered;
  }, [despesasReais]);
  
  // Função para adicionar entrada real
  const addRealEntry = (type: 'receitas' | 'despesas') => {
    const currentId = nextRealId;
    const newEntry: SpendingEntryWithSource = { 
      id: currentId, 
      description: '', 
      value: 0,
      isFixed: false,
      sourcePeriod: undefined,
      year: selectedYear,
    };
    
    // Adicionar campos específicos do período baseado na seleção
    if (planningPeriod === 'DIARIO') {
      newEntry.month = selectedMonth;
      newEntry.dayOfWeek = selectedDayOfWeek;
    } else if (planningPeriod === 'SEMANAL') {
      newEntry.month = selectedMonth;
      newEntry.week = selectedWeek;
    } else if (planningPeriod === 'MENSAL') {
      newEntry.month = selectedMonth;
    }
    
    updateRealEntryInPeriod(newEntry, planningPeriod, type);
    setNextRealId((id) => id + 1);
  };
  
  // Função para atualizar entrada real
  const updateRealEntry = (
    id: number,
    key: 'description' | 'value' | 'expenseType',
    val: string,
    type: 'receitas' | 'despesas'
  ) => {
    const currentList = realData[planningPeriod][type];
    const entry = currentList.find((e) => e.id === id);
    
    if (!entry) return;
    
    const updatedEntry: SpendingEntryWithSource = {
      ...entry,
      [key]: key === 'value' 
        ? parseFloat(val.replace(',', '.')) || 0 
        : val,
    };
    
    updateRealEntryInPeriod(updatedEntry, planningPeriod, type);
  };
  
  // Função para atualizar entrada real no período
  const updateRealEntryInPeriod = (
    entry: SpendingEntryWithSource,
    period: PlanningPeriod,
    type: 'receitas' | 'despesas'
  ) => {
    setRealData((prev) => {
      const newData: SpendingPlanData = {
        DIARIO: {
          receitas: [...prev.DIARIO.receitas],
          despesas: [...prev.DIARIO.despesas],
        },
        SEMANAL: {
          receitas: [...prev.SEMANAL.receitas],
          despesas: [...prev.SEMANAL.despesas],
        },
        MENSAL: {
          receitas: [...prev.MENSAL.receitas],
          despesas: [...prev.MENSAL.despesas],
        },
        ANUAL: {
          receitas: [...prev.ANUAL.receitas],
          despesas: [...prev.ANUAL.despesas],
        },
      };
      
      const existingIndex = newData[period][type].findIndex((e) => e.id === entry.id);
      if (existingIndex >= 0) {
        newData[period][type] = newData[period][type].map((e) =>
          e.id === entry.id ? entry : e
        );
      } else {
        newData[period][type] = [entry, ...newData[period][type]];
      }
      
      return newData;
    });
  };
  
  // Função para remover entrada real
  const removeRealEntry = (id: number, type: 'receitas' | 'despesas') => {
    setRealData((prev) => {
      const newData: SpendingPlanData = {
        DIARIO: {
          receitas: [...prev.DIARIO.receitas],
          despesas: [...prev.DIARIO.despesas],
        },
        SEMANAL: {
          receitas: [...prev.SEMANAL.receitas],
          despesas: [...prev.SEMANAL.despesas],
        },
        MENSAL: {
          receitas: [...prev.MENSAL.receitas],
          despesas: [...prev.MENSAL.despesas],
        },
        ANUAL: {
          receitas: [...prev.ANUAL.receitas],
          despesas: [...prev.ANUAL.despesas],
        },
      };
      newData[planningPeriod][type] = newData[planningPeriod][type].filter((e) => e.id !== id);
      return newData;
    });
  };

  // Função para reordenar entradas reais (drag and drop)
  const reorderRealEntries = useCallback((result: DropResult) => {
    console.log('🎯 [DragDrop] onDragEnd chamado:', {
      result,
      draggableId: result.draggableId,
      source: result.source,
      destination: result.destination,
    });
    
    if (!result.destination) {
      console.log('❌ [DragDrop] Sem destino, cancelando');
      return;
    }
    
    if (result.source.index === result.destination.index) {
      console.log('❌ [DragDrop] Mesma posição, cancelando');
      return;
    }
    
    if (result.source.droppableId !== result.destination.droppableId) {
      console.log('❌ [DragDrop] Droppable diferente, cancelando');
      return;
    }

    const { source, destination, draggableId } = result;
    const type = draggableId.startsWith('receita-') ? 'receitas' : 'despesas';
    
    console.log('✅ [DragDrop] Processando reordenação:', {
      type,
      draggableId,
      sourceIndex: source.index,
      destinationIndex: destination.index,
      planningPeriod
    });
    
    // Reordenar diretamente no estado
    setRealData((prev) => {
      const newData: SpendingPlanData = {
        DIARIO: {
          receitas: [...prev.DIARIO.receitas],
          despesas: [...prev.DIARIO.despesas],
        },
        SEMANAL: {
          receitas: [...prev.SEMANAL.receitas],
          despesas: [...prev.SEMANAL.despesas],
        },
        MENSAL: {
          receitas: [...prev.MENSAL.receitas],
          despesas: [...prev.MENSAL.despesas],
        },
        ANUAL: {
          receitas: [...prev.ANUAL.receitas],
          despesas: [...prev.ANUAL.despesas],
        },
      };

      // Obter lista do período atual e criar uma cópia
      const periodList = [...newData[planningPeriod][type]];
      
      // Verificar se os índices são válidos
      if (source.index >= periodList.length || destination.index >= periodList.length) {
        console.warn('❌ [DragDrop] Índices inválidos:', {
          sourceIndex: source.index,
          destinationIndex: destination.index,
          listLength: periodList.length
        });
        return prev;
      }
      
      // Reordenar o array
      const [removed] = periodList.splice(source.index, 1);
      periodList.splice(destination.index, 0, removed);
      
      // Atualizar a lista no período
      newData[planningPeriod][type] = periodList;
      
      console.log('✅ [DragDrop] Reordenação concluída:', {
        type,
        newOrder: periodList.map((e, idx) => ({ index: idx, id: e.id, description: e.description }))
      });
      
      return newData;
    });
  }, [planningPeriod]);

  // Função para reordenar entradas planejadas (drag and drop)
  const reorderPlannedEntries = useCallback((result: DropResult) => {
    console.log('🎯 [DragDrop] onDragEnd chamado (planejado):', {
      result,
      draggableId: result.draggableId,
      source: result.source,
      destination: result.destination,
    });
    
    if (!result.destination) {
      console.log('❌ [DragDrop] Sem destino, cancelando');
      return;
    }
    
    if (result.source.index === result.destination.index) {
      console.log('❌ [DragDrop] Mesma posição, cancelando');
      return;
    }
    
    if (result.source.droppableId !== result.destination.droppableId) {
      console.log('❌ [DragDrop] Droppable diferente, cancelando');
      return;
    }

    const { source, destination, draggableId } = result;
    const type = draggableId.startsWith('receita-planejada-') ? 'receitas' : 'despesas';
    
    console.log('✅ [DragDrop] Processando reordenação planejada:', {
      type,
      draggableId,
      sourceIndex: source.index,
      destinationIndex: destination.index,
      planningPeriod
    });
    
    // Reordenar diretamente no estado
    setPlanData((prev) => {
      const newData: SpendingPlanData = {
        DIARIO: {
          receitas: [...prev.DIARIO.receitas],
          despesas: [...prev.DIARIO.despesas],
        },
        SEMANAL: {
          receitas: [...prev.SEMANAL.receitas],
          despesas: [...prev.SEMANAL.despesas],
        },
        MENSAL: {
          receitas: [...prev.MENSAL.receitas],
          despesas: [...prev.MENSAL.despesas],
        },
        ANUAL: {
          receitas: [...prev.ANUAL.receitas],
          despesas: [...prev.ANUAL.despesas],
        },
      };

      // Obter lista do período atual e criar uma cópia
      const periodList = [...newData[planningPeriod][type]];
      
      // Verificar se os índices são válidos
      if (source.index >= periodList.length || destination.index >= periodList.length) {
        console.warn('❌ [DragDrop] Índices inválidos:', {
          sourceIndex: source.index,
          destinationIndex: destination.index,
          listLength: periodList.length
        });
        return prev;
      }
      
      // Reordenar o array
      const [removed] = periodList.splice(source.index, 1);
      periodList.splice(destination.index, 0, removed);
      
      // Atualizar a lista no período
      newData[planningPeriod][type] = periodList;
      
      console.log('✅ [DragDrop] Reordenação planejada concluída:', {
        type,
        newOrder: periodList.map((e, idx) => ({ index: idx, id: e.id, description: e.description }))
      });
      
      return newData;
    });
  }, [planningPeriod]);

  // Funções para gerenciar tipos de gastos
  const addExpenseType = async () => {
    if (newExpenseType.trim() && !expenseTypes.includes(newExpenseType.trim())) {
      try {
        await createExpenseType({ name: newExpenseType.trim() }).unwrap();
        setNewExpenseType('');
        dispatch(sendSuccess('Tipo de gasto criado com sucesso!'));
      } catch (error: any) {
        console.error('Erro ao criar tipo:', error);
        const message = error?.data?.error || 'Erro ao criar tipo de gasto';
        dispatch(sendError(message));
      }
    }
  };

  const removeExpenseType = async (index: number) => {
    const expenseTypeToRemove = expenseTypesData?.[index];
    if (!expenseTypeToRemove) return;
    
    // Não permitir remover tipos padrão
    if (expenseTypeToRemove.isDefault) {
      dispatch(sendError('Não é possível remover tipos padrão do sistema'));
      return;
    }

    try {
      await deleteExpenseType(expenseTypeToRemove.id).unwrap();
      dispatch(sendSuccess('Tipo de gasto removido com sucesso!'));
    } catch (error: any) {
      console.error('Erro ao remover tipo:', error);
      const message = error?.data?.error || 'Erro ao remover tipo de gasto';
      dispatch(sendError(message));
    }
  };

  // Funções para análise de dados e gráficos
  const getChartDataByType = (entries: SpendingEntryWithSource[]) => {
    const typeMap: { [key: string]: number } = {};
    
    entries.forEach(entry => {
      const type = entry.expenseType || 'Sem tipo';
      const value = typeof entry.value === 'number' ? entry.value : 0;
      typeMap[type] = (typeMap[type] || 0) + value;
    });

    return Object.entries(typeMap)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  };

  // Função para obter dados detalhados (descrições) de um tipo específico
  const getDetailDataByType = (entries: SpendingEntryWithSource[], expenseType: string) => {
    const filteredEntries = entries.filter(entry => (entry.expenseType || 'Sem tipo') === expenseType);
    
    const descriptionMap: { [key: string]: number } = {};
    
    filteredEntries.forEach(entry => {
      const description = entry.description || 'Sem descrição';
      const value = typeof entry.value === 'number' ? entry.value : 0;
      descriptionMap[description] = (descriptionMap[description] || 0) + value;
    });

    return Object.entries(descriptionMap)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Ordenar por valor decrescente
  };

  const getRandomColor = (index: number) => {
    const colors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1',
      '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98',
      '#f0e68c', '#ff6347', '#40e0d0', '#ee82ee', '#90ee90'
    ];
    return colors[index % colors.length];
  };

  const renderPieChart = (data: { name: string; value: number }[], color: string, onCellClick?: (name: string) => void) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onClick={(data: any) => {
              if (onCellClick && data?.name) {
                onCellClick(data.name);
              }
            }}
            style={{ cursor: onCellClick ? 'pointer' : 'default' }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getRandomColor(index)} />
            ))}
          </Pie>
          <RechartsTooltip 
            formatter={(value: number) => [
              `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              'Valor'
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderBarChart = (data: { name: string; value: number }[], color: string, onBarClick?: (name: string) => void) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
          />
          <YAxis 
            tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
            fontSize={12}
          />
          <RechartsTooltip 
            formatter={(value: number) => [
              `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              'Valor'
            ]}
          />
          <Bar 
            dataKey="value" 
            fill={color}
            onClick={(data: any) => {
              if (onBarClick && data && data.name) {
                onBarClick(data.name);
              }
            }}
            style={{ cursor: onBarClick ? 'pointer' : 'default' }}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderExpenseChart = (data: { name: string; value: number }[], color: string, onCellClick?: (name: string) => void) => {
    if (data.length === 0) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          flexDirection: 'column',
          color: 'text.secondary'
        }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Sem dados
          </Typography>
          <Typography variant="body2">
            Nenhum registro encontrado para este período
          </Typography>
        </Box>
      );
    }

    return chartType === 'pie' ? renderPieChart(data, color, onCellClick) : renderBarChart(data, color, onCellClick);
  };

  // Funções para importação de CSV e PDF
  const processCSV = async (file: File): Promise<Array<{ description: string; value: number }>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('Arquivo CSV vazio ou sem dados'));
            return;
          }
          
          // Detectar separador (vírgula ou ponto e vírgula)
          const separator = text.includes(';') ? ';' : ',';
          
          // Ler cabeçalho
          const headerLine = lines[0].toLowerCase();
          const headers = headerLine.split(separator).map(h => h.trim().replace(/"/g, ''));
          
          // Procurar índices das colunas (suporta formato Nubank: date,title,amount)
          let titleIndex = -1;
          let amountIndex = -1;
          
          headers.forEach((header, index) => {
            if (header === 'title' || header === 'descrição' || header === 'description' || header === 'descricao') {
              titleIndex = index;
            }
            if (header === 'amount' || header === 'valor' || header === 'value') {
              amountIndex = index;
            }
          });
          
          // Se não encontrou pelos nomes, tentar heurística
          if (titleIndex === -1 || amountIndex === -1) {
            // Formato Nubank: date,title,amount (índices 0,1,2)
            if (headers.length >= 3) {
              titleIndex = 1; // title é geralmente a segunda coluna
              amountIndex = 2; // amount é geralmente a terceira coluna
            } else if (headers.length === 2) {
              // Formato simples: descrição, valor
              titleIndex = 0;
              amountIndex = 1;
            }
          }
          
          if (titleIndex === -1 || amountIndex === -1) {
            reject(new Error('Não foi possível identificar as colunas de descrição e valor no CSV'));
            return;
          }
          
          const transactions: Array<{ description: string; value: number }> = [];
          
          // Processar linhas de dados (pular cabeçalho)
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Dividir linha respeitando aspas (caso haja vírgulas dentro de campos)
            const columns: string[] = [];
            let currentCol = '';
            let insideQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
              const char = line[j];
              
              if (char === '"') {
                insideQuotes = !insideQuotes;
              } else if ((char === separator || char === ';') && !insideQuotes) {
                columns.push(currentCol.trim());
                currentCol = '';
              } else {
                currentCol += char;
              }
            }
            columns.push(currentCol.trim()); // Última coluna
            
            if (columns.length <= Math.max(titleIndex, amountIndex)) {
              continue; // Linha não tem colunas suficientes
            }
            
            const description = columns[titleIndex]?.replace(/^"|"$/g, '').trim() || '';
            const amountStr = columns[amountIndex]?.replace(/^"|"$/g, '').trim() || '';
            
            if (!description) continue;
            
            // Processar valor: formato pode ser com ponto (57.87) ou vírgula (57,87)
            // Formato Nubank usa ponto como separador decimal
            let value = 0;
            
            // Remover espaços e caracteres não numéricos exceto ponto, vírgula e sinal negativo
            const cleanAmount = amountStr.replace(/[^\d.,-]/g, '');
            
            // Detectar formato: se tem vírgula, provavelmente é formato brasileiro (57,87)
            // Se tem apenas ponto, pode ser formato americano (57.87) ou milhar (1.234,56)
            if (cleanAmount.includes(',') && cleanAmount.includes('.')) {
              // Formato brasileiro: 1.234,56 (ponto é milhar, vírgula é decimal)
              const parts = cleanAmount.split(',');
              const integerPart = parts[0].replace(/\./g, '');
              const decimalPart = parts[1] || '0';
              value = parseFloat(`${integerPart}.${decimalPart}`) || 0;
            } else if (cleanAmount.includes(',')) {
              // Apenas vírgula: formato brasileiro simples (57,87)
              value = parseFloat(cleanAmount.replace(',', '.')) || 0;
            } else {
              // Apenas ponto ou sem separador: formato americano (57.87) ou número inteiro
              value = parseFloat(cleanAmount) || 0;
            }
            
            // Converter valor negativo para positivo (despesas são sempre positivas)
            value = Math.abs(value);
            
            if (description && value > 0) {
              transactions.push({ description, value });
            }
          }
          
          if (transactions.length === 0) {
            reject(new Error('Nenhuma transação válida encontrada no arquivo'));
            return;
          }
          
          resolve(transactions);
        } catch (error: any) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
  };

  const processPDF = async (file: File): Promise<Array<{ description: string; value: number }>> => {
    try {
      // Importação dinâmica do pdfjs-dist
      const pdfjsLib = await import('pdfjs-dist');
      
      // Configurar worker usando CDN (mais confiável)
      if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
        // Usar versão específica ou detectar automaticamente
        const version = pdfjsLib.version || '3.11.174';
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
      }
      
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      // Extrair texto de todas as páginas
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      return parsePDFText(fullText);
    } catch (error: any) {
      console.error('Erro ao processar PDF:', error);
      
      if (error.message?.includes('Cannot find module') || error.message?.includes('Failed to resolve')) {
        throw new Error('Biblioteca pdfjs-dist não encontrada. Execute: npm install pdfjs-dist');
      }
      
      throw new Error(error.message || 'Erro ao processar PDF. Certifique-se de que o arquivo é um PDF válido.');
    }
  };

  const parsePDFText = (text: string): Array<{ description: string; value: number }> => {
    const transactions: Array<{ description: string; value: number }> = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    // Padrões comuns em extratos de cartão de crédito
    // Formato típico: DATA | DESCRIÇÃO | VALOR
    // ou: DESCRIÇÃO | VALOR | DATA
    
    lines.forEach((line) => {
      // Remover múltiplos espaços
      const cleanLine = line.replace(/\s+/g, ' ').trim();
      
      // Procurar por valores monetários (R$ 123,45 ou 123,45)
      const valuePattern = /(?:R\$\s*)?([\d.,]+)/g;
      const valueMatches = [...cleanLine.matchAll(valuePattern)];
      
      if (valueMatches.length > 0) {
        // Pegar o último valor encontrado (geralmente é o valor da transação)
        const lastMatch = valueMatches[valueMatches.length - 1];
        const valueStr = lastMatch[1].replace(/\./g, '').replace(',', '.');
        const value = parseFloat(valueStr) || 0;
        
        if (value > 0) {
          // Remover o valor da linha para obter a descrição
          let description = cleanLine.replace(valuePattern, '').trim();
          
          // Remover datas comuns (DD/MM/YYYY ou DD/MM/YY)
          description = description.replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/g, '').trim();
          
          // Remover múltiplos espaços novamente
          description = description.replace(/\s+/g, ' ').trim();
          
          // Converter valor negativo para positivo
          const finalValue = Math.abs(value);
          
          if (description && finalValue > 0) {
            transactions.push({ description, value: finalValue });
          }
        }
      }
    });
    
    // Remover duplicatas
    const uniqueTransactions = transactions.filter((t, index, self) =>
      index === self.findIndex((tr) => tr.description === t.description && tr.value === t.value)
    );
    
    return uniqueTransactions;
  };

  const handleFileImport = async (file: File, fileType: 'csv' | 'pdf') => {
    setIsImporting(true);
    try {
      let data: Array<{ description: string; value: number }>;
      
      if (fileType === 'csv') {
        data = await processCSV(file);
      } else {
        data = await processPDF(file);
      }
      
      if (data.length === 0) {
        dispatch(sendError('Nenhuma transação encontrada no arquivo. Verifique o formato.'));
        setIsImporting(false);
        return;
      }
      
      setImportedData(data);
      setShowImportDialog(true);
      dispatch(sendSuccess(`${data.length} transações importadas com sucesso!`));
    } catch (error: any) {
      console.error('Erro ao importar arquivo:', error);
      dispatch(sendError(error.message || 'Erro ao processar arquivo. Verifique o formato.'));
    } finally {
      setIsImporting(false);
    }
  };

  const applyImportedData = (isRealized: boolean = false) => {
    if (importedData.length === 0) return;
    
    const currentId = isRealized ? nextRealId : nextId;
    const newEntries: SpendingEntryWithSource[] = importedData.map((item, index) => {
      const entry: SpendingEntryWithSource = {
        id: currentId + index,
        description: item.description,
        value: item.value,
        isFixed: false,
        sourcePeriod: undefined,
        year: selectedYear,
      };
      
      // Adicionar campos específicos do período
      if (planningPeriod === 'DIARIO') {
        entry.month = selectedMonth;
        entry.dayOfWeek = selectedDayOfWeek;
      } else if (planningPeriod === 'SEMANAL') {
        entry.month = selectedMonth;
        entry.week = selectedWeek;
      } else if (planningPeriod === 'MENSAL') {
        entry.month = selectedMonth;
      }
      
      return entry;
    });
    
    if (isRealized) {
      setRealData((prev) => {
        const newData = { ...prev };
        newData[planningPeriod].despesas = [
          ...newData[planningPeriod].despesas,
          ...newEntries,
        ];
        return newData;
      });
      setNextRealId((prev) => prev + importedData.length);
    } else {
      setPlanData((prev) => {
        const newData = { ...prev };
        newData[planningPeriod].despesas = [
          ...newData[planningPeriod].despesas,
          ...newEntries,
        ];
        return newData;
      });
      setNextId((prev) => prev + importedData.length);
    }
    
    setShowImportDialog(false);
    setImportedData([]);
    dispatch(sendSuccess(`${importedData.length} despesas adicionadas com sucesso!`));
  };
  
  // Função para copiar dados do planejado para o realizado
  const copyPlannedToReal = () => {
    setRealData((prev) => {
      const newData: SpendingPlanData = {
        DIARIO: {
          receitas: [...prev.DIARIO.receitas],
          despesas: [...prev.DIARIO.despesas],
        },
        SEMANAL: {
          receitas: [...prev.SEMANAL.receitas],
          despesas: [...prev.SEMANAL.despesas],
        },
        MENSAL: {
          receitas: [...prev.MENSAL.receitas],
          despesas: [...prev.MENSAL.despesas],
        },
        ANUAL: {
          receitas: [...prev.ANUAL.receitas],
          despesas: [...prev.ANUAL.despesas],
        },
      };
      
      // Copiar receitas e despesas do planejado para o realizado no período atual
      const plannedReceitas = receitas.filter((e) => !e.isFixed);
      const plannedDespesas = despesas.filter((e) => !e.isFixed);
      
      // Remover entradas existentes do período atual que correspondem ao período selecionado
      newData[planningPeriod].receitas = newData[planningPeriod].receitas.filter((e) => {
        if (planningPeriod === 'ANUAL') {
          return !e.year || e.year !== selectedYear;
        } else if (planningPeriod === 'MENSAL') {
          return !e.year || e.year !== selectedYear || !e.month || e.month !== selectedMonth;
        } else if (planningPeriod === 'SEMANAL') {
          return !e.year || e.year !== selectedYear || !e.month || e.month !== selectedMonth || !e.week || e.week !== selectedWeek;
        } else if (planningPeriod === 'DIARIO') {
          return !e.year || e.year !== selectedYear || !e.month || e.month !== selectedMonth || e.dayOfWeek === undefined || e.dayOfWeek !== selectedDayOfWeek;
        }
        return true;
      });
      
      newData[planningPeriod].despesas = newData[planningPeriod].despesas.filter((e) => {
        if (planningPeriod === 'ANUAL') {
          return !e.year || e.year !== selectedYear;
        } else if (planningPeriod === 'MENSAL') {
          return !e.year || e.year !== selectedYear || !e.month || e.month !== selectedMonth;
        } else if (planningPeriod === 'SEMANAL') {
          return !e.year || e.year !== selectedYear || !e.month || e.month !== selectedMonth || !e.week || e.week !== selectedWeek;
        } else if (planningPeriod === 'DIARIO') {
          return !e.year || e.year !== selectedYear || !e.month || e.month !== selectedMonth || e.dayOfWeek === undefined || e.dayOfWeek !== selectedDayOfWeek;
        }
        return true;
      });
      
      // Adicionar cópias das entradas planejadas
      let currentRealId = nextRealId;
      plannedReceitas.forEach((entry) => {
        const copiedEntry: SpendingEntryWithSource = {
          ...entry,
          id: currentRealId++,
          isFixed: false,
          sourcePeriod: undefined,
        };
        newData[planningPeriod].receitas.push(copiedEntry);
      });
      
      plannedDespesas.forEach((entry) => {
        const copiedEntry: SpendingEntryWithSource = {
          ...entry,
          id: currentRealId++,
          isFixed: false,
          sourcePeriod: undefined,
        };
        newData[planningPeriod].despesas.push(copiedEntry);
      });
      
      if (plannedReceitas.length > 0 || plannedDespesas.length > 0) {
        setNextRealId(currentRealId);
      }
      
      return newData;
    });
  };

  const total = (list: SpendingEntryWithSource[]) => list.reduce((s, e) => s + e.value, 0);

  // Função para salvar apenas dados PLANEJADOS
  const handleSavePlanejado = async () => {
    try {
      const allReceitas: Array<SpendingEntry & { period?: PlanningPeriod }> = [];
      const allDespesas: Array<SpendingEntry & { period?: PlanningPeriod }> = [];
      
      const periods: PlanningPeriod[] = ['DIARIO', 'SEMANAL', 'MENSAL', 'ANUAL'];
      periods.forEach((period) => {
        planData[period].receitas
          .filter((e) => !e.isFixed)
          .forEach((entry) => {
            const { id, description, value, expenseType, year, month, week, dayOfWeek } = entry;
            allReceitas.push({ 
              id, 
              description, 
              value, 
              expenseType,
              period,
              year,
              month,
              week,
              dayOfWeek,
            }); 
          });
        
        planData[period].despesas
          .filter((e) => !e.isFixed)
          .forEach((entry) => {
            const { id, description, value, expenseType, year, month, week, dayOfWeek } = entry;
            allDespesas.push({ 
              id, 
              description, 
              value, 
              expenseType,
              period,
              year,
              month,
              week,
              dayOfWeek,
            }); 
          });
      });
      
      const receitasToSave: SpendingEntry[] = allReceitas.map(({ id, description, value, expenseType, year, month, week, dayOfWeek }) => ({
        id,
        description,
        value,
        expenseType,
        year,
        month,
        week,
        dayOfWeek,
      }));
      const despesasToSave: SpendingEntry[] = allDespesas.map(({ id, description, value, expenseType, year, month, week, dayOfWeek }) => ({
        id,
        description,
        value,
        expenseType,
        year,
        month,
        week,
        dayOfWeek,
      }));

      // Coletar dados realizados do estado local (realData) para garantir que temos os dados mais recentes
      const allReceitasReais: any[] = [];
      const allDespesasReais: any[] = [];
      
      periods.forEach((period) => {
        realData[period].receitas
          .filter((e) => !e.isFixed)
          .forEach((entry) => {
            const { id, description, value, expenseType, year, month, week, dayOfWeek } = entry;
            allReceitasReais.push({ 
              id, 
              description, 
              value, 
              expenseType,
              period,
              year,
              month,
              week,
              dayOfWeek,
            }); 
          });
        
        realData[period].despesas
          .filter((e) => !e.isFixed)
          .forEach((entry) => {
            const { id, description, value, expenseType, year, month, week, dayOfWeek } = entry;
            allDespesasReais.push({ 
              id, 
              description, 
              value, 
              expenseType,
              period,
              year,
              month,
              week,
              dayOfWeek,
            }); 
          });
      });
      
      const receitasReaisToSave: SpendingEntry[] = allReceitasReais.map(({ id, description, value, expenseType, period, year, month, week, dayOfWeek }) => ({
        id,
        description,
        value,
        expenseType,
        period, // ← INCLUIR O PERÍODO para facilitar distribuição ao carregar
        year,
        month,
        week,
        dayOfWeek,
      }));
      const despesasReaisToSave: SpendingEntry[] = allDespesasReais.map(({ id, description, value, expenseType, period, year, month, week, dayOfWeek }) => ({
        id,
        description,
        value,
        expenseType,
        period, // ← INCLUIR O PERÍODO para facilitar distribuição ao carregar
        year,
        month,
        week,
        dayOfWeek,
      }));

      await savePlan({ 
        userId, 
        receitas: receitasToSave, 
        despesas: despesasToSave,
        receitasReais: receitasReaisToSave,
        despesasReais: despesasReaisToSave
      }).unwrap();
      
      // Recarregar os dados após salvar
      await refetchSpendingPlan();
      
      // Salvar informações de período no localStorage como backup
      localStorage.setItem(`spendingPlan_${userId}_periods`, JSON.stringify({
        receitas: allReceitas,
        despesas: allDespesas,
      }));
      
      dispatch(sendSuccess('Planejamento salvo com sucesso!'));
    } catch (error) {
      dispatch(sendError('Falha ao salvar o planejamento. Tente novamente.'));
    }
  };

  // Função para salvar apenas dados REALIZADOS
  const handleSaveRealizado = async () => {
    try {
      const allReceitasReais: any[] = [];
      const allDespesasReais: any[] = [];
      
      const periods: PlanningPeriod[] = ['DIARIO', 'SEMANAL', 'MENSAL', 'ANUAL'];
      
      periods.forEach((period) => {
        realData[period].receitas
          .filter((e) => !e.isFixed)
          .forEach((entry) => {
            const { id, description, value, expenseType, year, month, week, dayOfWeek } = entry;
            allReceitasReais.push({ 
              id, 
              description, 
              value, 
              expenseType,
              period,
              year,
              month,
              week,
              dayOfWeek,
            }); 
          });
        
        realData[period].despesas
          .filter((e) => !e.isFixed)
          .forEach((entry) => {
            const { id, description, value, expenseType, year, month, week, dayOfWeek } = entry;
            allDespesasReais.push({ 
              id, 
              description, 
              value, 
              expenseType,
              period,
              year,
              month,
              week,
              dayOfWeek,
            }); 
          });
      });
      
      const receitasReaisToSave: SpendingEntry[] = allReceitasReais.map(({ id, description, value, expenseType, year, month, week, dayOfWeek }) => ({
        id,
        description,
        value,
        expenseType,
        year,
        month,
        week,
        dayOfWeek,
      }));
      const despesasReaisToSave: SpendingEntry[] = allDespesasReais.map(({ id, description, value, expenseType, year, month, week, dayOfWeek }) => ({
        id,
        description,
        value,
        expenseType,
        year,
        month,
        week,
        dayOfWeek,
      }));

      // Coletar dados planejados do estado local (planData) para garantir que temos os dados mais recentes
      const allReceitasPlanejadas: any[] = [];
      const allDespesasPlanejadas: any[] = [];
      
      periods.forEach((period) => {
        planData[period].receitas
          .filter((e) => !e.isFixed)
          .forEach((entry) => {
            const { id, description, value, expenseType, year, month, week, dayOfWeek } = entry;
            allReceitasPlanejadas.push({ 
              id, 
              description, 
              value, 
              expenseType,
              period,
              year,
              month,
              week,
              dayOfWeek,
            }); 
          });
        
        planData[period].despesas
          .filter((e) => !e.isFixed)
          .forEach((entry) => {
            const { id, description, value, expenseType, year, month, week, dayOfWeek } = entry;
            allDespesasPlanejadas.push({ 
              id, 
              description, 
              value, 
              expenseType,
              period,
              year,
              month,
              week,
              dayOfWeek,
            }); 
          });
      });
      
      const receitasToSave: SpendingEntry[] = allReceitasPlanejadas.map(({ id, description, value, expenseType, year, month, week, dayOfWeek }) => ({
        id,
        description,
        value,
        expenseType,
        year,
        month,
        week,
        dayOfWeek,
      }));
      const despesasToSave: SpendingEntry[] = allDespesasPlanejadas.map(({ id, description, value, expenseType, year, month, week, dayOfWeek }) => ({
        id,
        description,
        value,
        expenseType,
        year,
        month,
        week,
        dayOfWeek,
      }));

      console.log('🟠 [Frontend] Salvando dados realizados - Preparação:', {
        receitasReaisCount: receitasReaisToSave.length,
        despesasReaisCount: despesasReaisToSave.length,
        receitasToSaveCount: receitasToSave.length,
        despesasToSaveCount: despesasToSave.length,
        receitasReaisSample: receitasReaisToSave.slice(0, 2),
        despesasReaisSample: despesasReaisToSave.slice(0, 2),
      });

      console.log('🟠 [Frontend] Enviando requisição para salvar...');
      const result = await savePlan({ 
        userId, 
        receitas: receitasToSave, 
        despesas: despesasToSave,
        receitasReais: receitasReaisToSave,
        despesasReais: despesasReaisToSave
      }).unwrap();
      
      console.log('🟠 [Frontend] Resposta do servidor:', result);
      
      // Recarregar os dados após salvar
      console.log('🟠 [Frontend] Recarregando dados após salvar...');
      const refetchResult = await refetchSpendingPlan();
      console.log('🟠 [Frontend] Dados recarregados:', {
        receitasCount: refetchResult.data?.receitas?.length || 0,
        despesasCount: refetchResult.data?.despesas?.length || 0,
        receitasReaisCount: (refetchResult.data as any)?.receitasReais?.length || 0,
        despesasReaisCount: (refetchResult.data as any)?.despesasReais?.length || 0,
        dataKeys: Object.keys(refetchResult.data || {}),
      });
      
      dispatch(sendSuccess('Dados realizados salvos com sucesso!'));
    } catch (error: any) {
      console.error('Erro ao salvar dados realizados:', error);
      dispatch(sendError(error?.data?.message || 'Falha ao salvar os dados realizados. Tente novamente.'));
    }
  };

  // Função para salvar CONFIGURAÇÕES (tipos de gastos)
  const handleSaveConfiguracoes = async () => {
    // Os tipos de gastos já são salvos automaticamente quando criados/deletados
    // Esta função pode ser usada para validação ou outras ações se necessário
    dispatch(sendSuccess('Configurações já estão salvas!'));
  };

  // Função genérica mantida para compatibilidade (será removida ou usada apenas internamente)
  const handleSave = async () => {
    try {
      // Coletar todas as entradas não-fixas de todos os períodos
      // e salvar em um formato que preserve a informação do período
      const allReceitas: Array<SpendingEntry & { period?: PlanningPeriod }> = [];
      const allDespesas: Array<SpendingEntry & { period?: PlanningPeriod }> = [];
      
      const periods: PlanningPeriod[] = ['DIARIO', 'SEMANAL', 'MENSAL', 'ANUAL'];
      periods.forEach((period) => {
        // Adicionar receitas não-fixas do período (incluindo todos os campos de período)
        planData[period].receitas
          .filter((e) => !e.isFixed)
          .forEach((entry) => {
            const { id, description, value, expenseType, year, month, week, dayOfWeek } = entry;
            allReceitas.push({ 
              id, 
              description, 
              value, 
              expenseType, // ← INCLUINDO O TIPO DE GASTO
              period,
              year,
              month,
              week,
              dayOfWeek,
            }); 
          });
        
        // Adicionar despesas não-fixas do período (incluindo todos os campos de período)
        planData[period].despesas
          .filter((e) => !e.isFixed)
          .forEach((entry) => {
            const { id, description, value, expenseType, year, month, week, dayOfWeek } = entry;
            allDespesas.push({ 
              id, 
              description, 
              value, 
              expenseType, // ← INCLUINDO O TIPO DE GASTO
              period,
              year,
              month,
              week,
              dayOfWeek,
            }); 
          });
      });
      
      // Salvar todas as entradas com todos os campos de período
      const receitasToSave: SpendingEntry[] = allReceitas.map(({ id, description, value, expenseType, year, month, week, dayOfWeek }) => ({
        id,
        description,
        value,
        expenseType, // Incluir o tipo de gasto
        year,
        month,
        week,
        dayOfWeek,
      }));
      const despesasToSave: SpendingEntry[] = allDespesas.map(({ id, description, value, expenseType, year, month, week, dayOfWeek }) => ({
        id,
        description,
        value,
        expenseType, // Incluir o tipo de gasto
        year,
        month,
        week,
        dayOfWeek,
      }));

      // Coletar dados realizados (realData) da mesma forma
      const allReceitasReais: any[] = [];
      const allDespesasReais: any[] = [];
      
      periods.forEach((period) => {
        // Adicionar receitas realizadas não-fixas do período
        realData[period].receitas
          .filter((e) => !e.isFixed)
          .forEach((entry) => {
            const { id, description, value, expenseType, year, month, week, dayOfWeek } = entry;
            allReceitasReais.push({ 
              id, 
              description, 
              value, 
              expenseType,
              period,
              year,
              month,
              week,
              dayOfWeek,
            }); 
          });
        
        // Adicionar despesas realizadas não-fixas do período
        realData[period].despesas
          .filter((e) => !e.isFixed)
          .forEach((entry) => {
            const { id, description, value, expenseType, year, month, week, dayOfWeek } = entry;
            allDespesasReais.push({ 
              id, 
              description, 
              value, 
              expenseType,
              period,
              year,
              month,
              week,
              dayOfWeek,
            }); 
          });
      });
      
      // Preparar dados realizados para salvar
      const receitasReaisToSave: SpendingEntry[] = allReceitasReais.map(({ id, description, value, expenseType, year, month, week, dayOfWeek }) => ({
        id,
        description,
        value,
        expenseType,
        year,
        month,
        week,
        dayOfWeek,
      }));
      const despesasReaisToSave: SpendingEntry[] = allDespesasReais.map(({ id, description, value, expenseType, year, month, week, dayOfWeek }) => ({
        id,
        description,
        value,
        expenseType,
        year,
        month,
        week,
        dayOfWeek,
      }));

      
      // Salvar na API (incluindo dados realizados)
      await savePlan({ 
        userId, 
        receitas: receitasToSave, 
        despesas: despesasToSave,
        receitasReais: receitasReaisToSave,
        despesasReais: despesasReaisToSave
      }).unwrap();
      
      // Salvar informações de período no localStorage como backup
      localStorage.setItem(`spendingPlan_${userId}_periods`, JSON.stringify({
        receitas: allReceitas,
        despesas: allDespesas,
      }));
      
      // Mostrar notificação de sucesso
      dispatch(sendSuccess('Planejamento salvo com sucesso!'));
    } catch (error) {
      // Mostrar notificação de erro
      dispatch(sendError('Falha ao salvar o planejamento. Tente novamente.'));
    }
  };

  // Calcular saldo considerando capital inicial
  const totalReceitas = total(receitas);
  const totalDespesas = total(despesas);
  const capitalInicial = parseFloat(initialCapital.replace(',', '.')) || 0;
  const saldo = capitalInicial + totalReceitas - totalDespesas;

  // Função para obter o multiplicador baseado no período
  const getPeriodMultiplier = (period: PlanningPeriod): number => {
    switch (period) {
      case 'DIARIO': return 30; // 30 dias no mês
      case 'SEMANAL': return 4.33; // ~4.33 semanas no mês
      case 'MENSAL': return 1;
      case 'ANUAL': return 1/12; // 1/12 do ano
      default: return 1;
    }
  };

  const periodMultiplier = getPeriodMultiplier(planningPeriod);
  const receitasMensais = totalReceitas * periodMultiplier;
  const despesasMensais = totalDespesas * periodMultiplier;
  const saldoMensal = capitalInicial + receitasMensais - despesasMensais;

  if (isLoading)
    return (
      <Box textAlign="center" p={4}>
        <CircularProgress />
      </Box>
    );
  if (isError)
    return (
      <Alert severity="error">
        Erro ao carregar o planejamento de gastos.
      </Alert>
    );

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto', position: 'relative' }}>
      {isSaving && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(2px)',
          }}
        >
          <Box
            sx={{
              backgroundColor: 'background.paper',
              borderRadius: 2,
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              boxShadow: 6,
            }}
          >
            <CircularProgress size={60} />
            <Typography variant="h6" color="text.primary">
              Salvando...
            </Typography>
          </Box>
        </Box>
      )}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main' }}>
        <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Planejamento de Gastos
      </Typography>

      <Grid container spacing={3}>
        {/* Configurações do Planejamento */}
        <Grid item xs={12}>
          <Card elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Configurações do Planejamento
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                sx={{ mt: 3.2 }}
                  label="Capital Inicial"
                  name="initialCapital"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(e.target.value)}
                  InputProps={{
                    inputComponent: NumericFormatCustom as any,
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  fullWidth
                  variant="outlined"
                  size="medium"
                 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Período do Planejamento
                </Typography>
                <Select
                  value={planningPeriod}
                  onChange={(e) => setPlanningPeriod(e.target.value as PlanningPeriod)}
                  fullWidth
                  variant="outlined"
                  size="medium"
                >
                  <MenuItem value="DIARIO">Diário</MenuItem>
                  <MenuItem value="SEMANAL">Semanal</MenuItem>
                  <MenuItem value="MENSAL">Mensal</MenuItem>
                  <MenuItem value="ANUAL">Anual</MenuItem>
                </Select>
              </Grid>
              
              {/* Seletores específicos baseados no período */}
              {/* Ano - sempre visível */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Ano
                </Typography>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  fullWidth
                  variant="outlined"
                  size="medium"
                >
                  {Array.from({ length: 10 }, (_, i) => currentYear + i).map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </Grid>
              
              {/* Mês - para DIARIO, SEMANAL e MENSAL */}
              {(planningPeriod === 'DIARIO' || planningPeriod === 'SEMANAL' || planningPeriod === 'MENSAL') && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Mês
                  </Typography>
                  <Select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    fullWidth
                    variant="outlined"
                    size="medium"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                      <MenuItem key={month} value={month}>{getMonthName(month)}</MenuItem>
                    ))}
                  </Select>
                </Grid>
              )}
              
              {/* Semana - para SEMANAL */}
              {planningPeriod === 'SEMANAL' && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Semana do Mês
                  </Typography>
                  <Select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                    fullWidth
                    variant="outlined"
                    size="medium"
                  >
                    {[1, 2, 3, 4, 5].map((week) => (
                      <MenuItem key={week} value={week}>{week}º semana</MenuItem>
                    ))}
                  </Select>
                </Grid>
              )}
              
              {/* Dia da semana - para DIARIO */}
              {planningPeriod === 'DIARIO' && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Dia da Semana
                  </Typography>
                  <Select
                    value={selectedDayOfWeek}
                    onChange={(e) => setSelectedDayOfWeek(Number(e.target.value))}
                    fullWidth
                    variant="outlined"
                    size="medium"
                  >
                    <MenuItem value={0}>Domingo</MenuItem>
                    <MenuItem value={1}>Segunda-feira</MenuItem>
                    <MenuItem value={2}>Terça-feira</MenuItem>
                    <MenuItem value={3}>Quarta-feira</MenuItem>
                    <MenuItem value={4}>Quinta-feira</MenuItem>
                    <MenuItem value={5}>Sexta-feira</MenuItem>
                    <MenuItem value={6}>Sábado</MenuItem>
                  </Select>
                </Grid>
              )}
            </Grid>
          </Card>
        </Grid>

        {/* Abas: Planejado e Realizado */}
        <Grid item xs={12}>
          <Card elevation={3} sx={{ p: 0 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={activeTab === 'planejado' ? 0 : activeTab === 'realizado' ? 1 : activeTab === 'analise' ? 2 : 3} 
                onChange={(_, newValue) => {
                  // Só permite mudar para 'realizado' se o usuário tiver plano
                  if (newValue === 1 && !hasActivePlan) return;
                  setIsChangingSubTab(true);
                  // Simula um pequeno delay para mostrar o loading
                  setTimeout(() => {
                    if (newValue === 0) setActiveTab('planejado');
                    else if (newValue === 1) setActiveTab('realizado');
                    else if (newValue === 2) setActiveTab('analise');
                    else if (newValue === 3) setActiveTab('configuracoes');
                    setIsChangingSubTab(false);
                  }, 300);
                }}
                sx={{ 
                  px: 3, 
                  pt: 2,
                  '& .MuiTab-root': {
                    color: 'text.secondary',
                    backgroundColor: 'action.hover',
                    marginRight: 1,
                    borderRadius: '8px 8px 0 0',
                    transition: 'all 0.3s ease',
                    textTransform: 'none',
                    fontWeight: 'medium',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                      color: 'primary.main',
                    },
                    '&.Mui-selected': {
                      fontWeight: 'bold',
                      color: 'primary.contrastText',
                      backgroundColor: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    },
                  },
                  '& .MuiTabs-indicator': {
                    display: 'none', // Remove o indicador padrão já que usamos background color
                  },
                }}
              >
                <Tab label="Planejado" />
                {hasActivePlan && <Tab label="Realizado" />}
                <Tab label="Análise" />
                <Tab label="Configurações" />
              </Tabs>
            </Box>
            
            <Box sx={{ p: 3, position: 'relative' }}>
              {isChangingSubTab && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(2px)',
                    borderRadius: 1,
                  }}
                >
                  <CircularProgress size={60} />
                </Box>
              )}
              {activeTab === 'planejado' ? (
                <DragDropContext 
                  onDragEnd={(result) => {
                    isDraggingRef.current = false;
                    console.log('🚀 [DragDrop] Drag finalizado (planejado)');
                    reorderPlannedEntries(result);
                  }} 
                  onDragStart={() => {
                    isDraggingRef.current = true;
                    console.log('🚀 [DragDrop] Drag iniciado (planejado)');
                  }}
                >
                <Grid container spacing={3}>
                  {/* Receitas Planejadas */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={2} sx={{ p: 3, height: 'fit-content' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          Receitas Planejadas
                        </Typography>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="success"
                          startIcon={<AddIcon />}
                          onClick={() => addEntry('receitas')}
                        >
                          + Receita
                        </Button>
                      </Box>
            
                      <Droppable 
                        droppableId="receitas-planejadas" 
                        isDropDisabled={false}
                        type="RECEITAS"
                      >
                        {(provided, snapshot) => (
            <Stack 
              {...provided.droppableProps}
              ref={provided.innerRef}
              spacing={2} 
              sx={{ 
                maxHeight: '400px', 
                overflow: 'auto',
                backgroundColor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
              }}
            >
              {stableReceitasPlanejadas.map((e, index) => {
                const draggableId = `receita-planejada-${String(e.id)}`;
                return (
                <Draggable key={`receita-planejada-${e.id}`} draggableId={draggableId} index={index}>
                  {(provided, snapshot) => (
                <Box 
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    flexWrap: 'wrap',
                    backgroundColor: snapshot.isDragging ? 'action.hover' : 'transparent',
                    transition: 'background-color 0.2s',
                    opacity: snapshot.isDragging ? 0.8 : 1,
                  }}
                >
                  <Box 
                    {...provided.dragHandleProps}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      cursor: 'grab',
                      padding: '8px 4px',
                      marginRight: '4px',
                      borderRadius: '4px',
                      userSelect: 'none',
                      touchAction: 'none',
                      WebkitUserSelect: 'none',
                      '&:active': {
                        cursor: 'grabbing'
                      },
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <DragIndicatorIcon sx={{ color: 'text.secondary', fontSize: '20px' }} />
                  </Box>
                  <Select
                    value={e.expenseType || ''}
                    onChange={(ev) =>
                      updateEntry(e.id, 'expenseType', ev.target.value, 'receitas')
                    }
                    size="small"
                    displayEmpty
                    disabled={e.isFixed}
                    sx={{ 
                      minWidth: 120,
                      '& .MuiInputBase-input.Mui-disabled': {
                        backgroundColor: 'action.disabledBackground',
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>Tipo</em>
                    </MenuItem>
                    {expenseTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 200 }}>
                    <TextField
                      placeholder="Descrição"
                      size="small"
                      fullWidth
                      value={e.description}
                      onChange={(ev) =>
                        updateEntry(e.id, 'description', ev.target.value, 'receitas')
                      }
                      variant="outlined"
                      disabled={e.isFixed}
                      sx={{ 
                        '& .MuiInputBase-input.Mui-disabled': {
                          backgroundColor: 'action.disabledBackground',
                        }
                      }}
                    />
                    {e.isFixed && e.sourcePeriod && (
                      <Tooltip title={`Fixo (oriundo do período ${e.sourcePeriod.toLowerCase()})`}>
                        <Chip 
                          label={`Fixo (${e.sourcePeriod.toLowerCase()})`}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      </Tooltip>
                    )}
                  </Box>
                  <TextField
                    placeholder="Valor"
                    name={`receita-${e.id}`}
                    size="small"
                    sx={{ 
                      width: 220,
                      '& .MuiInputBase-input.Mui-disabled': {
                        backgroundColor: 'action.disabledBackground',
                      }
                    }}
                    value={e.value}
                    onChange={(ev) =>
                      updateEntry(e.id, 'value', ev.target.value, 'receitas')
                    }
                    InputProps={{
                      inputComponent: NumericFormatCustom as any,
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    variant="outlined"
                    disabled={e.isFixed}
                  />
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => removeEntry(e.id, 'receitas')}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
                  )}
                </Draggable>
                );
              })}
              {provided.placeholder}
              {stableReceitasPlanejadas.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  Nenhuma receita adicionada
                </Typography>
              )}
            </Stack>
                        )}
                      </Droppable>
          </Card>
        </Grid>

                  {/* Despesas Planejadas */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={2} sx={{ p: 3, height: 'fit-content' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                          Despesas Planejadas
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Importar CSV ou PDF">
                            <Button
                              size="small"
                              color="info"
                              variant="outlined"
                              startIcon={<UploadFileIcon />}
                              component="label"
                              disabled={isImporting}
                            >
                              Importar
                              <input
                                type="file"
                                hidden
                                accept=".csv,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const fileType = file.name.endsWith('.csv') ? 'csv' : 'pdf';
                                    handleFileImport(file, fileType);
                                  }
                                  e.target.value = ''; // Reset input
                                }}
                              />
                            </Button>
                          </Tooltip>
                          <Button
                            size="small"
                            color="error"
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => addEntry('despesas')}
                          >
                            + Despesa
                          </Button>
                        </Box>
                      </Box>
                      
                      <Droppable 
                        droppableId="despesas-planejadas" 
                        isDropDisabled={false}
                        type="DESPESAS"
                      >
                        {(provided, snapshot) => (
                      <Stack 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        spacing={2} 
                        sx={{ 
                          maxHeight: '400px', 
                          overflow: 'auto',
                          backgroundColor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
                        }}
                      >
                        {stableDespesasPlanejadas.map((e, index) => {
                          const draggableId = `despesa-planejada-${String(e.id)}`;
                          return (
                        <Draggable key={`despesa-planejada-${e.id}`} draggableId={draggableId} index={index}>
                          {(provided, snapshot) => (
                <Box 
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    flexWrap: 'wrap',
                    backgroundColor: snapshot.isDragging ? 'action.hover' : 'transparent',
                    transition: 'background-color 0.2s',
                    opacity: snapshot.isDragging ? 0.8 : 1,
                  }}
                >
                  <Box 
                    {...provided.dragHandleProps}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      cursor: 'grab',
                      padding: '8px 4px',
                      marginRight: '4px',
                      borderRadius: '4px',
                      userSelect: 'none',
                      touchAction: 'none',
                      WebkitUserSelect: 'none',
                      '&:active': {
                        cursor: 'grabbing'
                      },
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <DragIndicatorIcon sx={{ color: 'text.secondary', fontSize: '20px' }} />
                  </Box>
                  <Select
                    value={e.expenseType || ''}
                    onChange={(ev) =>
                      updateEntry(e.id, 'expenseType', ev.target.value, 'despesas')
                    }
                    size="small"
                    displayEmpty
                    disabled={e.isFixed}
                    sx={{ 
                      minWidth: 120,
                      '& .MuiInputBase-input.Mui-disabled': {
                        backgroundColor: 'action.disabledBackground',
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>Tipo</em>
                    </MenuItem>
                    {expenseTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 200 }}>
                    <TextField
                      placeholder="Descrição"
                      size="small"
                      fullWidth
                      value={e.description}
                      onChange={(ev) =>
                        updateEntry(e.id, 'description', ev.target.value, 'despesas')
                      }
                      variant="outlined"
                      disabled={e.isFixed}
                      sx={{ 
                        '& .MuiInputBase-input.Mui-disabled': {
                          backgroundColor: 'action.disabledBackground',
                        }
                      }}
                    />
                    {e.isFixed && e.sourcePeriod && (
                      <Tooltip title={`Fixo (oriundo do período ${e.sourcePeriod.toLowerCase()})`}>
                        <Chip 
                          label={`Fixo (${e.sourcePeriod.toLowerCase()})`}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      </Tooltip>
                    )}
                  </Box>
                  <TextField
                    placeholder="Valor"
                    name={`despesa-${e.id}`}
                    size="small"
                    sx={{ 
                      width: 220,
                      '& .MuiInputBase-input.Mui-disabled': {
                        backgroundColor: 'action.disabledBackground',
                      }
                    }}
                    value={e.value}
                    onChange={(ev) =>
                      updateEntry(e.id, 'value', ev.target.value, 'despesas')
                    }
                    InputProps={{
                      inputComponent: NumericFormatCustom as any,
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    variant="outlined"
                    disabled={e.isFixed}
                  />
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => removeEntry(e.id, 'despesas')}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
                          )}
                        </Draggable>
                          );
                        })}
                        {provided.placeholder}
                        {stableDespesasPlanejadas.length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                            Nenhuma despesa adicionada
                          </Typography>
                        )}
                      </Stack>
                        )}
                      </Droppable>
                    </Card>
                  </Grid>
                  
                  {/* Botão Salvar Planejamento */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleSavePlanejado}
                        disabled={isSaving}
                        startIcon={
                          isSaving ? (
                            <CircularProgress size={20} sx={{ color: 'inherit' }} />
                          ) : (
                            <SaveIcon />
                          )
                        }
                        size="large"
                        sx={{
                          minWidth: 200,
                        }}
                      >
                        {isSaving ? 'Salvando...' : 'Salvar Planejamento'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
                </DragDropContext>
              ) : activeTab === 'realizado' ? (
                <DragDropContext 
                  onDragEnd={(result) => {
                    isDraggingRef.current = false;
                    console.log('🚀 [DragDrop] Drag finalizado');
                    reorderRealEntries(result);
                  }} 
                  onDragStart={() => {
                    isDraggingRef.current = true;
                    console.log('🚀 [DragDrop] Drag iniciado');
                  }}
                >
                  <Grid container spacing={3}>
                    {/* Botão para copiar do planejado */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<ContentCopyIcon />}
                          onClick={copyPlannedToReal}
                        >
                          Copiar Planejado para Realizado
                        </Button>
                      </Box>
                    </Grid>
                    
                    {/* Receitas Reais */}
                    <Grid item xs={12} md={6}>
                      <Card elevation={2} sx={{ p: 3, height: 'fit-content' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            Receitas Realizadas
                          </Typography>
                          <Button 
                            size="small" 
                            variant="contained" 
                            color="success"
                            startIcon={<AddIcon />}
                            onClick={() => addRealEntry('receitas')}
                          >
                            + Receita
                          </Button>
                        </Box>
                        
                        <Droppable 
                          droppableId="receitas-reais" 
                          isDropDisabled={false}
                          type="RECEITAS"
                        >
                          {(provided, snapshot) => {
                            console.log('📦 [DragDrop] Renderizando Droppable receitas-reais:', {
                              droppableId: 'receitas-reais',
                              itemsCount: stableReceitasReais.length,
                              isDraggingOver: snapshot.isDraggingOver,
                              draggingFromThisWith: snapshot.draggingFromThisWith,
                              provided: !!provided,
                              innerRef: !!provided.innerRef
                            });
                            return (
                            <Stack 
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              spacing={2} 
                              sx={{ 
                                maxHeight: '400px', 
                                overflow: 'auto',
                                backgroundColor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
                              }}
                            >
                              {stableReceitasReais.map((e, index) => {
                                const draggableId = `receita-${String(e.id)}`;
                                console.log('🎨 [DragDrop] Renderizando Draggable receita:', {
                                  index,
                                  id: e.id,
                                  draggableId,
                                  hasId: !!e.id,
                                  isValid: e && e.id
                                });
                                return (
                                <Draggable key={`receita-${e.id}`} draggableId={draggableId} index={index}>
                                  {(provided, snapshot) => (
                                    <Box
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        flexWrap: 'wrap',
                                        p: 1,
                                        borderRadius: 1,
                                        backgroundColor: snapshot.isDragging ? 'action.hover' : 'transparent',
                                        transition: 'background-color 0.2s',
                                        opacity: snapshot.isDragging ? 0.8 : 1,
                                      }}
                                    >
                                      <Box 
                                        {...provided.dragHandleProps}
                                        sx={{ 
                                          display: 'flex', 
                                          alignItems: 'center',
                                          cursor: 'grab',
                                          padding: '8px 4px',
                                          marginRight: '4px',
                                          borderRadius: '4px',
                                          userSelect: 'none',
                                          touchAction: 'none',
                                          WebkitUserSelect: 'none',
                                          '&:active': {
                                            cursor: 'grabbing'
                                          },
                                          '&:hover': {
                                            backgroundColor: 'action.hover'
                                          }
                                        }}
                                      >
                                        <DragIndicatorIcon sx={{ color: 'text.secondary', fontSize: '20px' }} />
                                      </Box>
                                      <Select
                                        value={e.expenseType || ''}
                                        onChange={(ev) =>
                                          updateRealEntry(e.id, 'expenseType', ev.target.value, 'receitas')
                                        }
                                        size="small"
                                        displayEmpty
                                        sx={{ minWidth: 120 }}
                                      >
                                        <MenuItem value="">
                                          <em>Tipo</em>
                                        </MenuItem>
                                        {expenseTypes.map((type) => (
                                          <MenuItem key={type} value={type}>
                                            {type}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 200 }}>
                                        <TextField
                                          placeholder="Descrição"
                                          size="small"
                                          fullWidth
                                          value={e.description}
                                          onChange={(ev) =>
                                            updateRealEntry(e.id, 'description', ev.target.value, 'receitas')
                                          }
                                          variant="outlined"
                                        />
                                      </Box>
                                      <TextField
                                        placeholder="Valor"
                                        name={`receita-real-${e.id}`}
                                        size="small"
                                        sx={{ width: 220 }}
                                        value={e.value}
                                        onChange={(ev) =>
                                          updateRealEntry(e.id, 'value', ev.target.value, 'receitas')
                                        }
                                        InputProps={{
                                          inputComponent: NumericFormatCustom as any,
                                          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                        }}
                                        variant="outlined"
                                      />
                                      <IconButton 
                                        size="small" 
                                        color="error"
                                        onClick={() => removeRealEntry(e.id, 'receitas')}
                                      >
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  )}
                                </Draggable>
                                );
                              })}
                              {provided.placeholder}
                              {stableReceitasReais.length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                  Nenhuma receita realizada adicionada
                                </Typography>
                              )}
                            </Stack>
                            );
                          }}
                        </Droppable>
                    </Card>
                  </Grid>
                  
                  {/* Despesas Reais */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={2} sx={{ p: 3, height: 'fit-content' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                          Despesas Realizadas
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Importar CSV ou PDF">
                            <Button
                              size="small"
                              color="info"
                              variant="outlined"
                              startIcon={<UploadFileIcon />}
                              component="label"
                              disabled={isImporting}
                            >
                              Importar
                              <input
                                type="file"
                                hidden
                                accept=".csv,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const fileType = file.name.endsWith('.csv') ? 'csv' : 'pdf';
                                    handleFileImport(file, fileType);
                                  }
                                  e.target.value = ''; // Reset input
                                }}
                              />
                            </Button>
                          </Tooltip>
                          <Button
                            size="small"
                            color="error"
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => addRealEntry('despesas')}
                          >
                            + Despesa
                          </Button>
                        </Box>
                      </Box>
                      
                      <Droppable 
                        droppableId="despesas-reais" 
                        isDropDisabled={false}
                        type="DESPESAS"
                      >
                          {(provided, snapshot) => {
                            console.log('📦 [DragDrop] Renderizando Droppable despesas-reais:', {
                              droppableId: 'despesas-reais',
                              itemsCount: stableDespesasReais.length,
                              isDraggingOver: snapshot.isDraggingOver,
                              draggingFromThisWith: snapshot.draggingFromThisWith,
                              provided: !!provided,
                              innerRef: !!provided.innerRef
                            });
                            return (
                            <Stack 
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              spacing={2} 
                              sx={{ 
                                maxHeight: '400px', 
                                overflow: 'auto',
                                backgroundColor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
                              }}
                            >
                              {stableDespesasReais.map((e, index) => {
                                const draggableId = `despesa-${String(e.id)}`;
                                console.log('🎨 [DragDrop] Renderizando Draggable despesa:', {
                                  index,
                                  id: e.id,
                                  draggableId,
                                  hasId: !!e.id,
                                  isValid: e && e.id
                                });
                                return (
                                <Draggable key={`despesa-${e.id}`} draggableId={draggableId} index={index}>
                                  {(provided, snapshot) => (
                                    <Box
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        flexWrap: 'wrap',
                                        p: 1,
                                        borderRadius: 1,
                                        backgroundColor: snapshot.isDragging ? 'action.hover' : 'transparent',
                                        transition: 'background-color 0.2s',
                                        opacity: snapshot.isDragging ? 0.8 : 1,
                                      }}
                                    >
                                      <Box 
                                        {...provided.dragHandleProps}
                                        sx={{ 
                                          display: 'flex', 
                                          alignItems: 'center',
                                          cursor: 'grab',
                                          padding: '8px 4px',
                                          marginRight: '4px',
                                          borderRadius: '4px',
                                          userSelect: 'none',
                                          touchAction: 'none',
                                          WebkitUserSelect: 'none',
                                          '&:active': {
                                            cursor: 'grabbing'
                                          },
                                          '&:hover': {
                                            backgroundColor: 'action.hover'
                                          }
                                        }}
                                      >
                                        <DragIndicatorIcon sx={{ color: 'text.secondary', fontSize: '20px' }} />
                                      </Box>
                                      <Select
                                        value={e.expenseType || ''}
                                        onChange={(ev) =>
                                          updateRealEntry(e.id, 'expenseType', ev.target.value, 'despesas')
                                        }
                                        size="small"
                                        displayEmpty
                                        sx={{ minWidth: 120 }}
                                      >
                                        <MenuItem value="">
                                          <em>Tipo</em>
                                        </MenuItem>
                                        {expenseTypes.map((type) => (
                                          <MenuItem key={type} value={type}>
                                            {type}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 200 }}>
                                        <TextField
                                          placeholder="Descrição"
                                          size="small"
                                          fullWidth
                                          value={e.description}
                                          onChange={(ev) =>
                                            updateRealEntry(e.id, 'description', ev.target.value, 'despesas')
                                          }
                                          variant="outlined"
                                        />
                                      </Box>
                                      <TextField
                                        placeholder="Valor"
                                        name={`despesa-real-${e.id}`}
                                        size="small"
                                        sx={{ width: 220 }}
                                        value={e.value}
                                        onChange={(ev) =>
                                          updateRealEntry(e.id, 'value', ev.target.value, 'despesas')
                                        }
                                        InputProps={{
                                          inputComponent: NumericFormatCustom as any,
                                          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                        }}
                                        variant="outlined"
                                      />
                                      <IconButton 
                                        size="small" 
                                        color="error"
                                        onClick={() => removeRealEntry(e.id, 'despesas')}
                                      >
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  )}
                                </Draggable>
                                );
                              })}
                              {provided.placeholder}
                              {stableDespesasReais.length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                  Nenhuma despesa realizada adicionada
                                </Typography>
                              )}
                            </Stack>
                            );
                          }}
                        </Droppable>
                    </Card>
                  </Grid>
                  
                  {/* Botão Salvar Realizado */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleSaveRealizado}
                        disabled={isSaving}
                        startIcon={
                          isSaving ? (
                            <CircularProgress size={20} sx={{ color: 'inherit' }} />
                          ) : (
                            <SaveIcon />
                          )
                        }
                        size="large"
                        color="success"
                        sx={{
                          minWidth: 200,
                        }}
                      >
                        {isSaving ? 'Salvando...' : 'Salvar Realizado'}
                      </Button>
                    </Box>
                  </Grid>
                  </Grid>
                </DragDropContext>
              ) : activeTab === 'analise' ? (
                <>
                  {/* Análise - Gráficos por tipo de gasto */}
                  {!showDetailChart ? (
                    <Grid container spacing={3}>
                      {/* Controles do tipo de gráfico */}
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            Análise por Tipos de Gastos
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant={chartType === 'pie' ? 'contained' : 'outlined'}
                              size="small"
                              onClick={() => setChartType('pie')}
                              sx={{ minWidth: 120 }}
                            >
                              📊 Pizza
                            </Button>
                            <Button
                              variant={chartType === 'bar' ? 'contained' : 'outlined'}
                              size="small"
                              onClick={() => setChartType('bar')}
                              sx={{ minWidth: 120 }}
                            >
                              📈 Barras
                            </Button>
                          </Box>
                        </Box>
                      </Grid>
                      
                      {/* Receitas Planejadas */}
                      <Grid item xs={12} md={6}>
                        <Card elevation={2} sx={{ p: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: 'success.main' }}>
                            Receitas Planejadas por Tipo
                          </Typography>
                          <Box sx={{ height: 300 }}>
                            {renderExpenseChart(
                              getChartDataByType(receitas), 
                              '#4caf50',
                              (typeName) => {
                                setSelectedExpenseType(typeName);
                                setSelectedChartCategory('receitas-planejadas');
                                setShowDetailChart(true);
                              }
                            )}
                          </Box>
                        </Card>
                      </Grid>

                      {/* Despesas Planejadas */}
                      <Grid item xs={12} md={6}>
                        <Card elevation={2} sx={{ p: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: 'error.main' }}>
                            Despesas Planejadas por Tipo
                          </Typography>
                          <Box sx={{ height: 300 }}>
                            {renderExpenseChart(
                              getChartDataByType(despesas), 
                              '#f44336',
                              (typeName) => {
                                setSelectedExpenseType(typeName);
                                setSelectedChartCategory('despesas-planejadas');
                                setShowDetailChart(true);
                              }
                            )}
                          </Box>
                        </Card>
                      </Grid>

                      {/* Receitas Realizadas */}
                      <Grid item xs={12} md={6}>
                        <Card elevation={2} sx={{ p: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: 'info.main' }}>
                            Receitas Realizadas por Tipo
                          </Typography>
                          <Box sx={{ height: 300 }}>
                            {renderExpenseChart(
                              getChartDataByType(receitasReais), 
                              '#2196f3',
                              (typeName) => {
                                setSelectedExpenseType(typeName);
                                setSelectedChartCategory('receitas-realizadas');
                                setShowDetailChart(true);
                              }
                            )}
                          </Box>
                        </Card>
                      </Grid>

                      {/* Despesas Realizadas */}
                      <Grid item xs={12} md={6}>
                        <Card elevation={2} sx={{ p: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: 'warning.main' }}>
                            Despesas Realizadas por Tipo
                          </Typography>
                          <Box sx={{ height: 300 }}>
                            {renderExpenseChart(
                              getChartDataByType(despesasReais), 
                              '#ff9800',
                              (typeName) => {
                                setSelectedExpenseType(typeName);
                                setSelectedChartCategory('despesas-realizadas');
                                setShowDetailChart(true);
                              }
                            )}
                          </Box>
                        </Card>
                      </Grid>
                    </Grid>
                  ) : (
                    /* Gráfico detalhado */
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                          <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => {
                              setShowDetailChart(false);
                              setSelectedExpenseType(null);
                              setSelectedChartCategory(null);
                            }}
                          >
                            Voltar
                          </Button>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            Detalhes: {selectedExpenseType}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Card elevation={2} sx={{ p: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                            {selectedChartCategory === 'receitas-planejadas' && 'Receitas Planejadas'}
                            {selectedChartCategory === 'despesas-planejadas' && 'Despesas Planejadas'}
                            {selectedChartCategory === 'receitas-realizadas' && 'Receitas Realizadas'}
                            {selectedChartCategory === 'despesas-realizadas' && 'Despesas Realizadas'}
                            {' - '}
                            {selectedExpenseType}
                          </Typography>
                          <Box sx={{ height: 400 }}>
                            {(() => {
                              let detailData: { name: string; value: number }[] = [];
                              let color = '#8884d8';
                              
                              if (selectedChartCategory === 'receitas-planejadas') {
                                detailData = getDetailDataByType(receitas, selectedExpenseType || '');
                                color = '#4caf50';
                              } else if (selectedChartCategory === 'despesas-planejadas') {
                                detailData = getDetailDataByType(despesas, selectedExpenseType || '');
                                color = '#f44336';
                              } else if (selectedChartCategory === 'receitas-realizadas') {
                                detailData = getDetailDataByType(receitasReais, selectedExpenseType || '');
                                color = '#2196f3';
                              } else if (selectedChartCategory === 'despesas-realizadas') {
                                detailData = getDetailDataByType(despesasReais, selectedExpenseType || '');
                                color = '#ff9800';
                              }

                              if (detailData.length === 0) {
                                return (
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    height: '100%',
                                    flexDirection: 'column',
                                    color: 'text.secondary'
                                  }}>
                                    <Typography variant="h6" sx={{ mb: 1 }}>
                                      Sem dados
                                    </Typography>
                                    <Typography variant="body2">
                                      Nenhum item encontrado para este tipo
                                    </Typography>
                                  </Box>
                                );
                              }

                              return renderExpenseChart(detailData, color);
                            })()}
                          </Box>
                        </Card>
                      </Grid>
                    </Grid>
                  )}
                </>
              ) : (
                <>
                  {/* Configurações - Aba para gerenciar tipos de gastos */}
                  <Grid container spacing={3}>
                  {/* Configurações de Replicação e Vinculação */}
                  <Grid item xs={12}>
                    <Card elevation={2} sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                        <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Configurações de Planejamento
                      </Typography>
                      
                      <Stack spacing={3}>
                        {/* Vincular Períodos */}
                        <Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={linkPeriods}
                                onChange={(e) => setLinkPeriods(e.target.checked)}
                                color="primary"
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                  Vincular Períodos
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Quando ativado, receitas e despesas criadas em um período aparecerão nos outros com valores convertidos
                                </Typography>
                              </Box>
                            }
                          />
                        </Box>

                        <Divider />

                        {/* Replicar Receitas para Todos os Meses */}
                        <Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={replicateReceitasToAllMonths}
                                onChange={(e) => setReplicateReceitasToAllMonths(e.target.checked)}
                                color="primary"
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                  Replicar Receitas para Todos os Meses
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Quando ativado, as receitas do mês atual serão automaticamente replicadas para os outros meses ao mudar a seleção
                                </Typography>
                              </Box>
                            }
                          />
                        </Box>

                        <Divider />

                        {/* Replicar Despesas para Todos os Meses */}
                        <Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={replicateDespesasToAllMonths}
                                onChange={(e) => setReplicateDespesasToAllMonths(e.target.checked)}
                                color="primary"
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                  Replicar Despesas para Todos os Meses
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Quando ativado, as despesas do mês atual serão automaticamente replicadas para os outros meses ao mudar a seleção
                                </Typography>
                              </Box>
                            }
                          />
                        </Box>
                      </Stack>
                    </Card>
                  </Grid>

                  {/* Tipos de Gastos Personalizados */}
                  <Grid item xs={12}>
                    <Card elevation={2} sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                        <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Tipos de Gastos Personalizados
                      </Typography>
                      
                      {/* Formulário para adicionar novo tipo */}
                      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField
                          label="Novo tipo de gasto"
                          placeholder="Ex: Mercado, Carro, Farmácia..."
                          value={newExpenseType}
                          onChange={(e) => setNewExpenseType(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newExpenseType.trim()) {
                              addExpenseType();
                            }
                          }}
                          size="small"
                          sx={{ minWidth: 200, flex: 1 }}
                        />
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={addExpenseType}
                          disabled={!newExpenseType.trim() || creatingExpenseType}
                          size="small"
                        >
                          {creatingExpenseType ? 'Adicionando...' : 'Adicionar'}
                        </Button>
                      </Box>

                      {/* Lista de tipos existentes */}
                      <Typography variant="subtitle2" sx={{ mb: 2 }}>
                        Tipos disponíveis:
                      </Typography>
                      
                      {expenseTypesLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : expenseTypesError ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          Erro ao carregar tipos de gastos
                        </Alert>
                      ) : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {expenseTypesData?.map((type, index) => (
                            <Chip
                              key={type.id}
                              label={type.name}
                              onDelete={type.isDefault ? undefined : () => removeExpenseType(index)}
                              deleteIcon={<Delete />}
                              color={type.isDefault ? "default" : "primary"}
                              variant={type.isDefault ? "filled" : "outlined"}
                              size="small"
                              sx={type.isDefault ? { 
                                opacity: 0.7,
                                '&:hover': { opacity: 0.9 }
                              } : undefined}
                            />
                          ))}
                        </Box>
                      )}

                      {expenseTypesData?.length === 0 && !expenseTypesLoading && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          Nenhum tipo de gasto encontrado
                        </Typography>
                      )}

                      {/* Legenda */}
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Legenda:</strong> Tipos com fundo cinza são padrão do sistema e não podem ser removidos.
                          Tipos com bordas são personalizados e podem ser removidos.
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                  
                  {/* Botão Salvar Configurações */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleSaveConfiguracoes}
                        disabled={isSaving}
                        startIcon={
                          isSaving ? (
                            <CircularProgress size={20} sx={{ color: 'inherit' }} />
                          ) : (
                            <SaveIcon />
                          )
                        }
                        size="large"
                        color="secondary"
                        sx={{
                          minWidth: 200,
                        }}
                      >
                        {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
                </>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Comparativo: Planejado vs Realizado - apenas para usuários com plano */}
        {hasActivePlan && (
          <Grid item xs={12}>
            <Card elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Comparativo: Planejado vs Realizado
              </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Receitas
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Planejado:</Typography>
                    <Typography fontWeight="bold" color="success.main">
                      R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Realizado:</Typography>
                    <Typography fontWeight="bold" color="info.main">
                      R$ {total(receitasReais).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Diferença:</Typography>
                    <Typography 
                      fontWeight="bold" 
                      color={(total(receitasReais) - totalReceitas) >= 0 ? 'success.main' : 'error.main'}
                    >
                      R$ {(total(receitasReais) - totalReceitas).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  {totalReceitas > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption">Percentual:</Typography>
                      <Typography 
                        variant="caption" 
                        fontWeight="bold"
                        color={(total(receitasReais) / totalReceitas * 100) >= 100 ? 'success.main' : 'warning.main'}
                      >
                        {((total(receitasReais) / totalReceitas) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Despesas
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Planejado:</Typography>
                    <Typography fontWeight="bold" color="error.main">
                      R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Realizado:</Typography>
                    <Typography fontWeight="bold" color="info.main">
                      R$ {total(despesasReais).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Diferença:</Typography>
                    <Typography 
                      fontWeight="bold" 
                      color={(total(despesasReais) - totalDespesas) <= 0 ? 'success.main' : 'error.main'}
                    >
                      R$ {(total(despesasReais) - totalDespesas).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  {totalDespesas > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption">Percentual:</Typography>
                      <Typography 
                        variant="caption" 
                        fontWeight="bold"
                        color={(total(despesasReais) / totalDespesas * 100) <= 100 ? 'success.main' : 'error.main'}
                      >
                        {((total(despesasReais) / totalDespesas) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Saldo Final
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Saldo Planejado:</Typography>
                    <Typography fontWeight="bold" color={saldo >= 0 ? 'success.main' : 'error.main'}>
                      R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Saldo Realizado:</Typography>
                    <Typography fontWeight="bold" color={(capitalInicial + total(receitasReais) - total(despesasReais)) >= 0 ? 'success.main' : 'error.main'}>
                      R$ {(capitalInicial + total(receitasReais) - total(despesasReais)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Diferença no Saldo:</Typography>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold" 
                      color={((capitalInicial + total(receitasReais) - total(despesasReais)) - saldo) >= 0 ? 'success.main' : 'error.main'}
                    >
                      R$ {((capitalInicial + total(receitasReais) - total(despesasReais)) - saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Card>
        </Grid>
        )}

        {/* Resumo Financeiro */}
        <Grid item xs={12}>
          <Card elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Resumo Financeiro
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Resumo do Período ({planningPeriod.toLowerCase()})
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Capital Inicial:</Typography>
                    <Typography fontWeight="bold">R$ {capitalInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Total Receitas:</Typography>
                    <Typography fontWeight="bold" color="success.main">R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Total Despesas:</Typography>
                    <Typography fontWeight="bold" color="error.main">R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Saldo Final:</Typography>
                    <Typography variant="h6" fontWeight="bold" color={saldo >= 0 ? 'success.main' : 'error.main'}>
                      R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Projeção Mensal
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Receitas Mensais:</Typography>
                    <Typography fontWeight="bold" color="success.main">R$ {receitasMensais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Despesas Mensais:</Typography>
                    <Typography fontWeight="bold" color="error.main">R$ {despesasMensais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Saldo Mensal:</Typography>
                    <Typography variant="h6" fontWeight="bold" color={saldoMensal >= 0 ? 'success.main' : 'error.main'}>
                      R$ {saldoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Stack>
                
                <Box sx={{ mt: 2 }}>
                  <Chip 
                    label={`Período: ${planningPeriod.toLowerCase()}`}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                  {planningPeriod !== 'MENSAL' && (
                    <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                      * Valores convertidos para base mensal
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog de Preview de Importação */}
      <Dialog
        open={showImportDialog}
        onClose={() => {
          setShowImportDialog(false);
          setImportedData([]);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Preview de Importação
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {importedData.length} transações encontradas. Revise os dados antes de aplicar.
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Descrição</strong></TableCell>
                  <TableCell align="right"><strong>Valor</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {importedData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell align="right">
                      R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowImportDialog(false);
              setImportedData([]);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => applyImportedData(activeTab === 'realizado')}
            variant="contained"
            color="primary"
            disabled={importedData.length === 0}
          >
            Aplicar {importedData.length} Despesa{importedData.length !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SpendingPlan;
