// src/components/TradingPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ListAlt as ListAltIcon } from '@mui/icons-material';
import MarketInfo from './MarketInfo';
import OrderBook from './OrderBook';
import PriceChart from './PriceChart';
import Trades from './Trades';
import OrderForm from './OrderForm';
import CompactOrderForm from './CompactOrderForm';
import PositionsPanel from './PositionsPanel';
import Ticker from './Ticker';
import { tradingAPI, type Order, type Position } from '../../services/tradingAPI';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useLocalStorage } from '../../hooks/usePersistence';
import walletAPI from '../../services/walletAPI';

const TradingPage: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useLocalStorage('selectedSymbol', 'BTCUSDT');
  const symbolChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounce para mudanças de símbolo para evitar requisições simultâneas
  const handleSymbolChange = useCallback((newSymbol: string) => {
    console.log('[TradingPage] handleSymbolChange chamado:', newSymbol);
    
    // Cancelar timeout anterior se existir
    if (symbolChangeTimeoutRef.current) {
      clearTimeout(symbolChangeTimeoutRef.current);
    }
    
    // Aguardar 100ms antes de atualizar o símbolo
    symbolChangeTimeoutRef.current = setTimeout(() => {
      console.log('[TradingPage] Atualizando símbolo após debounce:', newSymbol);
      setSelectedSymbol(newSymbol);
      symbolChangeTimeoutRef.current = null;
    }, 100);
  }, [setSelectedSymbol]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [positions, setPositions] = useState<Position[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id || '');
  const navigate = useNavigate();

  const handleOrderCreated = async (order: Order) => {
    console.log('🔄 handleOrderCreated chamado:', order);
    console.log('🔄 Tipo da ordem:', order.type);
    console.log('🔄 Status da ordem:', order.status);
    
    // Aguardar um pouco para garantir que a ordem foi processada
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Limpar ordens de desafio que possam ter vazado para o sistema normal
    tradingAPI.cleanupChallengeOrders();
    
    // Atualizar ordens pendentes
    const updatedPendingOrders = tradingAPI.getPendingOrders();
    console.log('🔄 Ordens pendentes atualizadas:', updatedPendingOrders.length);
    console.log('🔄 Detalhes das ordens pendentes:', updatedPendingOrders.map(o => `${o.symbol} ${o.side} @ ${o.price}`));
    setPendingOrders(updatedPendingOrders);
    
    // Se a ordem foi executada (filled), atualizar saldos da carteira
    if (order.status === 'filled') {
      await updateWalletBalancesAfterTrade(order);
    }
    
    // Forçar recarregamento das posições do banco de dados
    await forceReloadPositions();
  };

  // Função para atualizar saldos da carteira após execução de trade
  const updateWalletBalancesAfterTrade = async (order: Order) => {
    try {
      const baseAsset = order.symbol.replace('USDT', '');
      const quoteAsset = 'USDT';
      const executedPrice = order.filledPrice || order.price;
      const executedAmount = order.filledAmount || order.amount;
      
      // Buscar saldos atuais
      const currentWallets = await walletAPI.getUserWallets('virtual');
      
      if (order.side === 'buy') {
        // Compra: reduzir USDT, aumentar ativo base
        const totalCost = executedPrice * executedAmount;
        
        // Reduzir saldo de USDT
        const usdtWallet = currentWallets.find(w => w.symbol === quoteAsset);
        if (usdtWallet) {
          const newBalance = usdtWallet.balance - totalCost;
          const newValue = usdtWallet.value - totalCost;
          
          await walletAPI.updateWalletBalance({
            type: 'virtual',
            symbol: quoteAsset,
            name: usdtWallet.name,
            balance: Math.max(0, newBalance), // Garantir que não seja negativo
            value: Math.max(0, newValue)
          });
        }
        
        // Aumentar saldo do ativo base
        const baseWallet = currentWallets.find(w => w.symbol === baseAsset);
        if (baseWallet) {
          await walletAPI.updateWalletBalance({
            type: 'virtual',
            symbol: baseAsset,
            name: baseWallet.name,
            balance: baseWallet.balance + executedAmount,
            value: baseWallet.value + totalCost
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
        const baseWallet = currentWallets.find(w => w.symbol === baseAsset);
        if (baseWallet) {
          const newBalance = baseWallet.balance - executedAmount;
          const newValue = baseWallet.value - totalReceived;
          
          await walletAPI.updateWalletBalance({
            type: 'virtual',
            symbol: baseAsset,
            name: baseWallet.name,
            balance: Math.max(0, newBalance), // Garantir que não seja negativo
            value: Math.max(0, newValue)
          });
        }
        
        // Aumentar saldo de USDT
        const usdtWallet = currentWallets.find(w => w.symbol === quoteAsset);
        if (usdtWallet) {
          await walletAPI.updateWalletBalance({
            type: 'virtual',
            symbol: quoteAsset,
            name: usdtWallet.name,
            balance: usdtWallet.balance + totalReceived,
            value: usdtWallet.value + totalReceived
          });
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar saldos da carteira:', error);
    }
  };

  const handlePositionUpdated = (updatedPositions: Position[]) => {
    setPositions(updatedPositions);
    
    // Atualizar também as ordens pendentes
    const updatedPendingOrders = tradingAPI.getPendingOrders();
    setPendingOrders(updatedPendingOrders);
  };

  // Função para recarregar ordens pendentes do backend
  const reloadPendingOrders = async () => {
    try {
      console.log('🔄 Recarregando ordens pendentes do backend...');
      
      // Buscar ordens pendentes do backend
      const pendingOrdersResponse = await fetch('http://localhost:5000/api/pending-orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (pendingOrdersResponse.ok) {
        const pendingOrdersData = await pendingOrdersResponse.json();
        console.log('📊 Ordens pendentes do banco (reload):', pendingOrdersData.data);
        
        // Filtrar apenas ordens pendentes
        const filteredPendingOrders = (pendingOrdersData.data || []).filter((po: any) => po.status === 'pending');
        
        // Converter para formato Order e atualizar diretamente o estado da interface
        const updatedOrders: Order[] = filteredPendingOrders.map((pendingOrder: any) => ({
          id: pendingOrder.id,
          symbol: pendingOrder.symbol,
          side: pendingOrder.side as 'buy' | 'sell',
          type: pendingOrder.type as 'limit' | 'market',
          price: pendingOrder.price,
          amount: pendingOrder.quantity,
          status: pendingOrder.status as 'pending' | 'filled' | 'cancelled',
          timestamp: new Date(pendingOrder.createdAt).getTime(),
          takeProfit: pendingOrder.takeProfit || undefined,
          stopLoss: pendingOrder.stopLoss || undefined
        }));
        
        console.log(`✅ Ordens pendentes recarregadas: ${updatedOrders.length}`);
        
        // Atualizar diretamente o estado da interface
        setPendingOrders(updatedOrders);
      }
    } catch (error) {
      console.error('❌ Erro ao recarregar ordens pendentes:', error);
    }
  };

  const handleOrderCancelled = async (orderId: string) => {
    console.log(`🔄 Ordem cancelada/editada: ${orderId}`);
    
    // Recarregar ordens pendentes do backend
    await reloadPendingOrders();
  };

  const handlePriceUpdate = (price: number) => {
    setCurrentPrice(price);
  };

  // Função para forçar recarregamento das posições
  const forceReloadPositions = async () => {
    if (!currentUserId) return;

    try {
      setIsLoadingPositions(true);
      console.log('🔄 Forçando recarregamento das posições...');
      
      // Limpar apenas posições existentes (mantendo ordens pendentes)
      tradingAPI.clearPositionsOnly();
      
      // Buscar todos os trades abertos do usuário da tabela Trade
      const response = await fetch('http://localhost:5000/api/trades', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const tradesData = await response.json();
        console.log('📊 Todos os trades (forceReloadPositions):', tradesData.data);
        
        // Filtrar apenas trades abertos (posições ativas)
        // Todos os trades abertos devem aparecer como posições, mesmo sem TP/SL
        const openTrades = tradesData.data?.filter((trade: any) => 
          trade.status === 'open' && 
          trade.environment === 'simulated'
        ) || [];
        
        console.log(`📊 Encontrados ${openTrades.length} trades abertos (forceReloadPositions):`, openTrades);
      
        openTrades.forEach((trade: any) => {
          const position: Position = {
            symbol: trade.symbol,
            side: trade.side === 'buy' ? 'long' : 'short',
            entryPrice: trade.price,
            amount: trade.quantity,
            takeProfit: trade.takeProfit || undefined,
            stopLoss: trade.stopLoss || undefined,
            pnl: trade.pnl || 0,
            pnlPercent: trade.pnlPercent || 0
          };
          
          tradingAPI.addPosition(position);
          console.log(`➕ Posição adicionada: ${position.symbol} ${position.side} TP: ${position.takeProfit} SL: ${position.stopLoss}`);
        });

        const finalPositions = tradingAPI.getPositions();
        const finalPendingOrders = tradingAPI.getPendingOrders();
        console.log(`✅ Posições finais: ${finalPositions.length}`);
        console.log(`✅ Ordens pendentes finais: ${finalPendingOrders.length}`);
        setPositions(finalPositions);
        setPendingOrders(finalPendingOrders);
        
        // Forçar re-render do componente
        setTimeout(() => {
          const updatedPositions = tradingAPI.getPositions();
          const updatedPendingOrders = tradingAPI.getPendingOrders();
          console.log(`🔄 Posições após timeout: ${updatedPositions.length}`);
          console.log(`🔄 Ordens pendentes após timeout: ${updatedPendingOrders.length}`);
          setPositions(updatedPositions);
          setPendingOrders(updatedPendingOrders);
        }, 200);
      }
    } catch (error) {
      console.error('❌ Erro ao forçar recarregamento:', error);
    } finally {
      setIsLoadingPositions(false);
    }
  };

  // Carregar trades existentes quando a página é carregada
  useEffect(() => {
    const loadExistingTrades = async () => {
      if (!currentUserId) return;

      try {
        console.log('🔄 Carregando trades existentes...');
        
        // Limpar ordens de desafio que possam ter vazado para o sistema normal
        tradingAPI.cleanupChallengeOrders();
        
        // Limpar apenas posições existentes antes de carregar (mantendo ordens pendentes)
        tradingAPI.clearPositionsOnly();
        
        // Buscar trades abertos do usuário da tabela Trade
        const response = await fetch('http://localhost:5000/api/trades', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (response.ok) {
          const tradesData = await response.json();
          console.log('📊 Todos os trades:', tradesData.data);
          
                  // Filtrar apenas trades abertos (posições ativas)
          // Todos os trades abertos devem aparecer como posições, mesmo sem TP/SL
        const openTrades = tradesData.data?.filter((trade: any) => 
          trade.status === 'open' && 
          trade.environment === 'simulated'
        ) || [];
          
          console.log(`📊 Encontrados ${openTrades.length} trades abertos:`, openTrades);
          
          // Converter trades para posições do tradingAPI
          openTrades.forEach((trade: any) => {
            console.log(`➕ Adicionando trade: ${trade.symbol} ${trade.side} ${trade.quantity} @ ${trade.price}`);
            
            const position: Position = {
              symbol: trade.symbol,
              side: trade.side === 'buy' ? 'long' : 'short',
              entryPrice: trade.price,
              amount: trade.quantity,
              takeProfit: trade.takeProfit || undefined,
              stopLoss: trade.stopLoss || undefined,
              pnl: trade.pnl || 0,
              pnlPercent: trade.pnlPercent || 0
            };
            
            console.log(`📋 Posição criada:`, position);
            
            // Adicionar posição ao tradingAPI
            tradingAPI.addPosition(position);
            
            // Verificar posições após adicionar
            const currentPositions = tradingAPI.getPositions();
            console.log(`📊 Posições após adicionar ${position.symbol}: ${currentPositions.length}`);
          });

          // Atualizar posições na interface
          const updatedPositions = tradingAPI.getPositions();
          console.log(`✅ Posições carregadas: ${updatedPositions.length}`);
          setPositions(updatedPositions);
        }

        // Buscar ordens pendentes do usuário (independente de ter trades abertos)
        const pendingOrdersResponse = await fetch('http://localhost:5000/api/pending-orders', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (pendingOrdersResponse.ok) {
          const pendingOrdersData = await pendingOrdersResponse.json();
          console.log('📊 Ordens pendentes do banco:', pendingOrdersData.data);
          
          // Adicionar ordens pendentes ao tradingAPI
          pendingOrdersData.data?.forEach((pendingOrder: any) => {
            const order: Order = {
              id: pendingOrder.id,
              symbol: pendingOrder.symbol,
              side: pendingOrder.side as 'buy' | 'sell',
              type: pendingOrder.type as 'limit' | 'market',
              price: pendingOrder.price,
              amount: pendingOrder.quantity,
              status: pendingOrder.status as 'pending' | 'filled' | 'cancelled',
              timestamp: new Date(pendingOrder.createdAt).getTime(),
              takeProfit: pendingOrder.takeProfit,
              stopLoss: pendingOrder.stopLoss
            };
            
            tradingAPI.addOrder(order);
            console.log(`➕ Ordem pendente adicionada: ${order.symbol} ${order.side} @ ${order.price}`);
          });
        }

        // Atualizar ordens pendentes na interface
        const updatedPendingOrders = tradingAPI.getPendingOrders();
        console.log(`✅ Ordens pendentes carregadas: ${updatedPendingOrders.length}`);
        setPendingOrders(updatedPendingOrders);
        
        // Forçar re-render do componente
        setTimeout(() => {
          const finalPositions = tradingAPI.getPositions();
          const finalPendingOrders = tradingAPI.getPendingOrders();
          console.log(`🔄 Posições finais: ${finalPositions.length}`);
          console.log(`🔄 Ordens pendentes finais: ${finalPendingOrders.length}`);
          setPositions(finalPositions);
          setPendingOrders(finalPendingOrders);
        }, 100);
      } catch (error) {
        console.error('❌ Erro ao carregar trades existentes:', error);
      }
    };

    loadExistingTrades();
  }, [currentUserId]);

  // Atualizar posições quando o símbolo mudar
  useEffect(() => {
    if (currentUserId) {
      // Recarregar posições quando o símbolo mudar para garantir que temos as posições mais recentes
      const timer = setTimeout(() => {
        forceReloadPositions();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [selectedSymbol, currentUserId]);

  return (
    <Box
      sx={{
        height: '95vh',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {/* Linha superior: Info de mercado (com seletor e botão integrados) */}
      <Box
        sx={{
          mb: 2,
          flexShrink: 0,
          width: '100%',
        }}
      >
        <MarketInfo 
          symbol={selectedSymbol}
          onSymbolChange={handleSymbolChange}
          onAllOrdersClick={() => navigate('/home/allPositions')}
        />
      </Box>

      {/* Conteúdo principal */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0 }}>
        {/* Linha superior: OrderBook, Gráfico, Ticker e Trades */}
        <Box sx={{ display: 'flex', gap: 2, flex: 1, minHeight: 0 }}>
          {/* Coluna esquerda: OrderBook */}
          <Box
            sx={{
              width: '18%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              height: '100%',
            }}
          >
            <OrderBook symbol={selectedSymbol} />
          </Box>

          {/* Coluna central: Gráfico */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <PriceChart 
              symbol={selectedSymbol}
              onPriceUpdate={handlePriceUpdate}
              positions={positions}
              onPositionUpdated={handlePositionUpdated}
              isLoadingPositions={isLoadingPositions}
            />
            
            {/* CompactOrderForm abaixo do gráfico */}
            <Box sx={{ mt: 1, flexShrink: 0 }}>
              <CompactOrderForm 
                symbol={selectedSymbol}
                currentPrice={currentPrice}
                onOrderCreated={handleOrderCreated}
                onPositionUpdated={handlePositionUpdated}
              />
            </Box>
          </Box>

          {/* Coluna direita: Ticker + Trades */}
          <Box
            sx={{
              width: '18%',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              overflow: 'hidden',
              height: '100%',
            }}
          >
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <Ticker onSymbolSelect={handleSymbolChange} />
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <Trades symbol={selectedSymbol} />
            </Box>
          </Box>
        </Box>

        {/* Linha inferior: Posições Ativas e Ordens Pendentes */}
        <Box sx={{ height: 250, flexShrink: 0 }}>
          <PositionsPanel
            positions={positions}
            pendingOrders={pendingOrders}
            onClosePosition={() => {
              // Recarregar posições após fechar
              setTimeout(() => {
                forceReloadPositions();
              }, 500);
            }}
            onCancelOrder={handleOrderCancelled}
            onUpdateTPSL={() => {
              // Recarregar posições após atualizar TP/SL
              console.log('🔄 Recarregando posições após atualização de TP/SL...');
              forceReloadPositions();
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default TradingPage;
