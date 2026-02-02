import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { Trade } from '../../types/trade';

interface ManualTradeFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (trade: Trade) => void;
  trade?: Trade | null;
}

const ManualTradeForm: React.FC<ManualTradeFormProps> = ({
  open,
  onClose,
  onSave,
  trade
}) => {
  const [formData, setFormData] = useState<Partial<Trade>>({
    symbol: '',
    side: 'buy',
    type: 'market',
    quantity: 0,
    price: 0,
    total: 0,
    tradeType: 'manual',
    environment: 'real',
    status: 'open',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (trade) {
      setFormData({
        symbol: trade.symbol,
        side: trade.side,
        type: trade.type,
        price: trade.price,
        quantity: trade.quantity,
        total: trade.total,
        tradeType: trade.tradeType,
        environment: trade.environment,
        status: trade.status,
        notes: trade.notes
      });
    } else {
      setFormData({
        symbol: '',
        side: 'buy',
        type: 'market',
        quantity: 0,
        price: 0,
        total: 0,
        tradeType: 'manual',
        environment: 'real',
        status: 'open',
        notes: ''
      });
    }
  }, [trade]);

  useEffect(() => {
    // Calcular valor total automaticamente
    if (formData.price && formData.quantity) {
      setFormData(prev => ({
        ...prev,
        total: (formData.price || 0) * (formData.quantity || 0)
      }));
    }
  }, [formData.price, formData.quantity]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.symbol?.trim()) {
      newErrors.symbol = 'Símbolo é obrigatório';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Preço deve ser maior que zero';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantidade deve ser maior que zero';
    }

    if (!formData.status) {
      newErrors.status = 'Status é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const tradeData: Trade = {
      id: trade?.id || Date.now().toString(),
      userId: trade?.userId || '',
      symbol: formData.symbol!,
      side: formData.side!,
      type: formData.type!,
      quantity: formData.quantity!,
      price: formData.price!,
      total: formData.total!,
      tradeType: formData.tradeType!,
      environment: formData.environment!,
      status: formData.status!,
      entryTime: trade?.entryTime || new Date().toISOString(),
      exitTime: formData.exitTime,
      pnl: formData.pnl,
      pnlPercent: formData.pnlPercent,
      stopLoss: formData.stopLoss,
      takeProfit: formData.takeProfit,
      fees: formData.fees,
      notes: formData.notes,
      botId: formData.botId,
      botName: formData.botName,
      createdAt: trade?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(tradeData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      symbol: '',
      side: 'buy',
      type: 'market',
      quantity: 0,
      price: 0,
      total: 0,
      tradeType: 'manual',
      environment: 'real',
      status: 'open',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  const popularSymbols = [
    'BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'BNBUSDT', 'SOLUSDT',
    'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'UNIUSDT'
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight="bold">
          {trade ? 'Editar Trade' : 'Registrar Trade Manual'}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Informações Básicas */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Informações do Trade
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.symbol}>
              <InputLabel>Símbolo</InputLabel>
              <Select
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
              >
                {popularSymbols.map((symbol) => (
                  <MenuItem key={symbol} value={symbol}>
                    {symbol}
                  </MenuItem>
                ))}
              </Select>
              {errors.symbol && (
                <Typography variant="caption" color="error">
                  {errors.symbol}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={formData.side}
                onChange={(e) => setFormData(prev => ({ ...prev, side: e.target.value as 'buy' | 'sell' }))}
              >
                <MenuItem value="buy">
                  <Box display="flex" alignItems="center" gap={1}>
                    <TrendingUp color="success" />
                    Compra
                  </Box>
                </MenuItem>
                <MenuItem value="sell">
                  <Box display="flex" alignItems="center" gap={1}>
                    <TrendingDown color="error" />
                    Venda
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Preço ($)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
              error={!!errors.price}
              helperText={errors.price}
              InputProps={{
                startAdornment: '$'
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Quantidade"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
              error={!!errors.quantity}
              helperText={errors.quantity}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Valor Total ($)"
              type="number"
              value={formData.total}
              InputProps={{
                startAdornment: '$',
                readOnly: true
              }}
              helperText="Calculado automaticamente"
            />
          </Grid>

          {/* Tipo de Operação e Ambiente */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Operação</InputLabel>
              <Select
                value={formData.tradeType}
                onChange={(e) => setFormData(prev => ({ ...prev, tradeType: e.target.value as 'manual' | 'automated' | 'bot' }))}
              >
                <MenuItem value="manual">Manual</MenuItem>
                <MenuItem value="automated">Automático</MenuItem>
                <MenuItem value="bot">Bot</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Ambiente</InputLabel>
              <Select
                value={formData.environment}
                onChange={(e) => setFormData(prev => ({ ...prev, environment: e.target.value as 'real' | 'simulated' | 'paper' }))}
              >
                <MenuItem value="real">Real</MenuItem>
                <MenuItem value="simulated">Simulado</MenuItem>
                <MenuItem value="paper">Paper Trading</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Resultado (apenas para trades fechados) */}
          {formData.status === 'closed' && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="PnL ($)"
                type="number"
                value={formData.pnl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, pnl: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: '$'
                }}
                helperText="Lucro ou prejuízo do trade"
              />
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.status}>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'open' | 'closed' | 'cancelled' }))}
              >
                <MenuItem value="open">
                  <Chip label="Aberto" color="warning" size="small" />
                </MenuItem>
                <MenuItem value="closed">
                  <Chip label="Fechado" color="success" size="small" />
                </MenuItem>
                <MenuItem value="cancelled">
                  <Chip label="Cancelado" color="error" size="small" />
                </MenuItem>
              </Select>
              {errors.status && (
                <Typography variant="caption" color="error">
                  {errors.status}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Observações */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Observações
            </Typography>
            <TextField
              fullWidth
              label="Notas sobre o trade"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Descreva a estratégia, motivo da entrada/saída, etc."
            />
          </Grid>

          {/* Alertas */}
          <Grid item xs={12}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Dica:</strong> Registre seus trades para acompanhar seu desempenho 
                e identificar padrões de sucesso ou melhoria.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
        >
          {trade ? 'Atualizar' : 'Registrar'} Trade
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManualTradeForm; 