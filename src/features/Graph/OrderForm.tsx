// src/components/OrderForm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  Slider,
  FormControlLabel,
  Checkbox,
  Typography,
  Paper,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  Snackbar,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { tradingAPI, type Order, type Position } from '../../services/tradingAPI';
import { createTrade } from '../../services/tradeAPI';
import { CreateTradeRequest } from '../../types/trade';
import walletAPI, { Wallet as WalletType } from '../../services/walletAPI';

interface OrderFormProps {
  symbol: string;
  currentPrice?: number;
  onOrderCreated?: (order: Order) => void;
  onPositionUpdated?: (positions: Position[]) => void;
  operationMode?: 'real' | 'simulated';
  challengeMode?: boolean;
  challengeId?: string;
  compactMode?: boolean; // Novo prop para modo compacto (duas seções lado a lado)
}

const OrderForm: React.FC<OrderFormProps> = ({ 
  symbol, 
  currentPrice = 0,
  onOrderCreated,
  onPositionUpdated,
  operationMode = 'simulated',
  challengeMode = false,
  challengeId, // Will be used for future challenge integration
  compactMode = false // Novo prop para modo compacto
}) => {
  // Para modo compacto, criar estados separados para compra e venda
  const [buyPrice, setBuyPrice] = useState('');
  const [buyAmount, setBuyAmount] = useState(0);
  const [sellPrice, setSellPrice] = useState('');
  const [sellAmount, setSellAmount] = useState(0);
  const [buyTpSl, setBuyTpSl] = useState(false);
  const [buyTpPrice, setBuyTpPrice] = useState('');
  const [buySlPrice, setBuySlPrice] = useState('');
  const [sellTpSl, setSellTpSl] = useState(false);
  const [sellTpPrice, setSellTpPrice] = useState('');
  const [sellSlPrice, setSellSlPrice] = useState('');
  const user = useSelector((state: RootState) => state.auth.user);
  
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

  // Se não tem plano, forçar modo simulated
  const initialMode = (!hasActivePlan || challengeMode) ? 'simulated' : operationMode;
  const [operationModeState, setOperationModeState] = useState<'real' | 'simulated'>(initialMode);
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  
  // No modo desafio ou sem plano, sempre usar simulated e não permitir mudança
  const currentOperationMode = (challengeMode || !hasActivePlan) ? 'simulated' : operationModeState;
  
  // Garantir que usuários sem plano não possam mudar para real
  useEffect(() => {
    if (!hasActivePlan && operationModeState === 'real') {
      setOperationModeState('simulated');
    }
  }, [hasActivePlan, operationModeState]);
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState(0);
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [useTpSl, setUseTpSl] = useState(false);
  const [tpPrice, setTpPrice] = useState('');
  const [slPrice, setSlPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [walletBalances, setWalletBalances] = useState<WalletType[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);

  // Carregar saldos da carteira virtual
  const loadWalletBalances = async () => {
    if (currentOperationMode === 'simulated') {
      try {
        const virtualWallets = await walletAPI.getUserWallets('virtual');
        setWalletBalances(virtualWallets);
        updateAvailableBalance(virtualWallets);
      } catch (error) {
        console.error('Erro ao carregar saldos da carteira:', error);
      }
    }
  };

  // Atualizar saldo disponível baseado no par de trading e operação
  const updateAvailableBalance = (wallets: WalletType[]) => {
    if (!symbol) return;

    // Extrair moeda base e quote do símbolo (ex: BTCUSDT -> BTC, USDT)
    const baseAsset = symbol.replace('USDT', '').replace('BTC', '').replace('ETH', '');
    const quoteAsset = symbol.includes('USDT') ? 'USDT' : symbol.includes('BTC') ? 'BTC' : 'ETH';

    let balance = 0;
    if (side === 'buy') {
      // Para comprar, precisa da moeda quote (ex: USDT para BTCUSDT)
      const quoteWallet = wallets.find(w => w.symbol === quoteAsset);
      balance = quoteWallet?.balance || 0;
    } else {
      // Para vender, precisa da moeda base (ex: BTC para BTCUSDT)
      const baseWallet = wallets.find(w => w.symbol === baseAsset);
      balance = baseWallet?.balance || 0;
    }

    setAvailableBalance(balance);
  };

  // Validar se há saldo suficiente
  const validateBalance = (): boolean => {
    if (currentOperationMode !== 'simulated') return true; // Não validar para operações reais por enquanto

    const orderValue = side === 'buy' 
      ? (parseFloat(price) || currentPrice) * amount // Valor em USDT para compra
      : amount; // Quantidade do ativo para venda

    if (availableBalance < orderValue) {
      const assetNeeded = side === 'buy' ? 'USDT' : symbol.replace('USDT', '');
      setMessage({ 
        type: 'error', 
        text: `Saldo insuficiente. Disponível: ${availableBalance.toFixed(8)} ${assetNeeded}, Necessário: ${orderValue.toFixed(8)} ${assetNeeded}` 
      });
      return false;
    }

    return true;
  };

  // Função de validação de saldo para a trading API
  const validateWalletBalance = async (symbol: string, side: 'buy' | 'sell', amount: number, price: number): Promise<boolean> => {
    if (currentOperationMode !== 'simulated') return true;

    // Recarregar saldos atuais
    await loadWalletBalances();

    const baseAsset = symbol.replace('USDT', '');
    const quoteAsset = 'USDT';
    
    const orderValue = side === 'buy' 
      ? price * amount // Valor em USDT para compra
      : amount; // Quantidade do ativo para venda

    const currentWalletBalances = await walletAPI.getUserWallets('virtual');
    
    let availableForOrder = 0;
    if (side === 'buy') {
      const quoteWallet = currentWalletBalances.find(w => w.symbol === quoteAsset);
      availableForOrder = quoteWallet?.balance || 0;
    } else {
      const baseWallet = currentWalletBalances.find(w => w.symbol === baseAsset);
      availableForOrder = baseWallet?.balance || 0;
    }

    return availableForOrder >= orderValue;
  };

  // Effect para carregar saldos quando o modo de operação mudar
  useEffect(() => {
    loadWalletBalances();
    
    // Configurar callback de validação na trading API
    if (currentOperationMode === 'simulated') {
      tradingAPI.setWalletValidationCallback(validateWalletBalance);
    }
  }, [currentOperationMode]);

  // Effect para atualizar saldo disponível quando símbolo ou lado da operação mudar
  useEffect(() => {
    updateAvailableBalance(walletBalances);
  }, [symbol, side, walletBalances]);

  // Atualizar preço atual na API de trading
  useEffect(() => {
    if (currentOperationMode === 'simulated' && currentPrice > 0) {
      const updatePrice = async () => {
        await tradingAPI.updateCurrentPrice(currentPrice);
        const updatedPositions = tradingAPI.getPositions();
        setPositions(updatedPositions);
        onPositionUpdated?.(updatedPositions);
      };
      updatePrice();
    }
  }, [currentPrice, currentOperationMode, onPositionUpdated]);

  // Atualizar preço sugerido quando o preço atual mudar
  useEffect(() => {
    if (currentPrice > 0 && orderType === 'limit' && !price) {
      setPrice(currentPrice.toFixed(2));
    }
  }, [currentPrice, orderType, price]);

  // Calcular preços sugeridos para TP/SL
  const calculateSuggestedPrices = () => {
    if (!currentPrice || !price) return { tp: '', sl: '' };
    
    const entryPrice = parseFloat(price) || currentPrice;
    const tpPercent = side === 'buy' ? 0.02 : -0.02; // 2% para cima/baixo
    const slPercent = side === 'buy' ? -0.01 : 0.01; // 1% para baixo/cima
    
    const tp = (entryPrice * (1 + tpPercent)).toFixed(2);
    const sl = (entryPrice * (1 + slPercent)).toFixed(2);
    
    return { tp, sl };
  };

  // Função para atualizar saldos da carteira após trade
  const updateWalletBalances = async (orderData: any, executedPrice: number, executedAmount: number) => {
    try {
      const baseAsset = symbol.replace('USDT', '').replace('BTC', '').replace('ETH', '');
      const quoteAsset = symbol.includes('USDT') ? 'USDT' : symbol.includes('BTC') ? 'BTC' : 'ETH';
      
      if (orderData.side === 'buy') {
        // Compra: reduzir USDT, aumentar ativo base
        const totalCost = executedPrice * executedAmount;
        
        // Reduzir saldo de USDT
        const currentUSDTWallet = walletBalances.find(w => w.symbol === quoteAsset);
        if (currentUSDTWallet) {
          const newBalance = currentUSDTWallet.balance - totalCost;
          const newValue = currentUSDTWallet.value - totalCost;
          
          await walletAPI.updateWalletBalance({
            type: 'virtual',
            symbol: quoteAsset,
            name: currentUSDTWallet.name,
            balance: Math.max(0, newBalance), // Garantir que não seja negativo
            value: Math.max(0, newValue)
          });
        }
        
        // Aumentar saldo do ativo base
        const currentBaseWallet = walletBalances.find(w => w.symbol === baseAsset);
        if (currentBaseWallet) {
          await walletAPI.updateWalletBalance({
            type: 'virtual',
            symbol: baseAsset,
            name: currentBaseWallet.name,
            balance: currentBaseWallet.balance + executedAmount,
            value: currentBaseWallet.value + totalCost
          });
        } else {
          // Criar nova carteira para o ativo
          await walletAPI.updateWalletBalance({
            type: 'virtual',
            symbol: baseAsset,
            name: baseAsset,
            balance: executedAmount,
            value: totalCost
          });
        }
      } else {
        // Venda: reduzir ativo base, aumentar USDT
        const totalReceived = executedPrice * executedAmount;
        
        // Reduzir saldo do ativo base
        const currentBaseWallet = walletBalances.find(w => w.symbol === baseAsset);
        if (currentBaseWallet) {
          const newBalance = currentBaseWallet.balance - executedAmount;
          const newValue = currentBaseWallet.value - totalReceived;
          
          await walletAPI.updateWalletBalance({
            type: 'virtual',
            symbol: baseAsset,
            name: currentBaseWallet.name,
            balance: Math.max(0, newBalance), // Garantir que não seja negativo
            value: Math.max(0, newValue)
          });
        }
        
        // Aumentar saldo de USDT
        const currentUSDTWallet = walletBalances.find(w => w.symbol === quoteAsset);
        if (currentUSDTWallet) {
          await walletAPI.updateWalletBalance({
            type: 'virtual',
            symbol: quoteAsset,
            name: currentUSDTWallet.name,
            balance: currentUSDTWallet.balance + totalReceived,
            value: currentUSDTWallet.value + totalReceived
          });
        }
      }
      
      // Recarregar saldos da carteira
      await loadWalletBalances();
    } catch (error) {
      console.error('Erro ao atualizar saldos da carteira:', error);
    }
  };

  // Função para salvar trade no backend
  const saveTradeToDatabase = async (orderData: any, executedPrice: number, executedAmount: number) => {
    try {
      // Se não tem TP/SL, o trade é considerado fechado imediatamente
      const hasTPSL = useTpSl && (parseFloat(tpPrice) > 0 || parseFloat(slPrice) > 0);
      
      const tradeData: CreateTradeRequest = {
        symbol: orderData.symbol,
        side: orderData.side,
        type: orderData.type,
        quantity: executedAmount,
        price: executedPrice,
        total: executedPrice * executedAmount,
        tradeType: 'manual',
        environment: currentOperationMode,
        status: hasTPSL ? 'open' : 'closed', // Se não tem TP/SL, já está fechado
        takeProfit: useTpSl ? parseFloat(tpPrice) : undefined,
        stopLoss: useTpSl ? parseFloat(slPrice) : undefined,
        notes: notes || `Trade manual ${orderData.side} ${orderData.symbol}`,
      };

      console.log('💾 Salvando trade no banco:', tradeData);
      const savedTrade = await createTrade(tradeData);
      console.log('✅ Trade salvo com sucesso:', savedTrade);
      
      return savedTrade;
    } catch (error) {
      console.error('❌ Erro ao salvar trade:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      setMessage({ type: 'error', text: 'Quantidade deve ser maior que zero' });
      return;
    }

    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      setMessage({ type: 'error', text: 'Preço deve ser maior que zero' });
      return;
    }

    if (useTpSl) {
      if (!tpPrice || parseFloat(tpPrice) <= 0) {
        setMessage({ type: 'error', text: 'Preço TP deve ser maior que zero' });
        return;
      }
      if (!slPrice || parseFloat(slPrice) <= 0) {
        setMessage({ type: 'error', text: 'Preço SL deve ser maior que zero' });
        return;
      }
    }

    // Validar saldo da carteira virtual
    if (!validateBalance()) {
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        symbol,
        side,
        type: orderType,
        price: orderType === 'limit' ? parseFloat(price) : currentPrice,
        amount,
        takeProfit: useTpSl ? parseFloat(tpPrice) : undefined,
        stopLoss: useTpSl ? parseFloat(slPrice) : undefined,

      };

      let order;

      if (challengeMode) {
        // MODO DESAFIO: Criar ordem simulada apenas para callback, sem salvar no sistema normal
        // Garantir que temos um preço válido para ordens a mercado
        const marketPrice = orderType === 'market' ? currentPrice : parseFloat(price);
        
        if (orderType === 'market' && (!currentPrice || currentPrice <= 0)) {
          setMessage({ type: 'error', text: 'Preço atual não disponível. Aguarde alguns segundos e tente novamente.' });
          setLoading(false);
          return;
        }

        order = {
          id: `challenge-${Date.now()}`,
          symbol,
          side,
          type: orderType,
          price: marketPrice,
          amount,
          status: 'filled', // Simular execução imediata para desafios
          filledPrice: marketPrice,
          filledAmount: amount,
          timestamp: new Date()
        };
        
        // Não salvar na tradingAPI nem no banco normal - apenas chamar callback
        console.log('🎯 Ordem de desafio criada (não salva no sistema normal):', order);
      } else {
        // MODO NORMAL: Usar sistema de trading normal
        order = await tradingAPI.createOrder(orderData);
        
        // O tradingAPI já salva o trade no banco quando a ordem é executada
        // Apenas atualizar saldos da carteira para ordens de mercado executadas
        if (order.type === 'market' && order.status === 'filled' && currentOperationMode === 'simulated') {
          const executedPrice = order.filledPrice || order.price;
          const executedAmount = order.filledAmount || order.amount;
          await updateWalletBalances(orderData, executedPrice, executedAmount);
        } else if (currentOperationMode === 'real') {
          // Para operações reais, você pode implementar integração com exchange real
          setMessage({ type: 'error', text: 'Operações reais não implementadas ainda' });
          setLoading(false);
          return;
        }
      }
      
      setMessage({ 
        type: 'success', 
        text: challengeMode 
          ? `🎯 Trade de desafio executado com sucesso!`
          : `Ordem ${order.type} ${order.side} criada e salva com sucesso!` 
      });

      // Limpar formulário
      setPrice('');
      setAmount(0);
      setTpPrice('');
      setSlPrice('');
      setUseTpSl(false);
      setNotes('');

      onOrderCreated?.(order);
      
      // Aguardar um pouco para garantir que a ordem foi processada
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Atualizar posições apenas no modo normal
      if (!challengeMode) {
        const updatedPositions = tradingAPI.getPositions();
        setPositions(updatedPositions);
        onPositionUpdated?.(updatedPositions);
      }

    } catch (error) {
      console.error('Erro ao criar ordem:', error);
      setMessage({ 
        type: 'error', 
        text: `Erro ao criar ordem: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTpSlToggle = () => {
    if (!useTpSl) {
      const { tp, sl } = calculateSuggestedPrices();
      setTpPrice(tp);
      setSlPrice(sl);
    }
    setUseTpSl(!useTpSl);
  };

  const handleCloseMessage = () => {
    setMessage(null);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        minHeight: challengeMode ? 'auto' : '100%',
        height: challengeMode ? 'auto' : '100%',
        boxSizing: 'border-box',
        overflow: challengeMode ? 'visible' : 'hidden',
      }}
    >
      {/* 1) Select de Modo de Operação */}
      {!challengeMode && (
        <>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="mode-label">Modo de Operação</InputLabel>
          <Select
            labelId="mode-label"
            value={operationModeState}
            label="Modo de Operação"
              onChange={(e) => {
                const newMode = e.target.value as 'real' | 'simulated';
                // Bloquear mudança para real se não tem plano
                if (!hasActivePlan && newMode === 'real') {
                  return;
                }
                setOperationModeState(newMode);
              }}
              disabled={!hasActivePlan}
          >
              <MenuItem 
                value="real"
                disabled={!hasActivePlan}
              >
                Operações Reais {!hasActivePlan && '(Requer plano)'}
              </MenuItem>
            <MenuItem value="simulated">Operações Simuladas</MenuItem>
          </Select>
        </FormControl>
          {!hasActivePlan && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="caption">
                Usuários sem plano só podem realizar operações simuladas. Assine um plano para operações reais.
              </Typography>
            </Alert>
          )}
        </>
      )}
      
      {challengeMode && (
        <Typography variant="body2" color="primary" sx={{ mb: 2, textAlign: 'center' }}>
          🎯 Modo Desafio - Operações Simuladas
        </Typography>
      )}

      {/* 2) Aba Comprar / Vender */}
      <Tabs
        value={side}
        onChange={(_, v) => setSide(v)}
        variant="fullWidth"
        sx={{ 
          mb: 2, 
          flexShrink: 0,
          '& .MuiTab-root': {
            fontWeight: 'bold',
            fontSize: '0.95rem',
            textTransform: 'none',
            minHeight: 48,
            transition: 'all 0.2s ease-in-out',
          },
          '& .Mui-selected': {
            fontWeight: 'bold',
          },
        }}
      >
        <Tab
          label="Comprar"
          value="buy"
          sx={{ 
            color: side === 'buy' ? 'success.main' : 'text.secondary',
            backgroundColor: side === 'buy' ? 'success.light' : 'transparent',
            borderRadius: 1,
            mx: 0.5,
            '&:hover': {
              backgroundColor: side === 'buy' ? 'success.main' : 'action.hover',
              color: side === 'buy' ? 'white' : 'text.primary',
            },
          }}
        />
        <Tab
          label="Vender"
          value="sell"
          sx={{ 
            color: side === 'sell' ? 'error.main' : 'text.secondary',
            backgroundColor: side === 'sell' ? 'error.light' : 'transparent',
            borderRadius: 1,
            mx: 0.5,
            '&:hover': {
              backgroundColor: side === 'sell' ? 'error.main' : 'action.hover',
              color: side === 'sell' ? 'white' : 'text.primary',
            },
          }}
        />
      </Tabs>

      {/* 3) Campos de entrada */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          mb: 2,
          minHeight: 0,
          overflow: 'auto',
          pr: 1,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: 3,
          },
        }}
      >
        {orderType === 'limit' && (
          <>
            <TextField
              fullWidth
              size="small"
              label="Preço"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              InputProps={{ endAdornment: <Typography>USDT</Typography> }}
              sx={{                      //  idem aqui
                mt: 2,
                mb: 2,
              }}
              helperText={`Preço atual: ${currentPrice.toFixed(2)} USDT`}
            />
            

          </>
        )}

        <TextField
          fullWidth
          size="small"
          type="number"
          label="Quantidade"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          inputProps={{ step: 0.0001, min: 0 }}
          InputProps={{
            endAdornment: (
              <Typography>{symbol.replace('USDT', '')}</Typography>
            ),
          }}
          sx={{                      //  idem aqui
            mt: 2,
            mb: 2,
          }}
        />

        {/* Mostrar saldo disponível para operações simuladas */}
        {currentOperationMode === 'simulated' && (
          <Box sx={{ mb: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Saldo Disponível: {availableBalance.toFixed(8)} {side === 'buy' ? 'USDT' : symbol.replace('USDT', '')}
            </Typography>
          </Box>
        )}
        
        {/* Mostrar valor total da ordem */}
        {amount > 0 && currentPrice > 0 && (
          <Box sx={{ mb: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Valor Total: ${(amount * currentPrice).toFixed(2)} USDT
            </Typography>
          </Box>
        )}

        {/* TP/SL para todas as ordens */}
        <FormControlLabel
          control={
            <Checkbox
              checked={useTpSl}
              onChange={handleTpSlToggle}
            />
          }
          label="TP/SL"
          sx={{ mb: 2 }}
        />

        {/* Campos de TP e SL quando ativado */}
        {useTpSl && (
          <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
            <TextField
              label="Preço SL"
              size="small"
              value={slPrice}
              onChange={(e) => setSlPrice(e.target.value)}
              InputProps={{ endAdornment: <Typography>USDT</Typography> }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Preço TP"
              size="small"
              value={tpPrice}
              onChange={(e) => setTpPrice(e.target.value)}
              InputProps={{ endAdornment: <Typography>USDT</Typography> }}
              sx={{ flex: 1 }}
            />
            
          </Box>
        )}

        {/* Campo de notas */}
        <TextField
          fullWidth
          size="small"
          label="Notas (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          rows={2}
          placeholder="Adicione observações sobre este trade..."
          sx={{ mb: 2 }}
        />
      </Box>

      {/* 4) Slider + Botão + Select de tipo de ordem */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flexShrink: 0,
        }}
      >
        <Slider
          value={amount}
          onChange={(_, v) => setAmount(v as number)}
          aria-labelledby="amount-slider"
          min={0}
          max={10}
          step={0.001}
          sx={{
            mb: 2,
            overflow: 'visible',
            '& .MuiSlider-thumb': { overflow: 'visible' },
          }}
        />

        {/* Select de tipo de ordem */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="order-type-label">Tipo de Ordem</InputLabel>
          <Select
            labelId="order-type-label"
            value={orderType}
            label="Tipo de Ordem"
            onChange={(e) => setOrderType(e.target.value as any)}
          >
            <MenuItem value="limit">Limite</MenuItem>
            <MenuItem value="market">Mercado</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexShrink: 0 }}>
          <Button
            variant="contained"
            fullWidth
            color={side === 'buy' ? 'success' : 'error'}
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              fontWeight: 'bold',
              fontSize: '0.9rem',
              py: 1.5,
              textTransform: 'none',
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-1px)',
              },
              '&:disabled': {
                opacity: 0.6,
                transform: 'none',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {loading ? 'Processando...' : 
              side === 'buy'
                ? `Comprar ${symbol.replace('USDT', '')}`
                : `Vender ${symbol.replace('USDT', '')}`
            }
          </Button>
          
          <Button
            variant="contained"
            color="warning"
            onClick={async () => {
                                // Encerrar posição atual
                  const currentPosition = positions.find(p => p.symbol === symbol);
                  if (currentPosition) {
                    try {
                      await tradingAPI.closePositionManually(symbol);
                      
                      // Atualizar trade no backend com informações de encerramento
                      try {
                        // Buscar o trade mais recente aberto para este símbolo
                        const authToken = localStorage.getItem('authToken');
                        console.log('🔑 Token de autenticação:', authToken ? 'Presente' : 'Ausente');
                        
                        const response = await fetch('http://localhost:5000/api/trades', {
                          method: 'GET',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                          }
                        });
                        
                        console.log('📡 Status da resposta:', response.status);
                        console.log('📡 Headers da resposta:', response.headers);
                        
                        if (response.ok) {
                          const tradesData = await response.json();
                          console.log('📊 Trades encontrados:', tradesData.data);
                          
                          const openTrades = tradesData.data?.filter((t: any) => 
                            t.symbol === symbol && t.status === 'open'
                          ) || [];
                          
                          console.log(`🔍 Trades abertos encontrados para ${symbol}:`, openTrades.length);
                          
                          if (openTrades.length > 0) {
                            // Fechar todos os trades abertos do símbolo
                            for (const openTrade of openTrades) {
                              console.log(`🔄 Fechando trade: ${openTrade.id} - ${openTrade.symbol} ${openTrade.quantity} @ ${openTrade.price}`);
                              
                              // Calcular PnL para este trade específico
                              const pnl = currentPosition.side === 'long' 
                                ? (currentPrice - openTrade.price) * openTrade.quantity
                                : (openTrade.price - currentPrice) * openTrade.quantity;
                              
                              const pnlPercent = (pnl / (openTrade.price * openTrade.quantity)) * 100;
                              
                              console.log('💰 PnL calculado para trade:', { pnl, pnlPercent, currentPrice, openTrade });
                              
                              // Atualizar trade
                              const updateResponse = await fetch(`http://localhost:5000/api/trades/${openTrade.id}`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                },
                                body: JSON.stringify({
                                  status: 'closed',
                                  exitTime: new Date().toISOString(),
                                  exitPrice: currentPrice,
                                  pnl: pnl,
                                  pnlPercent: pnlPercent,
                                  fees: 0.1 // Taxa padrão
                                })
                              });
                              
                              console.log(`✅ Resposta da atualização para trade ${openTrade.id}:`, updateResponse.status);
                              
                              if (updateResponse.ok) {
                                const updatedTrade = await updateResponse.json();
                                console.log('✅ Trade atualizado com sucesso:', updatedTrade);
                              } else {
                                const errorData = await updateResponse.text();
                                console.error('❌ Erro ao atualizar trade:', errorData);
                              }
                            }
                            
                            console.log(`✅ Todos os ${openTrades.length} trades de ${symbol} foram fechados`);
                          } else {
                            console.log('⚠️ Nenhum trade aberto encontrado para:', symbol);
                          }
                        }
                      } catch (error) {
                        console.error('Erro ao atualizar trade no backend:', error);
                      }
                      
                      setMessage({ 
                        type: 'success', 
                        text: `Posição ${symbol} encerrada com sucesso!` 
                      });
                      
                      // Atualizar posições na interface
                      const updatedPositions = tradingAPI.getPositions();
                      setPositions(updatedPositions);
                      onPositionUpdated?.(updatedPositions);
                    } catch (error) {
                      setMessage({ 
                        type: 'error', 
                        text: `Erro ao encerrar posição: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
                      });
                    }
                  }
            }}
            disabled={!positions.find(p => p.symbol === symbol)}
            sx={{ 
              minWidth: 'auto', 
              px: 3,
              fontWeight: 'bold',
              fontSize: '0.9rem',
              py: 1.5,
              textTransform: 'none',
              boxShadow: 2,
              position: 'relative',
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-1px)',
              },
              '&:disabled': {
                opacity: 0.4,
                transform: 'none',
                backgroundColor: 'grey.400',
                color: 'grey.600',
              },
              '&:not(:disabled)': {
                backgroundColor: 'warning.main',
                color: 'warning.contrastText',
                '&:hover': {
                  backgroundColor: 'warning.dark',
                },
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {positions.find(p => p.symbol === symbol) ? (
              <>
                Encerrar
                <Box
                  sx={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 12,
                    height: 12,
                    backgroundColor: 'success.main',
                    borderRadius: '50%',
                    border: '2px solid white',
                  }}
                />
              </>
            ) : (
              'Encerrar'
            )}
          </Button>
        </Box>
      </Box>

      {/* Snackbar para mensagens */}
      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseMessage} 
          severity={message?.type} 
          sx={{ width: '100%' }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default OrderForm;
