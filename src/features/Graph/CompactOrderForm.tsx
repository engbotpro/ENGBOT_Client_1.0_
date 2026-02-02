// src/components/CompactOrderForm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Checkbox,
  FormControlLabel,
  Grid,
  Alert,
  Snackbar,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { tradingAPI, type Order, type Position } from '../../services/tradingAPI';
import { createTrade } from '../../services/tradeAPI';
import { CreateTradeRequest } from '../../types/trade';
import walletAPI, { Wallet as WalletType } from '../../services/walletAPI';

interface CompactOrderFormProps {
  symbol: string;
  currentPrice?: number;
  onOrderCreated?: (order: Order) => void;
  onPositionUpdated?: (positions: Position[]) => void;
}

const CompactOrderForm: React.FC<CompactOrderFormProps> = ({ 
  symbol, 
  currentPrice = 0,
  onOrderCreated,
  onPositionUpdated,
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Verificar se o usuário tem plano ativo
  const hasActivePlan = useMemo(() => {
    if (!user?.currentPlan) return false;
    if (!user.planExpiresAt) return true;
    const expirationDate = new Date(user.planExpiresAt);
    const now = new Date();
    return expirationDate > now;
  }, [user?.currentPlan, user?.planExpiresAt]);

  const [operationMode, setOperationMode] = useState<'real' | 'simulated'>(hasActivePlan ? 'simulated' : 'simulated');
  
  // Estados para Compra
  const [buyPrice, setBuyPrice] = useState('');
  const [buyAmount, setBuyAmount] = useState(0);
  const [buyOrderType, setBuyOrderType] = useState<'limit' | 'market'>('limit');
  const [buyTpSl, setBuyTpSl] = useState(false);
  const [buyTpPrice, setBuyTpPrice] = useState('');
  const [buySlPrice, setBuySlPrice] = useState('');
  const [buyLoading, setBuyLoading] = useState(false);

  // Estados para Venda
  const [sellPrice, setSellPrice] = useState('');
  const [sellAmount, setSellAmount] = useState(0);
  const [sellOrderType, setSellOrderType] = useState<'limit' | 'market'>('limit');
  const [sellTpSl, setSellTpSl] = useState(false);
  const [sellTpPrice, setSellTpPrice] = useState('');
  const [sellSlPrice, setSellSlPrice] = useState('');
  const [sellLoading, setSellLoading] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [walletBalances, setWalletBalances] = useState<WalletType[]>([]);
  const [availableBalance, setAvailableBalance] = useState<{ usdt: number; base: number }>({ usdt: 0, base: 0 });

  // Carregar saldos da carteira
  const loadWalletBalances = async () => {
    if (operationMode === 'simulated') {
      try {
        const virtualWallets = await walletAPI.getUserWallets('virtual');
        setWalletBalances(virtualWallets);
        
        // Calcular saldo disponível (USDT para compra, ativo base para venda)
        const baseAsset = symbol.replace('USDT', '');
        const usdtWallet = virtualWallets.find(w => w.symbol === 'USDT');
        const baseWallet = virtualWallets.find(w => w.symbol === baseAsset);
        
        setAvailableBalance({
          usdt: usdtWallet?.balance || 0,
          base: baseWallet?.balance || 0,
        } as { usdt: number; base: number });
      } catch (error) {
        console.error('Erro ao carregar saldos:', error);
      }
    }
  };

  useEffect(() => {
    loadWalletBalances();
  }, [symbol, operationMode]);

  // Atualizar preço sugerido
  useEffect(() => {
    if (currentPrice > 0) {
      if (!buyPrice && buyOrderType === 'limit') {
        setBuyPrice(currentPrice.toFixed(2));
      }
      if (!sellPrice && sellOrderType === 'limit') {
        setSellPrice(currentPrice.toFixed(2));
      }
    }
  }, [currentPrice, buyOrderType, sellOrderType, buyPrice, sellPrice]);

  const handleSubmit = async (side: 'buy' | 'sell') => {
    const isBuy = side === 'buy';
    const amount = isBuy ? buyAmount : sellAmount;
    const price = isBuy ? (buyOrderType === 'limit' ? buyPrice : currentPrice.toString()) : (sellOrderType === 'limit' ? sellPrice : currentPrice.toString());
    const orderType = isBuy ? buyOrderType : sellOrderType;
    const useTpSl = isBuy ? buyTpSl : sellTpSl;
    const tpPrice = isBuy ? buyTpPrice : sellTpPrice;
    const slPrice = isBuy ? buySlPrice : sellSlPrice;

    if (!amount || amount <= 0) {
      setMessage({ type: 'error', text: 'Quantidade deve ser maior que zero' });
      return;
    }

    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      setMessage({ type: 'error', text: 'Preço deve ser maior que zero' });
      return;
    }

    if (useTpSl && (!tpPrice || parseFloat(tpPrice) <= 0 || !slPrice || parseFloat(slPrice) <= 0)) {
      setMessage({ type: 'error', text: 'Preços TP e SL devem ser maiores que zero' });
      return;
    }

    if (isBuy) setBuyLoading(true);
    else setSellLoading(true);

    try {
      const orderData = {
        symbol,
        side,
        type: orderType,
        price: parseFloat(price),
        amount,
        takeProfit: useTpSl ? parseFloat(tpPrice) : undefined,
        stopLoss: useTpSl ? parseFloat(slPrice) : undefined,
      };

      const order = await tradingAPI.createOrder(orderData);

      if (order.type === 'market' && order.status === 'filled') {
        const executedPrice = order.filledPrice || order.price;
        const executedAmount = order.filledAmount || order.amount;

        if (operationMode === 'simulated') {
          const tradeData: CreateTradeRequest = {
            symbol: order.symbol,
            side: order.side,
            type: order.type,
            quantity: executedAmount,
            price: executedPrice,
            total: executedPrice * executedAmount,
            tradeType: 'manual',
            environment: 'simulated',
            status: useTpSl ? 'open' : 'closed',
            takeProfit: useTpSl ? parseFloat(tpPrice) : undefined,
            stopLoss: useTpSl ? parseFloat(slPrice) : undefined,
            notes: `Trade manual ${side} ${symbol}`,
          };

          await createTrade(tradeData);
          await loadWalletBalances();
        }
      }

      setMessage({ type: 'success', text: `Ordem ${side === 'buy' ? 'de compra' : 'de venda'} criada com sucesso!` });

      // Limpar formulário
      if (isBuy) {
        setBuyPrice('');
        setBuyAmount(0);
        setBuyTpPrice('');
        setBuySlPrice('');
        setBuyTpSl(false);
      } else {
        setSellPrice('');
        setSellAmount(0);
        setSellTpPrice('');
        setSellSlPrice('');
        setSellTpSl(false);
      }

      onOrderCreated?.(order);
      
      const updatedPositions = tradingAPI.getPositions();
      onPositionUpdated?.(updatedPositions);
      await loadWalletBalances();

    } catch (error) {
      console.error('Erro ao criar ordem:', error);
      setMessage({ type: 'error', text: `Erro ao criar ordem: ${error instanceof Error ? error.message : 'Erro desconhecido'}` });
    } finally {
      if (isBuy) setBuyLoading(false);
      else setSellLoading(false);
    }
  };

  const renderOrderSection = (side: 'buy' | 'sell') => {
    const isBuy = side === 'buy';
    const amount = isBuy ? buyAmount : sellAmount;
    const price = isBuy ? buyPrice : sellPrice;
    const orderType = isBuy ? buyOrderType : sellOrderType;
    const useTpSl = isBuy ? buyTpSl : sellTpSl;
    const tpPrice = isBuy ? buyTpPrice : sellTpPrice;
    const slPrice = isBuy ? buySlPrice : sellSlPrice;
    const loading = isBuy ? buyLoading : sellLoading;
    const setAmount = isBuy ? setBuyAmount : setSellAmount;
    const setPrice = isBuy ? setBuyPrice : setSellPrice;
    const setOrderType = isBuy ? setBuyOrderType : setSellOrderType;
    const setUseTpSl = isBuy ? setBuyTpSl : setSellTpSl;
    const setTpPrice = isBuy ? setBuyTpPrice : setSellTpPrice;
    const setSlPrice = isBuy ? setBuySlPrice : setSellSlPrice;

    return (
      <Paper
        elevation={2}
        sx={{
          p: 1,
          height: '100%',
          bgcolor: isBuy ? 'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)',
          border: `1px solid ${isBuy ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}`,
        }}
      >
        <Typography variant="subtitle1" gutterBottom sx={{ color: isBuy ? 'success.main' : 'error.main', fontWeight: 'bold', fontSize: '0.875rem', mb: 0.5 }}>
          {isBuy ? 'COMPRAR' : 'VENDER'}
        </Typography>

        {operationMode === 'simulated' && (
          <Box sx={{ mb: 1, p: 0.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Saldo: {availableBalance[isBuy ? 'usdt' : 'base'].toFixed(8)} {isBuy ? 'USDT' : symbol.replace('USDT', '')}
            </Typography>
          </Box>
        )}

        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>Tipo</InputLabel>
          <Select
            value={orderType}
            label="Tipo"
            onChange={(e) => setOrderType(e.target.value as 'limit' | 'market')}
            sx={{ fontSize: '0.75rem' }}
          >
            <MenuItem value="limit" sx={{ fontSize: '0.75rem' }}>Limite</MenuItem>
            <MenuItem value="market" sx={{ fontSize: '0.75rem' }}>Mercado</MenuItem>
          </Select>
        </FormControl>

        {orderType === 'limit' && (
          <TextField
            fullWidth
            size="small"
            label="Preço"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            InputProps={{ endAdornment: <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>USDT</Typography> }}
            InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
            inputProps={{ sx: { fontSize: '0.75rem', py: 0.75 } }}
            sx={{ mb: 1 }}
            helperText={<Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Atual: {currentPrice.toFixed(2)}</Typography>}
          />
        )}

        <TextField
          fullWidth
          size="small"
          type="number"
          label="Quantidade"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          inputProps={{ step: 0.0001, min: 0, sx: { fontSize: '0.75rem', py: 0.75 } }}
          InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
          InputProps={{
            endAdornment: <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{symbol.replace('USDT', '')}</Typography>,
          }}
          sx={{ mb: 1 }}
        />

        {amount > 0 && currentPrice > 0 && (
          <Box sx={{ mb: 1, p: 0.5, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Total: ${(amount * (orderType === 'limit' ? parseFloat(price) || currentPrice : currentPrice)).toFixed(2)}
            </Typography>
          </Box>
        )}

        <FormControlLabel
          control={<Checkbox checked={useTpSl} onChange={(e) => setUseTpSl(e.target.checked)} size="small" />}
          label={<Typography variant="caption" sx={{ fontSize: '0.75rem' }}>TP/SL</Typography>}
          sx={{ mb: 0.5 }}
        />

        {useTpSl && (
          <Box sx={{ mb: 1, display: 'flex', gap: 1 }}>
            <TextField
              label="TP"
              size="small"
              value={tpPrice}
              onChange={(e) => setTpPrice(e.target.value)}
              InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
              inputProps={{ sx: { fontSize: '0.75rem', py: 0.75 } }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="SL"
              size="small"
              value={slPrice}
              onChange={(e) => setSlPrice(e.target.value)}
              InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
              inputProps={{ sx: { fontSize: '0.75rem', py: 0.75 } }}
              sx={{ flex: 1 }}
            />
          </Box>
        )}

        <Button
          variant="contained"
          fullWidth
          color={isBuy ? 'success' : 'error'}
          onClick={() => handleSubmit(side)}
          disabled={loading}
          sx={{
            fontWeight: 'bold',
            py: 0.75,
            textTransform: 'none',
            fontSize: '0.75rem',
          }}
        >
          {loading ? 'Processando...' : `${isBuy ? 'Comprar' : 'Vender'} ${symbol.replace('USDT', '')}`}
        </Button>
      </Paper>
    );
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          {renderOrderSection('buy')}
        </Grid>
        <Grid item xs={6}>
          {renderOrderSection('sell')}
        </Grid>
      </Grid>

      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setMessage(null)}
          severity={message?.type || 'info'}
          sx={{ width: '100%' }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompactOrderForm;

