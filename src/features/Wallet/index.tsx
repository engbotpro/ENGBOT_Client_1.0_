import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel
} from '@mui/material';
import {
  AccountBalanceWallet,
  TrendingUp,
  TrendingDown,
  Add,
  Remove,
  Refresh,
  SwapHoriz,
  History,
  AttachMoney,
  ShowChart,
  CleaningServices,
  Star,
  BugReport
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import walletAPI, { Wallet as WalletType } from '../../services/walletAPI';
import { useGetPlatformSettingsQuery } from '../../services/platformSettingsAPI';
import { useCreateBitcoinTransactionMutation } from '../../services/bitcoinTransactionAPI';
import useMutationAlert from '../../hooks/useMutationAlert';
import BalanceChart from './BalanceChart';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`wallet-tabpanel-${index}`}
      aria-labelledby={`wallet-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

interface Asset {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  change24h: number;
  icon?: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'trade' | 'transfer';
  symbol: string;
  amount: number;
  value: number;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
}

interface BalanceHistoryPoint {
  date: string;
  balance: number;
}

const Wallet: React.FC = () => {
  const theme = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  
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

  // Se o usuário não tem plano, começar na aba 1 (Carteira Real) em vez de 0 (Carteira Virtual)
  const [tabValue, setTabValue] = useState(() => {
    // Se não tem plano, começar na Carteira Real (index 1)
    // Se tem plano, começar na Carteira Virtual (index 0)
    return hasActivePlan ? 0 : 1;
  });
  
  // Ajustar tabValue se o usuário perder o plano
  useEffect(() => {
    if (!hasActivePlan && tabValue === 0) {
      setTabValue(1); // Mover para Carteira Real se estava na Virtual
    }
  }, [hasActivePlan, tabValue]);
  
  // Função helper para obter o tipo de carteira baseado no tabValue
  const getWalletType = (): 'virtual' | 'real' => {
    return tabValue === 0 ? 'virtual' : 'real';
  };
  
  // Função helper para obter a carteira atual
  const getCurrentWallet = (): Asset[] => {
    return tabValue === 0 ? virtualWallet : realWallet;
  };
  const [openDepositDialog, setOpenDepositDialog] = useState(false);
  const [openWithdrawDialog, setOpenWithdrawDialog] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Estado das carteiras vindas da API
  const [virtualWallet, setVirtualWallet] = useState<Asset[]>([]);
  const [realWallet, setRealWallet] = useState<Asset[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [engbotTokens, setEngbotTokens] = useState<number>(0);
  const [buyTokenAmount, setBuyTokenAmount] = useState<string>('100');
  const [openBuyTokensDialog, setOpenBuyTokensDialog] = useState(false);

  // Estados para Super Créditos
  const [openSuperCreditsDialog, setOpenSuperCreditsDialog] = useState(false);
  const [openSuperCreditsTermsDialog, setOpenSuperCreditsTermsDialog] = useState(false);
  const [superCreditsMethod, setSuperCreditsMethod] = useState<'purchase' | 'tester' | null>(null);
  const [superCreditsTermsAccepted, setSuperCreditsTermsAccepted] = useState(false);
  const [purchaseSuperCreditsAmount, setPurchaseSuperCreditsAmount] = useState<number>(1);
  const [bitcoinTxHash, setBitcoinTxHash] = useState('');

  // Platform Settings e Bitcoin Transaction
  const { data: platformSettings } = useGetPlatformSettingsQuery();
  const [createBitcoinTransaction, createTransactionResult] = useCreateBitcoinTransactionMutation();
  useMutationAlert(createTransactionResult);

  // Histórico de saldo
  const [virtualBalanceHistory, setVirtualBalanceHistory] = useState<BalanceHistoryPoint[]>([]);
  const [realBalanceHistory, setRealBalanceHistory] = useState<BalanceHistoryPoint[]>([]);
  
  // P&L de hoje
  const [virtualPnLToday, setVirtualPnLToday] = useState<{ value: number; percent: number }>({ value: 0, percent: 0 });
  const [realPnLToday, setRealPnLToday] = useState<{ value: number; percent: number }>({ value: 0, percent: 0 });

  // Função para converter WalletType em Asset
  const convertWalletToAsset = (wallet: WalletType): Asset => ({
    symbol: wallet.symbol,
    name: wallet.name,
    balance: wallet.balance,
    value: wallet.value,
    change24h: 0 // Pode ser calculado no futuro
  });

  // Função para carregar histórico de saldo do localStorage
  const loadBalanceHistory = (walletType: 'virtual' | 'real'): BalanceHistoryPoint[] => {
    try {
      const key = `wallet_balance_history_${walletType}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de saldo:', error);
    }
    return [];
  };

  // Função para salvar histórico de saldo no localStorage
  const saveBalanceHistory = (walletType: 'virtual' | 'real', history: BalanceHistoryPoint[]) => {
    try {
      const key = `wallet_balance_history_${walletType}`;
      // Manter apenas os últimos 100 pontos para não ocupar muito espaço
      const limitedHistory = history.slice(-100);
      localStorage.setItem(key, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Erro ao salvar histórico de saldo:', error);
    }
  };

  // Função para calcular P&L de hoje
  const calculateTodayPnL = (walletType: 'virtual' | 'real', currentBalance: number) => {
    const history = walletType === 'virtual' ? virtualBalanceHistory : realBalanceHistory;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Encontrar o primeiro ponto do histórico de hoje
    const todayStartPoint = history.find(point => {
      const pointDate = new Date(point.date);
      pointDate.setHours(0, 0, 0, 0);
      return pointDate.getTime() === today.getTime();
    });
    
    // Se não houver ponto de hoje, procurar o último ponto antes de hoje
    let startBalance = currentBalance;
    if (todayStartPoint) {
      startBalance = todayStartPoint.balance;
    } else {
      // Procurar o último ponto antes de hoje
      const beforeToday = history.filter(point => {
        const pointDate = new Date(point.date);
        pointDate.setHours(0, 0, 0, 0);
        return pointDate.getTime() < today.getTime();
      });
      if (beforeToday.length > 0) {
        startBalance = beforeToday[beforeToday.length - 1].balance;
      } else if (history.length > 0) {
        // Se não houver ponto antes de hoje, usar o primeiro ponto do histórico
        startBalance = history[0].balance;
      }
    }
    
    // Calcular P&L
    const pnlValue = currentBalance - startBalance;
    const pnlPercent = startBalance > 0 ? (pnlValue / startBalance) * 100 : 0;
    
    if (walletType === 'virtual') {
      setVirtualPnLToday({ value: pnlValue, percent: pnlPercent });
    } else {
      setRealPnLToday({ value: pnlValue, percent: pnlPercent });
    }
  };

  // Função para atualizar histórico de saldo
  const updateBalanceHistory = (walletType: 'virtual' | 'real', currentBalance: number) => {
    const now = new Date().toISOString();
    
    // Usar função de atualização para garantir que temos o estado mais recente
    if (walletType === 'virtual') {
      setVirtualBalanceHistory(prevHistory => {
        // Verificar se já existe um ponto para hoje (mesmo dia)
        const today = new Date().toDateString();
        const lastPoint = prevHistory[prevHistory.length - 1];
        const lastPointDate = lastPoint ? new Date(lastPoint.date).toDateString() : null;
        
        // Se o último ponto é de hoje e o saldo não mudou significativamente, não adicionar
        if (lastPointDate === today && Math.abs(lastPoint.balance - currentBalance) < 0.01) {
          return prevHistory;
        }
        
        // Adicionar novo ponto
        const newHistory = [...prevHistory, { date: now, balance: currentBalance }];
        saveBalanceHistory('virtual', newHistory);
        return newHistory;
      });
    } else {
      setRealBalanceHistory(prevHistory => {
        // Verificar se já existe um ponto para hoje (mesmo dia)
        const today = new Date().toDateString();
        const lastPoint = prevHistory[prevHistory.length - 1];
        const lastPointDate = lastPoint ? new Date(lastPoint.date).toDateString() : null;
        
        // Se o último ponto é de hoje e o saldo não mudou significativamente, não adicionar
        if (lastPointDate === today && Math.abs(lastPoint.balance - currentBalance) < 0.01) {
          return prevHistory;
        }
        
        // Adicionar novo ponto
        const newHistory = [...prevHistory, { date: now, balance: currentBalance }];
        saveBalanceHistory('real', newHistory);
        return newHistory;
      });
    }
  };

  // Garantir saldo mínimo de $1000 na carteira virtual
  const ensureMinimumVirtualBalance = async () => {
    try {
      const MINIMUM_BALANCE = 1000;
      const virtualWallets = await walletAPI.getUserWallets('virtual');
      
      // Calcular saldo total virtual
      const totalBalance = virtualWallets.reduce((sum, wallet) => sum + wallet.value, 0);
      
      // Se o saldo total for menor que o mínimo, ajustar
      if (totalBalance < MINIMUM_BALANCE) {
        const difference = MINIMUM_BALANCE - totalBalance;
        
        // Buscar ou criar carteira USDT
        const usdtWallet = virtualWallets.find(w => w.symbol === 'USDT');
        
        if (usdtWallet) {
          // Atualizar saldo USDT existente
          await walletAPI.updateWalletBalance({
            type: 'virtual',
            symbol: 'USDT',
            name: usdtWallet.name,
            balance: usdtWallet.balance + difference,
            value: usdtWallet.value + difference
          });
        } else {
          // Criar nova carteira USDT
          await walletAPI.updateWalletBalance({
            type: 'virtual',
            symbol: 'USDT',
            name: 'US Dollar Tether',
            balance: difference,
            value: difference
          });
        }
        
        console.log(`Saldo virtual ajustado: adicionados $${difference.toFixed(2)} para manter mínimo de $${MINIMUM_BALANCE}`);
      }
    } catch (err: any) {
      console.error('Erro ao garantir saldo mínimo virtual:', err);
      // Não mostrar erro ao usuário, apenas logar
    }
  };

  // Carregar dados das carteiras
  const loadWallets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Garantir saldo mínimo antes de carregar
      await ensureMinimumVirtualBalance();
      
      const groupedWallets = await walletAPI.getGroupedWallets();
      
      // Filtrar ativos com saldo muito baixo (threshold de 0.00000001)
      const ZERO_THRESHOLD = 0.00000001;
      
      const filteredVirtual = groupedWallets.virtual
        .map(convertWalletToAsset)
        .filter(asset => asset.balance > ZERO_THRESHOLD);
        
      const filteredReal = groupedWallets.real
        .map(convertWalletToAsset)
        .filter(asset => asset.balance > ZERO_THRESHOLD);
      
      setVirtualWallet(filteredVirtual);
      setRealWallet(filteredReal);

      // Atualizar histórico de saldo
      const virtualTotal = filteredVirtual.reduce((sum, asset) => sum + asset.value, 0);
      const realTotal = filteredReal.reduce((sum, asset) => sum + asset.value, 0);
      
      // Verificar novamente após carregar (caso tenha ficado abaixo durante o processo)
      if (virtualTotal < 1000) {
        await ensureMinimumVirtualBalance();
        // Recarregar carteiras após ajuste
        const updatedWallets = await walletAPI.getGroupedWallets();
        const updatedFilteredVirtual = updatedWallets.virtual
          .map(convertWalletToAsset)
          .filter(asset => asset.balance > ZERO_THRESHOLD);
        setVirtualWallet(updatedFilteredVirtual);
        const updatedVirtualTotal = updatedFilteredVirtual.reduce((sum, asset) => sum + asset.value, 0);
        updateBalanceHistory('virtual', updatedVirtualTotal);
      } else {
        updateBalanceHistory('virtual', virtualTotal);
      }
      
      updateBalanceHistory('real', realTotal);
    } catch (err: any) {
      console.error('Erro ao carregar carteiras:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Recalcular P&L de hoje quando o histórico ou saldo mudar
  useEffect(() => {
    const virtualTotal = virtualWallet.reduce((sum, asset) => sum + asset.value, 0);
    const realTotal = realWallet.reduce((sum, asset) => sum + asset.value, 0);
    
    if (virtualBalanceHistory.length > 0) {
      calculateTodayPnL('virtual', virtualTotal);
    }
    if (realBalanceHistory.length > 0) {
      calculateTodayPnL('real', realTotal);
    }
  }, [virtualBalanceHistory, realBalanceHistory, virtualWallet, realWallet]);

  // Carregar tokens ENGBOT do usuário
  const loadEngbotTokens = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/challenges/stats/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEngbotTokens(data.tokens || 0);
      }
    } catch (err: any) {
      console.error('Erro ao carregar tokens ENGBOT:', err);
    }
  };

  // Comprar tokens ENGBOT
  const handleBuyTokens = async () => {
    const amount = parseInt(buyTokenAmount);
    if (amount > 0 && amount <= 10000) {
      try {
        setLoading(true);
        setError(null);
        
        // Buscar tokens atuais
        const currentTokensResponse = await fetch(`http://localhost:5000/api/challenges/stats/${user?.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (!currentTokensResponse.ok) {
          throw new Error('Erro ao buscar tokens atuais');
        }

        const currentData = await currentTokensResponse.json();
        const newTokenAmount = (currentData.tokens || 0) + amount;

        // Atualizar tokens (incrementar)
        const response = await fetch(`http://localhost:5000/api/challenges/stats/${user?.id}/tokens`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            tokens: newTokenAmount,
            totalWins: currentData.totalWins || 0,
            totalLosses: currentData.totalLosses || 0,
            totalProfit: currentData.totalProfit || 0
          })
        });

        if (response.ok) {
          await loadEngbotTokens();
          setMessage({
            type: 'success',
            text: `Você comprou ${amount.toLocaleString()} tokens ENGBOT com sucesso!`
          });
          setTimeout(() => setMessage(null), 5000);
          setBuyTokenAmount('100');
          setOpenBuyTokensDialog(false);
        } else {
          const errorData = await response.json();
          setError(`Erro ao comprar tokens: ${errorData.error || 'Erro desconhecido'}`);
        }
      } catch (err: any) {
        setError(`Erro ao comprar tokens: ${err.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      setError('Quantidade inválida. Digite um valor entre 1 e 10.000 tokens.');
    }
  };

  // Inicializar carteira virtual se ainda não existir
  const initializeVirtualWalletIfNeeded = async () => {
    try {
      const virtualWallets = await walletAPI.getUserWallets('virtual');
      
      // Se não há carteira virtual USDT, inicializar com $10,000
      if (!virtualWallets.some(w => w.symbol === 'USDT')) {
        await walletAPI.initializeVirtualWallet();
        
        // Adicionar transação de depósito inicial
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          type: 'deposit',
          symbol: 'USDT',
          amount: 10000,
          value: 10000,
          date: new Date(),
          status: 'completed'
        };
        setTransactions([newTransaction]);
        
        // Adicionar ponto inicial no histórico
        const initialHistory: BalanceHistoryPoint[] = [{ 
          date: new Date().toISOString(), 
          balance: 10000 
        }];
        setVirtualBalanceHistory(initialHistory);
        saveBalanceHistory('virtual', initialHistory);
        
        // Recarregar carteiras
        await loadWallets();
      }
    } catch (err: any) {
      console.error('Erro ao inicializar carteira virtual:', err);
      // Se falhar, continuamos normalmente
    }
  };

  // Effect para carregar dados iniciais
  useEffect(() => {
    const initializeData = async () => {
      // Carregar histórico de saldo do localStorage
      setVirtualBalanceHistory(loadBalanceHistory('virtual'));
      setRealBalanceHistory(loadBalanceHistory('real'));
      
      await initializeVirtualWalletIfNeeded();
      await loadWallets();
      await loadEngbotTokens();
    };
    
    initializeData();
  }, [user?.id]);

  // Recarregar tokens quando mudar de aba
  useEffect(() => {
    if (tabValue === 2) {
      loadEngbotTokens();
    }
  }, [tabValue]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const currentWallet = getCurrentWallet();
  const totalBalance = currentWallet.reduce((sum, asset) => sum + asset.value, 0);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (amount > 0) {
      try {
        setLoading(true);
        const walletType = getWalletType();
        
        await walletAPI.depositFunds(walletType, selectedAsset, amount);
        
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          type: 'deposit',
          symbol: selectedAsset,
          amount,
          value: amount,
          date: new Date(),
          status: 'completed'
        };
        setTransactions([newTransaction, ...transactions]);
        
        // Recarregar carteiras
        await loadWallets();
        
        setDepositAmount('');
        setOpenDepositDialog(false);
      } catch (err: any) {
        setError(`Erro ao depositar: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (amount > 0) {
      try {
        setLoading(true);
        const walletType = getWalletType();
        
        // Verificar se o saque vai zerar o ativo
        const currentWallet = getCurrentWallet();
        const asset = currentWallet.find(a => a.symbol === selectedAsset);
        const willBeZero = asset && (asset.balance - amount) <= 0;
        
        await walletAPI.withdrawFunds(walletType, selectedAsset, amount);
        
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          type: 'withdraw',
          symbol: selectedAsset,
          amount: -amount,
          value: -amount,
          date: new Date(),
          status: 'completed'
        };
        setTransactions([newTransaction, ...transactions]);
        
        // Mostrar mensagem se o ativo foi removido
        if (willBeZero) {
          setError(null); // Limpar erros anteriores
          setMessage({ 
            type: 'info', 
            text: `Ativo ${selectedAsset} removido da carteira (saldo zerado)` 
          });
          setTimeout(() => setMessage(null), 5000); // Remover mensagem após 5s
        }
        
        // Recarregar carteiras
        await loadWallets();
        
        setWithdrawAmount('');
        setOpenWithdrawDialog(false);
      } catch (err: any) {
        setError(`Erro ao sacar: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Limpar ativos com saldo zero
  const handleCleanupZeroBalances = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await walletAPI.cleanupZeroBalances();
      
      if (result.cleanedCount > 0) {
        setMessage({
          type: 'success',
          text: `${result.cleanedCount} ativo(s) com saldo zero foram removidos da carteira`
        });
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({
          type: 'info',
          text: 'Nenhum ativo com saldo zero encontrado'
        });
        setTimeout(() => setMessage(null), 3000);
      }
      
      // Recarregar carteiras para refletir as mudanças
      await loadWallets();
    } catch (err: any) {
      setError(`Erro ao limpar saldos zero: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <Add color="success" />;
      case 'withdraw': return <Remove color="error" />;
      case 'trade': return <SwapHoriz color="primary" />;
      case 'transfer': return <SwapHoriz color="secondary" />;
      default: return <History />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        color: theme.palette.primary.main,
        fontWeight: 'bold'
      }}>
        <AccountBalanceWallet />
        Carteira
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <LinearProgress sx={{ width: '100%' }} />
        </Box>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={hasActivePlan ? tabValue : (tabValue === 0 ? 1 : tabValue - 1)} 
          onChange={(_, newValue) => {
            // Ajustar o índice baseado no plano
            if (hasActivePlan) {
              setTabValue(newValue);
            } else {
              // Se não tem plano, ajustar: newValue 0 = Real (index 1), newValue 1 = ENGBOT (index 2)
              setTabValue(newValue + 1);
            }
          }} 
          aria-label="wallet tabs"
        >
          {hasActivePlan && (
            <Tab 
              label="Carteira Virtual" 
              icon={<ShowChart />}
              iconPosition="start"
            />
          )}
          <Tab 
            label="Carteira Real" 
            icon={<AttachMoney />}
            iconPosition="start"
          />
          <Tab 
            label="Carteira ENGBOT" 
            icon={<AccountBalanceWallet />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Resumo da Carteira Virtual */}
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Carteira Virtual:</strong> Use para praticar trading sem risco financeiro. 
                Você já recebeu $10,000 virtuais para começar - não é necessário depositar fundos adicionais.
              </Typography>
            </Alert>
          </Grid>
          
          {/* Cards de Resumo */}
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box flex={1}>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Saldo Total Virtual
                    </Typography>
                    <Typography variant="h5" component="h2" color="primary" sx={{ fontWeight: 'bold' }}>
                      ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, ml: 2 }}>
                    <AccountBalanceWallet />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box flex={1}>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      P&L Hoje
                    </Typography>
                    <Typography 
                      variant="h5" 
                      color={virtualPnLToday.value >= 0 ? 'success.main' : 'error.main'} 
                      sx={{ fontWeight: 'bold' }}
                    >
                      {virtualPnLToday.value >= 0 ? '+' : ''}${virtualPnLToday.value.toFixed(2)} ({virtualPnLToday.percent >= 0 ? '+' : ''}{virtualPnLToday.percent.toFixed(2)}%)
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: virtualPnLToday.value >= 0 ? 'success.main' : 'error.main', ml: 2 }}>
                    {virtualPnLToday.value >= 0 ? <TrendingUp /> : <TrendingDown />}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box flex={1}>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Ativos
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {virtualWallet.length}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.secondary.main, ml: 2 }}>
                    <ShowChart />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de Evolução do Saldo - Carteira Virtual */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Evolução do Saldo
                </Typography>
                <BalanceChart 
                  data={virtualBalanceHistory} 
                  color={theme.palette.primary.main}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {/* Resumo da Carteira Real */}
          <Grid item xs={12}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Carteira Real:</strong> Conecte sua conta de exchange real para trading com dinheiro real. 
                Tenha cuidado e trade com responsabilidade.
              </Typography>
            </Alert>
          </Grid>
          
          {/* Cards de Resumo */}
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.warning.main}20, ${theme.palette.error.main}20)`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box flex={1}>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Saldo Total Real
                    </Typography>
                    <Typography variant="h5" component="h2" color="warning.main" sx={{ fontWeight: 'bold' }}>
                      ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.warning.main, ml: 2 }}>
                    <AttachMoney />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box flex={1}>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      P&L Hoje
                    </Typography>
                    <Typography 
                      variant="h5" 
                      color={realPnLToday.value >= 0 ? 'success.main' : 'error.main'} 
                      sx={{ fontWeight: 'bold' }}
                    >
                      {realPnLToday.value >= 0 ? '+' : ''}${realPnLToday.value.toFixed(2)} ({realPnLToday.percent >= 0 ? '+' : ''}{realPnLToday.percent.toFixed(2)}%)
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: realPnLToday.value >= 0 ? 'success.main' : 'error.main', ml: 2 }}>
                    {realPnLToday.value >= 0 ? <TrendingUp /> : <TrendingDown />}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box flex={1}>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Ativos
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {realWallet.length}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.info.main, ml: 2 }}>
                    <ShowChart />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de Evolução do Saldo - Carteira Real */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Evolução do Saldo
                </Typography>
                <BalanceChart 
                  data={realBalanceHistory} 
                  color={theme.palette.warning.main}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {/* Resumo da Carteira ENGBOT */}
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Carteira ENGBOT:</strong> Tokens ENGBOT são usados para participar de desafios entre robôs. 
                Compre tokens para desafiar outros usuários e competir por prêmios.
              </Typography>
            </Alert>
          </Grid>
          
          {/* Cards de Resumo */}
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.secondary.main}20, ${theme.palette.primary.main}20)`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box flex={1}>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Tokens ENGBOT
                    </Typography>
                    <Typography variant="h5" component="h2" color="secondary" sx={{ fontWeight: 'bold' }}>
                      🪙 {engbotTokens.toLocaleString()}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.secondary.main, ml: 2 }}>
                    <AccountBalanceWallet />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box flex={1}>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Preço por Token
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      $0.10
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.info.main, ml: 2 }}>
                    <AttachMoney />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box flex={1}>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Valor Total
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      ${(engbotTokens * 0.10).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.success.main, ml: 2 }}>
                    <TrendingUp />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Super Créditos de Incentivo */}
          <Grid item xs={12}>
            <Card sx={{ border: '2px solid', borderColor: 'warning.main' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Star color="warning" />
                  <Typography variant="h6" gutterBottom sx={{ mb: 0, fontWeight: 'bold' }}>
                    Super Créditos de Incentivo
                  </Typography>
                </Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Os Super Créditos são instrumentos internos de incentivo e reconhecimento, destinados exclusivamente a apoiar o desenvolvimento inicial do ecossistema.
                    Eles não se confundem com o token ENGBOT e não constituem instrumentos financeiros ou ativos negociáveis.
                  </Typography>
                </Alert>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Você pode adquirir Super Créditos através de duas formas:
                </Typography>
                <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                  <Typography component="li" variant="body2" paragraph>
                    <strong>Aquisição Direta:</strong> Compra direta em condições restritas e específicas
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    <strong>Como Testador:</strong> Participe como testador qualificado, teste a plataforma e reporte erros significativos
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="warning"
                  size="large"
                  fullWidth
                  startIcon={<Star />}
                  onClick={() => setOpenSuperCreditsDialog(true)}
                  sx={{ mt: 2 }}
                >
                  Adquirir Super Créditos
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Informações sobre Tokens */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sobre os Tokens ENGBOT
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <Typography component="li" variant="body2" paragraph>
                    Tokens são usados para participar de desafios entre robôs de trading
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Ao vencer um desafio, você ganha os tokens apostados pelo oponente
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Use tokens para desafiar outros usuários e competir por prêmios
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Os tokens não expiram e podem ser acumulados ao longo do tempo
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Ações da Carteira */}
      <Box sx={{ my: 3 }}>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadWallets}
              disabled={loading}
            >
              Atualizar
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<CleaningServices />}
              onClick={handleCleanupZeroBalances}
              disabled={loading}
              color="warning"
            >
              Limpar Saldos Zero
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Tabela de Ativos */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ativos na Carteira {tabValue === 0 ? 'Virtual' : 'Real'}
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ativo</TableCell>
                      <TableCell align="right">Saldo</TableCell>
                      <TableCell align="right">Valor (USD)</TableCell>
                      <TableCell align="right">24h %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentWallet.map((asset) => (
                      <TableRow key={asset.symbol}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                              {asset.symbol.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {asset.symbol}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {asset.name}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {asset.balance.toLocaleString('en-US', { 
                            minimumFractionDigits: asset.symbol === 'USD' ? 2 : 8 
                          })}
                        </TableCell>
                        <TableCell align="right">
                          ${asset.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            color={asset.change24h >= 0 ? 'success.main' : 'error.main'}
                          >
                            {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Histórico de Transações */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transações Recentes
              </Typography>
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {transactions.slice(0, 10).map((transaction) => (
                  <Box 
                    key={transaction.id} 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="space-between"
                    py={1}
                    borderBottom="1px solid"
                    borderColor="divider"
                  >
                    <Box display="flex" alignItems="center">
                      {getTypeIcon(transaction.type)}
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {transaction.symbol}
                        </Typography>
                      </Box>
                    </Box>
                    <Box textAlign="right">
                      <Typography 
                        variant="body2"
                        color={transaction.amount >= 0 ? 'success.main' : 'error.main'}
                      >
                        {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                      </Typography>
                      <Chip 
                        label={transaction.status} 
                        size="small" 
                        color={getStatusColor(transaction.status) as any}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog de Depósito */}
      <Dialog open={openDepositDialog} onClose={() => setOpenDepositDialog(false)}>
        <DialogTitle>Depositar Fundos</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300, pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Ativo</InputLabel>
              <Select
                value={selectedAsset}
                label="Ativo"
                onChange={(e) => setSelectedAsset(e.target.value)}
              >
                <MenuItem value="USD">USD - Dólar Americano</MenuItem>
                <MenuItem value="BTC">BTC - Bitcoin</MenuItem>
                <MenuItem value="ETH">ETH - Ethereum</MenuItem>
              </Select>
            </FormControl>
            <TextField
              autoFocus
              margin="dense"
              label="Valor"
              type="number"
              fullWidth
              variant="outlined"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              InputProps={{
                startAdornment: selectedAsset === 'USD' ? '$' : ''
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDepositDialog(false)}>Cancelar</Button>
          <Button onClick={handleDeposit} variant="contained">Depositar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Saque */}
      <Dialog open={openWithdrawDialog} onClose={() => setOpenWithdrawDialog(false)}>
        <DialogTitle>Sacar Fundos</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300, pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Ativo</InputLabel>
              <Select
                value={selectedAsset}
                label="Ativo"
                onChange={(e) => setSelectedAsset(e.target.value)}
              >
                {currentWallet.map((asset) => (
                  <MenuItem key={asset.symbol} value={asset.symbol}>
                    {asset.symbol} - Saldo: {asset.balance.toFixed(2)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              autoFocus
              margin="dense"
              label="Valor"
              type="number"
              fullWidth
              variant="outlined"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              InputProps={{
                startAdornment: selectedAsset === 'USD' ? '$' : ''
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWithdrawDialog(false)}>Cancelar</Button>
          <Button onClick={handleWithdraw} variant="contained" color="error">Sacar</Button>jkh


        </DialogActions>
      </Dialog>

      {/* Dialog de Comprar Tokens ENGBOT */}
      <Dialog open={openBuyTokensDialog} onClose={() => setOpenBuyTokensDialog(false)}>
        <DialogTitle>Comprar Tokens ENGBOT</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300, pt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Você está prestes a comprar <strong>{buyTokenAmount ? parseInt(buyTokenAmount).toLocaleString() : '0'}</strong> tokens ENGBOT.
            </Alert>
            <Typography variant="body1" gutterBottom>
              <strong>Quantidade:</strong> {buyTokenAmount ? parseInt(buyTokenAmount).toLocaleString() : '0'} tokens
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Preço por token:</strong> $0.10
            </Typography>
            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
              <strong>Total:</strong> ${buyTokenAmount ? (parseInt(buyTokenAmount) * 0.10).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </Typography>
            <Alert severity="warning" sx={{ mt: 2 }}>
              Esta é uma transação simulada. Em produção, você seria redirecionado para um sistema de pagamento real.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBuyTokensDialog(false)}>Cancelar</Button>
          <Button onClick={handleBuyTokens} variant="contained" color="primary" disabled={loading}>
            {loading ? 'Processando...' : 'Confirmar Compra'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Seleção de Método - Super Créditos */}
      <Dialog 
        open={openSuperCreditsDialog} 
        onClose={() => {
          setOpenSuperCreditsDialog(false);
          setSuperCreditsMethod(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Star color="warning" />
            <Typography variant="h6" component="span">
              Adquirir Super Créditos
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Escolha como deseja adquirir Super Créditos de Incentivo:
              </Typography>
            </Alert>
            
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
                Método de Aquisição
              </FormLabel>
              <RadioGroup
                value={superCreditsMethod || ''}
                onChange={(e) => setSuperCreditsMethod(e.target.value as 'purchase' | 'tester')}
              >
                <FormControlLabel
                  value="purchase"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        <AttachMoney sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Aquisição Direta
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Compra direta em condições restritas e específicas
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                />
                <FormControlLabel
                  value="tester"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        <BugReport sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Como Testador
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Teste a plataforma e reporte erros significativos para se qualificar
                      </Typography>
                    </Box>
                  }
                  sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                />
              </RadioGroup>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenSuperCreditsDialog(false);
            setSuperCreditsMethod(null);
          }}>
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              setOpenSuperCreditsDialog(false);
              setOpenSuperCreditsTermsDialog(true);
            }}
            variant="contained"
            color="warning"
            disabled={!superCreditsMethod}
          >
            Continuar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Termos - Super Créditos */}
      <Dialog
        open={openSuperCreditsTermsDialog}
        onClose={undefined}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Star color="warning" />
            <Typography variant="h6" component="span" fontWeight="bold">
              Termos do Programa de Super Créditos de Incentivo
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="bold">
              Leia atentamente os termos abaixo antes de prosseguir com a aquisição de Super Créditos.
            </Typography>
          </Alert>

          <Box sx={{ maxHeight: '60vh', overflowY: 'auto', pr: 1 }}>
            <Typography variant="body1" paragraph sx={{ textAlign: 'justify', fontWeight: 'bold' }}>
              10.1 Origem e Limite de Alocação
            </Typography>
            <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
              Os Super Créditos poderão ser originados a partir de uma realocação limitada e controlada de até 5% da alocação originalmente destinada à categoria "Desenvolvimento e Infraestrutura", sem impacto sobre as recompensas de desafios, rankings ou demais mecanismos meritocráticos do ecossistema.
            </Typography>
            <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
              A eventual utilização de recursos financeiros associados ao programa estará limitada, discricionária e condicionada à sustentabilidade operacional da plataforma, não gerando direito adquirido, expectativa de continuidade ou obrigação de distribuição.
            </Typography>

            <Typography variant="body1" paragraph sx={{ textAlign: 'justify', fontWeight: 'bold', mt: 3 }}>
              10.2 Forma de Aquisição
            </Typography>
            <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
              Os Super Créditos poderão ser concedidos exclusivamente por meio de:
            </Typography>
            <Box component="ul" sx={{ pl: 4, mb: 2 }}>
              <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>participação qualificada como testador do sistema, mediante critérios técnicos, operacionais ou de contribuição definidos pela plataforma;</Typography></li>
              <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>aquisição direta em condições restritas, específicas e previamente documentadas, voltadas ao apoio do desenvolvimento do projeto.</Typography></li>
            </Box>
            <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
              O programa não constitui oferta pública, sendo restrito a participantes previamente elegíveis, mediante convite ou critérios internos objetivos.
            </Typography>

            <Typography variant="body1" paragraph sx={{ textAlign: 'justify', fontWeight: 'bold', mt: 3 }}>
              10.3 Natureza Jurídica e Funcional
            </Typography>
            <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
              Os Super Créditos representam instrumentos internos de incentivo e reconhecimento, vinculados a termos específicos de participação, não configurando, em nenhuma hipótese:
            </Typography>
            <Box component="ul" sx={{ pl: 4, mb: 2 }}>
              <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>token utilitário ou criptativo;</Typography></li>
              <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>valor mobiliário ou instrumento financeiro;</Typography></li>
              <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>participação societária;</Typography></li>
              <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>promessa, garantia ou expectativa de retorno econômico;</Typography></li>
              <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>direito subjetivo a lucros, dividendos ou receitas da plataforma.</Typography></li>
            </Box>
            <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
              Sua concessão e eventual utilização dependem da adesão expressa aos termos do programa, podendo ser ajustados, suspensos ou encerrados a qualquer tempo.
            </Typography>

            <Typography variant="body1" paragraph sx={{ textAlign: 'justify', fontWeight: 'bold', mt: 3 }}>
              10.5 Limitações, Transferência e Restrições
            </Typography>
            <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
              Os Super Créditos:
            </Typography>
            <Box component="ul" sx={{ pl: 4, mb: 2 }}>
              <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>não são transferíveis;</Typography></li>
              <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>não são negociáveis;</Typography></li>
              <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>não possuem valor de mercado;</Typography></li>
              <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>não podem ser revendidos, cedidos ou utilizados como instrumento de troca.</Typography></li>
            </Box>
            <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
              Sua validade está condicionada à manutenção do vínculo do participante com a plataforma e ao cumprimento das regras do programa.
            </Typography>

            <Typography variant="body1" paragraph sx={{ textAlign: 'justify', fontWeight: 'bold', mt: 3 }}>
              10.6 Transparência, Governança e Encerramento
            </Typography>
            <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
              Os critérios gerais do programa, sua duração e eventuais alterações serão comunicados de forma clara e transparente aos participantes elegíveis.
            </Typography>
            <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
              A plataforma poderá, a qualquer tempo, revisar, modificar, suspender ou encerrar o Programa de Super Créditos de Incentivo, sem que isso configure descumprimento contratual ou gere direito a compensações.
            </Typography>
          </Box>

          {/* Formulário de compra Bitcoin */}
          {superCreditsMethod === 'purchase' && (
            <Box sx={{ 
              mt: 3, 
              pt: 2, 
              borderTop: '1px solid', 
              borderColor: 'divider',
              p: 2,
              bgcolor: 'info.light',
              borderRadius: 1
            }}>
              <Typography variant="body1" fontWeight="bold" gutterBottom color="info.dark">
                Informações de Pagamento Bitcoin
              </Typography>
              
              {platformSettings?.bitcoinWalletAddress ? (
                <>
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                      Endereço da Carteira para Envio:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace', 
                        wordBreak: 'break-all',
                        bgcolor: 'grey.100',
                        p: 1,
                        borderRadius: 0.5,
                        mt: 1
                      }}
                    >
                      {platformSettings.bitcoinWalletAddress}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Preço: <strong>0.00025 BTC</strong> por Super Crédito
                    </Typography>
                  </Box>

                  <TextField
                    fullWidth
                    type="number"
                    label="Quantidade de Super Créditos"
                    value={purchaseSuperCreditsAmount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setPurchaseSuperCreditsAmount(Math.max(1, value));
                    }}
                    inputProps={{ min: 1 }}
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ mb: 2, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>Total a pagar:</strong> {(purchaseSuperCreditsAmount * 0.00025).toFixed(8)} BTC
                    </Typography>
                  </Box>

                  <TextField
                    fullWidth
                    label="Hash da Transação (opcional)"
                    value={bitcoinTxHash}
                    onChange={(e) => setBitcoinTxHash(e.target.value)}
                    placeholder="Cole o hash da sua transação Bitcoin aqui"
                    sx={{ mb: 2 }}
                    helperText="Você pode informar o hash da transação após o pagamento, ou deixar em branco e informar depois."
                  />
                </>
              ) : (
                <Alert severity="warning">
                  Endereço Bitcoin não configurado. Entre em contato com o suporte.
                </Alert>
              )}
            </Box>
          )}

          {/* Mensagem informativa para testadores */}
          {superCreditsMethod === 'tester' && (
            <Box sx={{ 
              mt: 3, 
              pt: 2, 
              borderTop: '1px solid', 
              borderColor: 'divider',
              p: 2,
              bgcolor: 'info.light',
              borderRadius: 1
            }}>
              <Typography variant="body1" fontWeight="bold" gutterBottom color="info.dark">
                Como Enviar Correções e Problemas
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Para reportar problemas, erros ou sugestões de correção identificados durante seus testes na plataforma, utilize a <strong>aba Chat</strong> disponível no menu lateral.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                As mensagens enviadas através do chat serão avaliadas pelos administradores. Ao reportar problemas significativos e úteis, você poderá receber 1 Super Crédito após a aprovação.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Importante:</strong> Certifique-se de descrever detalhadamente o problema identificado, incluindo passos para reproduzi-lo, se aplicável.
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={superCreditsTermsAccepted}
                  onChange={(e) => setSuperCreditsTermsAccepted(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2" fontWeight="bold">
                  Eu li e concordo com todos os termos do Programa de Super Créditos de Incentivo descritos acima
                </Typography>
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenSuperCreditsTermsDialog(false);
              setSuperCreditsTermsAccepted(false);
              setSuperCreditsMethod(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              if (superCreditsMethod === 'purchase') {
                // Aquisição direta via Bitcoin
                if (!user?.id) {
                  setMessage({ type: 'error', text: 'Usuário não autenticado.' });
                  return;
                }

                if (!platformSettings?.bitcoinWalletAddress) {
                  setMessage({ 
                    type: 'error', 
                    text: 'Endereço Bitcoin não configurado. Entre em contato com o suporte.' 
                  });
                  return;
                }

                try {
                  await createBitcoinTransaction({
                    superCreditsAmount: purchaseSuperCreditsAmount,
                    txHash: bitcoinTxHash || undefined
                  }).unwrap();

                  setMessage({
                    type: 'success',
                    text: `Transação Bitcoin criada com sucesso! Você solicitou ${purchaseSuperCreditsAmount} Super Crédito(s). Aguarde a aprovação do administrador.`
                  });
                } catch (error: any) {
                  setMessage({
                    type: 'error',
                    text: error?.data?.error || 'Erro ao criar transação Bitcoin. Tente novamente.'
                  });
                  return;
                }
              } else if (superCreditsMethod === 'tester') {
                // Testador: salvar solicitação pendente (sem descrição, pois será feita via chat)
                if (user?.id) {
                  const testerRequests = JSON.parse(localStorage.getItem('testerRequests') || '[]');
                  const newRequest = {
                    id: Date.now().toString(),
                    userId: user.id,
                    userName: user.name,
                    userEmail: user.email,
                    description: '', // Descrição será enviada via chat
                    status: 'pending', // pending, approved, rejected
                    createdAt: new Date().toISOString(),
                    approvedAt: null,
                    approvedBy: null
                  };
                  testerRequests.push(newRequest);
                  localStorage.setItem('testerRequests', JSON.stringify(testerRequests));
                  
                  // Marcar usuário como testador pendente
                  localStorage.setItem(`testerStatus_${user.id}`, 'pending');
                  
                  // Disparar evento customizado para atualizar a NavBar
                  window.dispatchEvent(new Event('superCreditsUpdated'));
                }
                
                setMessage({
                  type: 'success',
                  text: 'Solicitação para participar como testador enviada com sucesso! Utilize a aba Chat para enviar os problemas identificados. Um administrador avaliará sua solicitação e você será notificado sobre a aprovação.'
                });
              }
              
              setOpenSuperCreditsTermsDialog(false);
              setSuperCreditsTermsAccepted(false);
              setSuperCreditsMethod(null);
              setPurchaseSuperCreditsAmount(1);
              setBitcoinTxHash('');
            }}
            variant="contained"
            color="warning"
            disabled={!superCreditsTermsAccepted || (superCreditsMethod === 'purchase' && (!purchaseSuperCreditsAmount || purchaseSuperCreditsAmount < 1)) || createTransactionResult.isLoading}
          >
            {createTransactionResult.isLoading ? 'Processando...' : 'Confirmar e Continuar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Wallet;