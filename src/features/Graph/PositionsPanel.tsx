// src/components/PositionsPanel.tsx
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  TextField,
  Alert,
} from '@mui/material';
import { Close as CloseIcon, Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { type Position, type Order, tradingAPI } from '../../services/tradingAPI';

interface PositionsPanelProps {
  positions: Position[];
  pendingOrders?: Order[];
  onClosePosition?: (symbol: string) => void;
  onCancelOrder?: (orderId: string) => void;
  onUpdateTPSL?: () => void; // Novo callback específico para atualização de TP/SL
}

const PositionsPanel: React.FC<PositionsPanelProps> = ({ 
  positions, 
  pendingOrders = [],
  onClosePosition,
  onCancelOrder,
  onUpdateTPSL
}) => {
  const [activeTab, setActiveTab] = React.useState(0);
  const [editingPosition, setEditingPosition] = React.useState<string | null>(null);
  const [editingOrder, setEditingOrder] = React.useState<string | null>(null);
  const [editValues, setEditValues] = React.useState<{
    takeProfit: string;
    stopLoss: string;
  }>({ takeProfit: '', stopLoss: '' });
  const [editOrderValues, setEditOrderValues] = React.useState<{
    price: string;
    quantity: string;
    takeProfit: string;
    stopLoss: string;
  }>({ price: '', quantity: '', takeProfit: '', stopLoss: '' });
  const [validationError, setValidationError] = React.useState<string>('');
  const [orderValidationError, setOrderValidationError] = React.useState<string>('');

  // Função para calcular a distância percentual até TP/SL
  const calculateDistance = (currentPrice: number, targetPrice: number, side: 'long' | 'short') => {
    if (!targetPrice) return null;
    
    if (side === 'long') {
      return ((targetPrice - currentPrice) / currentPrice) * 100;
    } else {
      return ((currentPrice - targetPrice) / currentPrice) * 100;
    }
  };

  // Função para verificar se TP/SL está próximo
  const isNearTarget = (distance: number | null) => {
    if (distance === null) return false;
    return Math.abs(distance) < 1; // Menos de 1% de distância
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Função para validar preços de TP/SL
  const validateTPSL = (position: Position, takeProfit: number | null, stopLoss: number | null): string => {
    const entryPrice = position.entryPrice;
    const side = position.side;

    if (side === 'long') {
      // Para posições LONG (compra)
      if (takeProfit && takeProfit <= entryPrice) {
        return 'Take Profit deve ser maior que o preço de entrada para posições LONG';
      }
      if (stopLoss && stopLoss >= entryPrice) {
        return 'Stop Loss deve ser menor que o preço de entrada para posições LONG';
      }
    } else {
      // Para posições SHORT (venda)
      if (takeProfit && takeProfit >= entryPrice) {
        return 'Take Profit deve ser menor que o preço de entrada para posições SHORT';
      }
      if (stopLoss && stopLoss <= entryPrice) {
        return 'Stop Loss deve ser maior que o preço de entrada para posições SHORT';
      }
    }

    return '';
  };

  // Função para iniciar edição de TP/SL
  const startEdit = (position: Position) => {
    setEditingPosition(position.symbol);
    setEditValues({
      takeProfit: position.takeProfit?.toString() || '',
      stopLoss: position.stopLoss?.toString() || ''
    });
    setValidationError('');
  };

  // Função para cancelar edição
  const cancelEdit = () => {
    setEditingPosition(null);
    setEditValues({ takeProfit: '', stopLoss: '' });
    setValidationError('');
  };

  // Função para salvar alterações de TP/SL
  const saveTPSL = async (position: Position) => {
    const takeProfit = editValues.takeProfit ? parseFloat(editValues.takeProfit) : null;
    const stopLoss = editValues.stopLoss ? parseFloat(editValues.stopLoss) : null;

    // Validar valores
    const error = validateTPSL(position, takeProfit, stopLoss);
    if (error) {
      setValidationError(error);
      return;
    }

    try {
      console.log(`🔄 Atualizando TP/SL para ${position.symbol}:`, { takeProfit, stopLoss });

      // Buscar todos os trades abertos do símbolo
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/trades', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const tradesData = await response.json();
        const openTrades = tradesData.data?.filter((t: any) => 
          t.symbol === position.symbol && t.status === 'open'
        ) || [];

        // Atualizar TP/SL em todos os trades abertos do símbolo
        console.log(`📝 Atualizando ${openTrades.length} trades com TP: ${takeProfit}, SL: ${stopLoss}`);
        
        for (const trade of openTrades) {
          console.log(`🔄 Atualizando trade ${trade.id} - Valores antigos: TP: ${trade.takeProfit}, SL: ${trade.stopLoss}`);
          
          const updateResponse = await fetch(`http://localhost:5000/api/trades/${trade.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              takeProfit,
              stopLoss
            })
          });

          if (updateResponse.ok) {
            const updatedTrade = await updateResponse.json();
            console.log(`✅ Trade ${trade.id} atualizado com sucesso:`, updatedTrade);
          } else {
            const errorText = await updateResponse.text();
            console.error(`❌ Erro ao atualizar trade ${trade.id}:`, errorText);
            throw new Error(`Erro ao atualizar trade ${trade.id}: ${errorText}`);
          }
        }

        // Atualizar posição local no tradingAPI
        tradingAPI.updatePositionTPSL(position.symbol, takeProfit || undefined, stopLoss || undefined);

        console.log(`✅ TP/SL atualizado com sucesso para ${position.symbol}`);
        cancelEdit();
        
        // Forçar atualização das posições sem reload da página
        if (onUpdateTPSL) {
          // Aguardar um pouco para garantir que o banco foi atualizado
          setTimeout(() => onUpdateTPSL(), 200);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar TP/SL:', error);
      setValidationError('Erro ao salvar alterações. Tente novamente.');
    }
  };

  // Função para iniciar edição de ordem pendente
  const startEditOrder = (order: Order) => {
    setEditingOrder(order.id);
    setEditOrderValues({
      price: order.price.toString(),
      quantity: order.amount.toString(),
      takeProfit: order.takeProfit?.toString() || '',
      stopLoss: order.stopLoss?.toString() || ''
    });
    setOrderValidationError('');
  };

  // Função para cancelar edição de ordem
  const cancelEditOrder = () => {
    setEditingOrder(null);
    setEditOrderValues({ price: '', quantity: '', takeProfit: '', stopLoss: '' });
    setOrderValidationError('');
  };

  // Função para salvar alterações de ordem pendente
  const saveOrder = async (order: Order) => {
    const price = editOrderValues.price ? parseFloat(editOrderValues.price) : order.price;
    const quantity = editOrderValues.quantity ? parseFloat(editOrderValues.quantity) : order.amount;
    const takeProfit = editOrderValues.takeProfit ? parseFloat(editOrderValues.takeProfit) : null;
    const stopLoss = editOrderValues.stopLoss ? parseFloat(editOrderValues.stopLoss) : null;

    // Validações básicas
    if (price <= 0) {
      setOrderValidationError('O preço deve ser maior que zero');
      return;
    }
    if (quantity <= 0) {
      setOrderValidationError('A quantidade deve ser maior que zero');
      return;
    }

    try {
      console.log(`🔄 Atualizando ordem pendente ${order.id}:`, { price, quantity, takeProfit, stopLoss });

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setOrderValidationError('Token de autenticação não encontrado');
        return;
      }

      const updateResponse = await fetch(`http://localhost:5000/api/pending-orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          price,
          quantity,
          takeProfit: takeProfit || null,
          stopLoss: stopLoss || null
        })
      });

      if (updateResponse.ok) {
        const result = await updateResponse.json();
        console.log(`✅ Ordem ${order.id} atualizada com sucesso:`, result);
        
        cancelEditOrder();
        
        // Notificar atualização - o callback já atualiza as ordens pendentes do tradingAPI
        if (onCancelOrder) {
          onCancelOrder(order.id);
        }
      } else {
        const errorData = await updateResponse.json().catch(() => ({}));
        setOrderValidationError(errorData.message || 'Erro ao atualizar ordem pendente');
      }
    } catch (error) {
      console.error('Erro ao atualizar ordem pendente:', error);
      setOrderValidationError('Erro ao atualizar ordem pendente. Tente novamente.');
    }
  };

  const totalPositionsValue = positions.reduce((sum, pos) => sum + (pos.entryPrice * pos.amount), 0);
  const totalPositionsPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);
  const totalPendingValue = pendingOrders.reduce((sum, order) => sum + (order.price * order.amount), 0);

  // Logs removidos para evitar loop infinito

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="trading tabs">
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📊 Posições Ativas ({positions.length})
                {positions.length > 0 && (
                  <>
                    <Chip 
                      label={`$${totalPositionsValue.toFixed(2)}`}
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                    <Chip 
                      label={`$${totalPositionsPnL.toFixed(2)}`}
                      color={totalPositionsPnL >= 0 ? "success" : "error"}
                      size="small"
                      variant="outlined"
                    />
                  </>
                )}
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                ⏳ Ordens Pendentes ({pendingOrders.length})
                {pendingOrders.length > 0 && (
                  <Chip 
                    label={`$${totalPendingValue.toFixed(2)}`}
                    color="warning"
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Mostrar erro de validação */}
      {validationError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setValidationError('')}>
          {validationError}
        </Alert>
      )}
      
      {activeTab === 0 && (
        // Aba de Posições Ativas
        <>
          {positions.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary'
            }}>
              <Typography variant="body2">
                Nenhuma posição ativa
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
              <Table size="small" sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 120 }}>Par</TableCell>
                    <TableCell sx={{ minWidth: 80 }}>Lado</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Entrada</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Quantidade</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>Stop Loss</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>Take Profit</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>PnL</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>PnL %</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Valor Total</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {positions.map((position) => (
                    <TableRow key={position.symbol}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {position.symbol}
                          </Typography>
                          {(position.takeProfit || position.stopLoss) && (
                            <Chip
                              label="TP/SL"
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={position.side === 'long' ? 'LONG' : 'SHORT'}
                          color={position.side === 'long' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          ${position.entryPrice.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {position.amount.toFixed(6)}
                        </Typography>
                      </TableCell>
                      {/* Stop Loss - Agora à esquerda */}
                      <TableCell>
                        {editingPosition === position.symbol ? (
                          <TextField
                            size="small"
                            type="number"
                            value={editValues.stopLoss}
                            onChange={(e) => setEditValues(prev => ({ ...prev, stopLoss: e.target.value }))}
                            placeholder="Stop Loss"
                            sx={{ width: 100 }}
                            InputProps={{
                              startAdornment: '$',
                            }}
                          />
                        ) : (
                          position.stopLoss ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Chip
                                label={`$${position.stopLoss.toFixed(2)}`}
                                color={isNearTarget(calculateDistance(position.entryPrice, position.stopLoss, position.side)) ? "warning" : "error"}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  fontWeight: 'bold',
                                  animation: isNearTarget(calculateDistance(position.entryPrice, position.stopLoss, position.side)) 
                                    ? 'pulse 2s infinite' : 'none',
                                  '@keyframes pulse': {
                                    '0%': { opacity: 1 },
                                    '50%': { opacity: 0.5 },
                                    '100%': { opacity: 1 },
                                  },
                                }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                -{Math.abs(calculateDistance(position.entryPrice, position.stopLoss, position.side) || 0).toFixed(2)}%
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )
                        )}
                      </TableCell>
                      {/* Take Profit - Agora à direita */}
                      <TableCell>
                        {editingPosition === position.symbol ? (
                          <TextField
                            size="small"
                            type="number"
                            value={editValues.takeProfit}
                            onChange={(e) => setEditValues(prev => ({ ...prev, takeProfit: e.target.value }))}
                            placeholder="Take Profit"
                            sx={{ width: 100 }}
                            InputProps={{
                              startAdornment: '$',
                            }}
                          />
                        ) : (
                          position.takeProfit ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Chip
                                label={`$${position.takeProfit.toFixed(2)}`}
                                color={isNearTarget(calculateDistance(position.entryPrice, position.takeProfit, position.side)) ? "warning" : "success"}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  fontWeight: 'bold',
                                  animation: isNearTarget(calculateDistance(position.entryPrice, position.takeProfit, position.side)) 
                                    ? 'pulse 2s infinite' : 'none',
                                  '@keyframes pulse': {
                                    '0%': { opacity: 1 },
                                    '50%': { opacity: 0.5 },
                                    '100%': { opacity: 1 },
                                  },
                                }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                +{calculateDistance(position.entryPrice, position.takeProfit, position.side)?.toFixed(2)}%
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={position.pnl >= 0 ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          ${position.pnl.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={position.pnlPercent >= 0 ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {position.pnlPercent.toFixed(2)}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          ${(position.entryPrice * position.amount).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {editingPosition === position.symbol ? (
                            <>
                              {/* Botões para modo de edição */}
                              <Tooltip title="Salvar alterações">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => saveTPSL(position)}
                                  sx={{
                                    backgroundColor: 'success.light',
                                    color: 'success.contrastText',
                                    '&:hover': {
                                      backgroundColor: 'success.main',
                                      transform: 'scale(1.1)',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                  }}
                                >
                                  <SaveIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancelar edição">
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={cancelEdit}
                                  sx={{
                                    backgroundColor: 'warning.light',
                                    color: 'warning.contrastText',
                                    '&:hover': {
                                      backgroundColor: 'warning.main',
                                      transform: 'scale(1.1)',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                  }}
                                >
                                  <CancelIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              {/* Botões para modo normal */}
                              <Tooltip title="Editar TP/SL">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => startEdit(position)}
                                  sx={{
                                    backgroundColor: 'primary.light',
                                    color: 'primary.contrastText',
                                    '&:hover': {
                                      backgroundColor: 'primary.main',
                                      transform: 'scale(1.1)',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Fechar posição">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={async () => {
                                    try {
                                      console.log(`🔄 Fechando posição: ${position.symbol}`);
                                      
                                      // Fechar posição no tradingAPI
                                      await tradingAPI.closePositionManually(position.symbol);
                                      
                                      // Fechar todos os trades do símbolo no banco de dados
                                      try {
                                        const authToken = localStorage.getItem('authToken');
                                        const response = await fetch('http://localhost:5000/api/trades', {
                                          method: 'GET',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${authToken}`
                                          }
                                        });
                                        
                                        if (response.ok) {
                                          const tradesData = await response.json();
                                          const openTrades = tradesData.data?.filter((t: any) => 
                                            t.symbol === position.symbol && t.status === 'open'
                                          ) || [];
                                          
                                          console.log(`🔍 Trades abertos encontrados para ${position.symbol}:`, openTrades.length);
                                          
                                          // Fechar todos os trades abertos do símbolo
                                          for (const openTrade of openTrades) {
                                            console.log(`🔄 Fechando trade: ${openTrade.id} - ${openTrade.symbol} ${openTrade.quantity} @ ${openTrade.price}`);
                                            
                                            // Calcular PnL (simulado - você pode obter o preço atual de uma API)
                                            const currentPrice = openTrade.price; // Preço simulado
                                            const pnl = position.side === 'long' 
                                              ? (currentPrice - openTrade.price) * openTrade.quantity
                                              : (openTrade.price - currentPrice) * openTrade.quantity;
                                            
                                            const pnlPercent = (pnl / (openTrade.price * openTrade.quantity)) * 100;
                                            
                                            // Atualizar trade
                                            const updateResponse = await fetch(`http://localhost:5000/api/trades/${openTrade.id}`, {
                                              method: 'PUT',
                                              headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${authToken}`
                                              },
                                              body: JSON.stringify({
                                                status: 'closed',
                                                exitTime: new Date().toISOString(),
                                                exitPrice: currentPrice,
                                                pnl: pnl,
                                                pnlPercent: pnlPercent,
                                                fees: 0.1
                                              })
                                            });
                                            
                                            if (updateResponse.ok) {
                                              console.log(`✅ Trade ${openTrade.id} fechado com sucesso`);
                                            } else {
                                              console.error(`❌ Erro ao fechar trade ${openTrade.id}`);
                                            }
                                          }
                                          
                                          console.log(`✅ Todos os ${openTrades.length} trades de ${position.symbol} foram fechados`);
                                        }
                                      } catch (error) {
                                        console.error('Erro ao fechar trades no banco:', error);
                                      }
                                      
                                      onClosePosition?.(position.symbol);
                                    } catch (error) {
                                      console.error('Erro ao fechar posição:', error);
                                    }
                                  }}
                                  sx={{
                                    backgroundColor: 'error.light',
                                    color: 'error.contrastText',
                                    '&:hover': {
                                      backgroundColor: 'error.main',
                                      transform: 'scale(1.1)',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                    boxShadow: 1,
                                  }}
                                >
                                  <CloseIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {activeTab === 1 && (
        // Aba de Ordens Pendentes
        <>
          {orderValidationError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOrderValidationError('')}>
              {orderValidationError}
            </Alert>
          )}
          {pendingOrders.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary'
            }}>
              <Typography variant="body2">
                Nenhuma ordem pendente
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
              <Table size="small" sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 120 }}>Par</TableCell>
                    <TableCell sx={{ minWidth: 80 }}>Lado</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Tipo</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Preço</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Quantidade</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>Take Profit</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>Stop Loss</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Valor Total</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {order.symbol}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.side === 'buy' ? 'COMPRA' : 'VENDA'}
                          color={order.side === 'buy' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.type === 'limit' ? 'LIMITE' : 'MERCADO'}
                          color={order.type === 'limit' ? 'warning' : 'info'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {editingOrder === order.id ? (
                          <TextField
                            size="small"
                            type="number"
                            value={editOrderValues.price}
                            onChange={(e) => setEditOrderValues(prev => ({ ...prev, price: e.target.value }))}
                            sx={{ width: 100 }}
                            InputProps={{
                              startAdornment: <span style={{ marginRight: 4 }}>$</span>,
                            }}
                          />
                        ) : (
                          <Typography variant="body2">
                            ${order.price.toFixed(2)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingOrder === order.id ? (
                          <TextField
                            size="small"
                            type="number"
                            value={editOrderValues.quantity}
                            onChange={(e) => setEditOrderValues(prev => ({ ...prev, quantity: e.target.value }))}
                            sx={{ width: 100 }}
                          />
                        ) : (
                          <Typography variant="body2">
                            {order.amount.toFixed(6)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingOrder === order.id ? (
                          <TextField
                            size="small"
                            type="number"
                            value={editOrderValues.takeProfit}
                            onChange={(e) => setEditOrderValues(prev => ({ ...prev, takeProfit: e.target.value }))}
                            placeholder="TP"
                            sx={{ width: 100 }}
                            InputProps={{
                              startAdornment: <span style={{ marginRight: 4 }}>$</span>,
                            }}
                          />
                        ) : (
                          order.takeProfit ? (
                            <Chip
                              label={`$${order.takeProfit.toFixed(2)}`}
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )
                        )}
                      </TableCell>
                      <TableCell>
                        {editingOrder === order.id ? (
                          <TextField
                            size="small"
                            type="number"
                            value={editOrderValues.stopLoss}
                            onChange={(e) => setEditOrderValues(prev => ({ ...prev, stopLoss: e.target.value }))}
                            placeholder="SL"
                            sx={{ width: 100 }}
                            InputProps={{
                              startAdornment: <span style={{ marginRight: 4 }}>$</span>,
                            }}
                          />
                        ) : (
                          order.stopLoss ? (
                            <Chip
                              label={`$${order.stopLoss.toFixed(2)}`}
                              color="error"
                              size="small"
                              variant="outlined"
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          ${(order.price * order.amount).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label="PENDENTE"
                          color="warning"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {editingOrder === order.id ? (
                            <>
                              <Tooltip title="Salvar alterações">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => saveOrder(order)}
                                  sx={{
                                    backgroundColor: 'success.light',
                                    color: 'success.contrastText',
                                    '&:hover': {
                                      backgroundColor: 'success.main',
                                      transform: 'scale(1.1)',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                  }}
                                >
                                  <SaveIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancelar edição">
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={cancelEditOrder}
                                  sx={{
                                    backgroundColor: 'warning.light',
                                    color: 'warning.contrastText',
                                    '&:hover': {
                                      backgroundColor: 'warning.main',
                                      transform: 'scale(1.1)',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                  }}
                                >
                                  <CancelIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              <Tooltip title="Editar ordem">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => startEditOrder(order)}
                                  sx={{
                                    backgroundColor: 'primary.light',
                                    color: 'primary.contrastText',
                                    '&:hover': {
                                      backgroundColor: 'primary.main',
                                      transform: 'scale(1.1)',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                    boxShadow: 1,
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancelar ordem">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={async () => {
                                    try {
                                      console.log(`🔄 Cancelando ordem: ${order.id}`);
                                      
                                      // Cancelar ordem no tradingAPI
                                      const success = await tradingAPI.cancelOrder(order.id);
                                      
                                      if (success) {
                                        console.log(`✅ Ordem ${order.id} cancelada com sucesso`);
                                        onCancelOrder?.(order.id);
                                      } else {
                                        console.error(`❌ Erro ao cancelar ordem ${order.id}`);
                                      }
                                    } catch (error) {
                                      console.error('Erro ao cancelar ordem:', error);
                                    }
                                  }}
                                  sx={{
                                    backgroundColor: 'error.light',
                                    color: 'error.contrastText',
                                    '&:hover': {
                                      backgroundColor: 'error.main',
                                      transform: 'scale(1.1)',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                    boxShadow: 1,
                                  }}
                                >
                                  <CloseIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Paper>
  );
};

export default PositionsPanel; 