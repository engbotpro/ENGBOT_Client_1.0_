// src/services/tradingAPI.ts

export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  price: number;
  amount: number;
  status: 'pending' | 'filled' | 'cancelled';
  timestamp: number;
  takeProfit?: number;
  stopLoss?: number;
  filledPrice?: number;
  filledAmount?: number;
}

export interface Position {
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  amount: number;
  takeProfit?: number;
  stopLoss?: number;
  pnl: number;
  pnlPercent: number;
}

class TradingAPI {
  private orders: Order[] = [];
  private positions: Position[] = [];
  private currentPrice: number = 0;
  private currentCandle: { high: number; low: number; close: number } | null = null;

  // Simular preço atual baseado em dados da Binance
  async updateCurrentPrice(price: number, candle?: { high: number; low: number; close: number }) {
    this.currentPrice = price;
    if (candle) {
      this.currentCandle = candle;
    }
    await this.checkStopLossAndTakeProfit();
    await this.checkPendingOrders();
  }

  // Criar nova ordem
  async createOrder(orderData: Omit<Order, 'id' | 'status' | 'timestamp'>): Promise<Order> {
    console.log(`📝 createOrder chamado: ${orderData.symbol} ${orderData.side} ${orderData.amount} @ ${orderData.price}`);
    console.log(`📝 Tipo da ordem: ${orderData.type}`);
    console.log(`📝 Preço atual: ${this.currentPrice}`);
    
    const order: Order = {
      ...orderData,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      timestamp: Date.now(),
    };

    this.orders.push(order);
    console.log(`📋 Ordem criada: ${order.id} - ${order.symbol} ${order.side} ${order.type} @ ${order.price}`);
    console.log(`📋 Total de ordens: ${this.orders.length}`);
    console.log(`📋 Ordens pendentes: ${this.getPendingOrders().length}`);
    console.log(`📋 Todas as ordens:`, this.orders.map(o => `${o.symbol} ${o.side} ${o.type} ${o.status} @ ${o.price}`));

    // Salvar ordem no banco de dados
    await this.savePendingOrderToDatabase(order);

    // Se for ordem de mercado, executar imediatamente
    if (order.type === 'market') {
      console.log(`⚡ Executando ordem de mercado: ${order.symbol}`);
      await this.executeMarketOrder(order);
    } else {
      console.log(`⏳ Ordem limit criada e aguardando execução: ${order.symbol} @ ${order.price}`);
    }

    return order;
  }

  // Executar ordem de mercado
  private async executeMarketOrder(order: Order) {
    console.log(`⚡ executeMarketOrder: ${order.symbol} ${order.side} ${order.amount} @ ${this.currentPrice}`);
    
    order.status = 'filled';
    order.filledPrice = this.currentPrice;
    order.filledAmount = order.amount;

    console.log(`✅ Ordem executada: ${order.symbol} ${order.filledAmount} @ ${order.filledPrice}`);

    try {
      // Para ordens market, NÃO marcar pending order como executada via API
      // Apenas criar o trade diretamente, evitando duplicação
      // A pending order pode permanecer como 'pending' ou ser atualizada depois se necessário
      
      // Salvar trade no banco quando ordem market for executada
      // Todas as ordens market criam trades "open" (abertos) para aparecerem como posições ativas
      await this.saveExecutedOrderToDatabase(order);

      // SEMPRE criar posição para ordens market executadas
      // Isso permite que o trade apareça como posição ativa, mesmo sem TP/SL
      console.log(`📊 Criando posição para ordem market: ${order.symbol}`);
      this.updatePosition(order);
    } catch (error) {
      console.error(`❌ Erro ao processar ordem de mercado ${order.id}:`, error);
      // Não reverter o status 'filled' para não perder o estado local, mas logar o erro
    }
  }

  // Função para validar saldo da carteira (será implementada)
  private walletValidationCallback?: (symbol: string, side: 'buy' | 'sell', amount: number, price: number) => Promise<boolean>;

  // Registrar callback de validação da carteira
  setWalletValidationCallback(callback: (symbol: string, side: 'buy' | 'sell', amount: number, price: number) => Promise<boolean>) {
    this.walletValidationCallback = callback;
  }

  // Executar ordem limite quando preço for atingido
  private async executeLimitOrder(order: Order) {
    console.log(`🔍 Verificando ordem limit: ${order.symbol} ${order.side} @ ${order.price} (preço atual: ${this.currentPrice})`);
    
    // Para ordens limit, executar apenas quando o preço atingir exatamente o valor especificado
    let shouldExecute = false;
    
    if (order.side === 'buy') {
      // Ordem de compra: executar quando preço atual >= preço da ordem
      shouldExecute = this.currentPrice >= order.price;
      console.log(`🔍 Ordem de compra: ${this.currentPrice} >= ${order.price} = ${shouldExecute}`);
    } else if (order.side === 'sell') {
      // Ordem de venda: executar quando preço atual <= preço da ordem
      shouldExecute = this.currentPrice <= order.price;
      console.log(`🔍 Ordem de venda: ${this.currentPrice} <= ${order.price} = ${shouldExecute}`);
    }
    
    if (shouldExecute) {
      // Validar saldo se callback estiver disponível
      if (this.walletValidationCallback) {
        const hasValidBalance = await this.walletValidationCallback(order.symbol, order.side, order.amount, order.price);
        if (!hasValidBalance) {
          console.log(`❌ Saldo insuficiente para executar ordem: ${order.symbol} ${order.side}`);
          order.status = 'cancelled';
          return;
        }
      }

      console.log(`✅ Executando ordem limit: ${order.symbol} ${order.side} @ ${order.price}`);
      order.status = 'filled';
      order.filledPrice = order.price;
      order.filledAmount = order.amount;
      
      // Para ordens limit executadas, criar trade via endpoint /execute que gerencia tudo
      // Isso garante consistência com ordens executadas automaticamente
      await this.markPendingOrderAsExecuted(order);
      
      // Só criar posição se tiver TP ou SL
      const hasTPSL = order.takeProfit || order.stopLoss;
      if (hasTPSL) {
        console.log(`📊 Criando posição com TP/SL: ${order.symbol}`);
        this.updatePosition(order);
      } else {
        console.log(`✅ Trade limit finalizado imediatamente (sem TP/SL): ${order.symbol}`);
      }
    } else {
      console.log(`⏳ Ordem limit ainda pendente: ${order.symbol} ${order.side} @ ${order.price} (preço atual: ${this.currentPrice})`);
    }
  }

  // Salvar ordem pendente no banco de dados
  private async savePendingOrderToDatabase(order: Order) {
    try {
      const pendingOrderData = {
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        quantity: order.amount,
        price: order.price,
        total: order.price * order.amount,
        takeProfit: order.takeProfit,
        stopLoss: order.stopLoss,
        notes: `Ordem ${order.type} ${order.side} ${order.symbol}`,
        environment: 'simulated'
      };

      console.log('💾 Salvando ordem pendente no banco:', pendingOrderData);

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        console.error('❌ Token de autenticação não encontrado');
        return;
      }

      const response = await fetch('http://localhost:5000/api/pending-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(pendingOrderData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Ordem pendente salva no banco:', result);
        // Atualizar o ID da ordem com o ID do banco
        order.id = result.data.id;
      } else {
        console.error('❌ Erro ao salvar ordem pendente no banco');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar ordem pendente:', error);
    }
  }

  // Marcar ordem pendente como executada no banco (com criação de trade)
  private async markPendingOrderAsExecuted(order: Order) {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        console.error('❌ Token de autenticação não encontrado');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/pending-orders/${order.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          exitPrice: order.filledPrice,
          pnl: 0, // Será calculado depois
          pnlPercent: 0 // Será calculado depois
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Ordem pendente marcada como executada no banco:', result);
      } else {
        console.error('❌ Erro ao marcar ordem como executada no banco');
      }
    } catch (error) {
      console.error('❌ Erro ao marcar ordem como executada:', error);
    }
  }

  // Marcar ordem pendente como executada SEM criar trade (apenas atualizar status)
  private async markPendingOrderAsExecutedWithoutCreatingTrade(order: Order) {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        console.error('❌ Token de autenticação não encontrado');
        return;
      }

      // Atualizar apenas o status da pending order para 'filled' sem criar trade
      const response = await fetch(`http://localhost:5000/api/pending-orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          status: 'filled'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Ordem pendente marcada como executada (sem criar trade duplicado):', result);
      } else {
        console.error('❌ Erro ao marcar ordem como executada no banco');
      }
    } catch (error) {
      console.error('❌ Erro ao marcar ordem como executada:', error);
    }
  }

  // Salvar ordem executada no banco de dados
  private async saveExecutedOrderToDatabase(order: Order) {
    try {
      // Todas as ordens market são salvas como "open" para aparecerem como posições ativas
      // O trade só será fechado quando o usuário fechar manualmente ou quando TP/SL for atingido
      const tradeData = {
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        quantity: order.filledAmount!,
        price: order.filledPrice!,
        total: order.filledPrice! * order.filledAmount!,
        tradeType: 'manual',
        environment: 'simulated',
        status: 'open', // Sempre "open" para ordens market, para aparecer como posição ativa
        takeProfit: order.takeProfit,
        stopLoss: order.stopLoss,
        notes: `Trade manual ${order.side} ${order.symbol}`,
      };

      console.log('💾 Salvando ordem executada no banco:', tradeData);

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        console.error('❌ Token de autenticação não encontrado');
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch('http://localhost:5000/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(tradeData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Ordem executada salva no banco:', result);
        return result;
      } else {
        const errorText = await response.text();
        console.error('❌ Erro ao salvar ordem executada no banco:', response.status, errorText);
        throw new Error(`Erro ao salvar ordem executada: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar ordem executada:', error);
      throw error; // Re-lançar erro para que possa ser tratado acima
    }
  }

  // Atualizar posição
  private updatePosition(order: Order) {
    console.log(`🔄 updatePosition chamado: ${order.symbol} ${order.side} ${order.filledAmount} @ ${order.filledPrice}`);
    console.log(`📊 Posições antes: ${this.positions.length}`);
    
    const existingPosition = this.positions.find(p => p.symbol === order.symbol);
    
    if (existingPosition) {
      console.log(`🔄 Posição existente encontrada: ${existingPosition.symbol} ${existingPosition.side} ${existingPosition.amount}`);
      
      // Atualizar posição existente
      if (existingPosition.side === 'long' && order.side === 'sell') {
        // Fechar posição long
        console.log(`📉 Fechando posição long: ${order.symbol}`);
        const pnl = (order.filledPrice! - existingPosition.entryPrice) * order.filledAmount!;
        existingPosition.pnl += pnl;
        existingPosition.amount -= order.filledAmount!;
        
        if (existingPosition.amount <= 0) {
          // Remover posição se totalmente fechada
          this.positions = this.positions.filter(p => p.symbol !== order.symbol);
          console.log(`🗑️ Posição removida: ${order.symbol}`);
        }
      } else if (existingPosition.side === 'short' && order.side === 'buy') {
        // Fechar posição short
        console.log(`📉 Fechando posição short: ${order.symbol}`);
        const pnl = (existingPosition.entryPrice - order.filledPrice!) * order.filledAmount!;
        existingPosition.pnl += pnl;
        existingPosition.amount -= order.filledAmount!;
        
        if (existingPosition.amount <= 0) {
          this.positions = this.positions.filter(p => p.symbol !== order.symbol);
          console.log(`🗑️ Posição removida: ${order.symbol}`);
        }
      } else {
        // Adicionar à posição existente
        console.log(`➕ Adicionando à posição existente: ${order.symbol}`);
        const totalValue = (existingPosition.entryPrice * existingPosition.amount) + 
                          (order.filledPrice! * order.filledAmount!);
        const totalAmount = existingPosition.amount + order.filledAmount!;
        existingPosition.entryPrice = totalValue / totalAmount;
        existingPosition.amount = totalAmount;
        console.log(`📊 Posição atualizada: ${existingPosition.symbol} ${existingPosition.amount} @ ${existingPosition.entryPrice.toFixed(2)}`);
      }
    } else {
      // Criar nova posição
      console.log(`➕ Criando nova posição: ${order.symbol} ${order.side === 'buy' ? 'long' : 'short'}`);
      const position: Position = {
        symbol: order.symbol,
        side: order.side === 'buy' ? 'long' : 'short',
        entryPrice: order.filledPrice!,
        amount: order.filledAmount!,
        takeProfit: order.takeProfit,
        stopLoss: order.stopLoss,
        pnl: 0,
        pnlPercent: 0,
      };
      this.positions.push(position);
      console.log(`✅ Nova posição criada: ${position.symbol} ${position.amount} @ ${position.entryPrice}`);
    }
    
    console.log(`📊 Posições depois: ${this.positions.length}`);
    console.log(`📊 Posições atuais:`, this.positions.map(p => `${p.symbol} ${p.side} ${p.amount}`));
  }

  // Verificar Stop Loss e Take Profit
  private async checkStopLossAndTakeProfit() {
    if (!this.currentCandle) {
      // Fallback para usar apenas o preço de fechamento se não tiver dados do candle
      this.currentCandle = { high: this.currentPrice, low: this.currentPrice, close: this.currentPrice };
    }

    const positionsToClose = [];

    for (const position of this.positions) {
      if (position.side === 'long') {
        // Para posição long: verificar se low do candle tocou o stop loss ou high tocou take profit
        if (position.stopLoss && this.currentCandle.low <= position.stopLoss) {
          // Stop Loss atingido - usar o preço do stop loss
          positionsToClose.push({ position, price: position.stopLoss, reason: 'stop_loss' });
        } else if (position.takeProfit && this.currentCandle.high >= position.takeProfit) {
          // Take Profit atingido - usar o preço do take profit
          positionsToClose.push({ position, price: position.takeProfit, reason: 'take_profit' });
        }
      } else if (position.side === 'short') {
        // Para posição short: verificar se high do candle tocou o stop loss ou low tocou take profit
        if (position.stopLoss && this.currentCandle.high >= position.stopLoss) {
          // Stop Loss atingido - usar o preço do stop loss
          positionsToClose.push({ position, price: position.stopLoss, reason: 'stop_loss' });
        } else if (position.takeProfit && this.currentCandle.low <= position.takeProfit) {
          // Take Profit atingido - usar o preço do take profit
          positionsToClose.push({ position, price: position.takeProfit, reason: 'take_profit' });
        }
      }
    }

    // Fechar todas as posições que foram acionadas
    for (const { position, price, reason } of positionsToClose) {
      await this.closePosition(position, price, reason);
    }
  }

  // Verificar ordens pendentes
  private async checkPendingOrders() {
    // Log removido para evitar loop infinito
    
    for (const order of this.orders) {
      if (order.status === 'pending' && order.type === 'limit') {
        // Log removido para evitar loop infinito
        await this.executeLimitOrder(order);
      }
    }
  }

  // Fechar posição
  private async closePosition(position: Position, price: number, reason: 'take_profit' | 'stop_loss') {
    const pnl = position.side === 'long' 
      ? (price - position.entryPrice) * position.amount
      : (position.entryPrice - price) * position.amount;
    
    position.pnl += pnl;
    position.pnlPercent = (pnl / (position.entryPrice * position.amount)) * 100;
    
    console.log(`🛑 Posição fechada por ${reason}: ${position.symbol} - PnL: ${pnl.toFixed(2)} USDT`);
    
    // Fechar trades no banco de dados
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        console.error('❌ Token de autenticação não encontrado');
        // Remover posição mesmo assim
        this.positions = this.positions.filter(p => p.symbol !== position.symbol);
        return;
      }

      // Buscar todos os trades abertos do símbolo
      const response = await fetch('http://localhost:5000/api/trades', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const tradesData = await response.json();
        const symbolTrades = tradesData.data?.filter((t: any) => 
          t.symbol === position.symbol && 
          t.status === 'open' &&
          t.environment === 'simulated'
        ) || [];
        
        // Fechar todos os trades do símbolo
        for (const trade of symbolTrades) {
          const tradePnl = trade.side === 'buy'
            ? (price - trade.price) * trade.quantity
            : (trade.price - price) * trade.quantity;
          
          const tradePnlPercent = (tradePnl / (trade.price * trade.quantity)) * 100;

          const updateResponse = await fetch(`http://localhost:5000/api/trades/${trade.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              status: 'closed',
              exitTime: new Date().toISOString(),
              exitPrice: price,
              pnl: tradePnl,
              pnlPercent: tradePnlPercent,
              fees: 0.1,
              notes: `Fechado automaticamente por ${reason === 'stop_loss' ? 'Stop Loss' : 'Take Profit'}`
            })
          });
          
          if (updateResponse.ok) {
            console.log(`✅ Trade ${trade.id} fechado no banco de dados por ${reason}`);
          } else {
            console.error(`❌ Erro ao fechar trade ${trade.id} no banco de dados`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao fechar trades no banco de dados:', error);
    }
    
    // Remover posição após tentar fechar no banco
    this.positions = this.positions.filter(p => p.symbol !== position.symbol);
  }

  // Obter ordens
  getOrders(): Order[] {
    return [...this.orders];
  }

  // Obter ordens pendentes
  getPendingOrders(): Order[] {
    const pendingOrders = this.orders.filter(order => order.status === 'pending');
    // Log removido para evitar loop infinito
    return pendingOrders;
  }

  // Obter posições
  getPositions(): Position[] {
    // Log removido para evitar loop infinito
    const positions = this.positions.map(position => ({
      ...position,
      pnl: this.calculateCurrentPnL(position),
      pnlPercent: this.calculateCurrentPnLPercent(position),
    }));
    return positions;
  }

  // Adicionar posição manualmente (para carregar trades existentes)
  addPosition(position: Position) {
    console.log(`🔧 Adicionando posição ao tradingAPI: ${position.symbol} ${position.side}`);
    console.log(`🔧 Posições antes: ${this.positions.length}`);
    
    const existingPosition = this.positions.find(p => p.symbol === position.symbol);
    
    if (existingPosition) {
      // Acumular posição existente (somar quantidades e calcular preço médio)
      console.log(`🔄 Acumulando posição existente: ${position.symbol}`);
      
      const totalValue = (existingPosition.entryPrice * existingPosition.amount) + 
                        (position.entryPrice * position.amount);
      const totalAmount = existingPosition.amount + position.amount;
      
      existingPosition.entryPrice = totalValue / totalAmount;
      existingPosition.amount = totalAmount;
      existingPosition.pnl += position.pnl || 0;
      existingPosition.pnlPercent = (existingPosition.pnl / (existingPosition.entryPrice * existingPosition.amount)) * 100;
      
      console.log(`📊 Posição acumulada: ${existingPosition.symbol} ${existingPosition.amount} @ ${existingPosition.entryPrice.toFixed(2)}`);
    } else {
      // Adicionar nova posição
      console.log(`➕ Adicionando nova posição: ${position.symbol}`);
      this.positions.push(position);
    }
    
    console.log(`🔧 Posições depois: ${this.positions.length}`);
    console.log(`🔧 Posições atuais:`, this.positions.map(p => `${p.symbol} ${p.side} ${p.amount}`));
  }

  // Adicionar ordem manualmente (para carregar ordens pendentes do banco)
  addOrder(order: Order) {
    console.log(`🔧 Adicionando ordem ao tradingAPI: ${order.symbol} ${order.side} ${order.type}`);
    console.log(`🔧 Ordens antes: ${this.orders.length}`);
    
    // Verificar se a ordem já existe
    const existingOrder = this.orders.find(o => o.id === order.id);
    if (!existingOrder) {
      this.orders.push(order);
      console.log(`➕ Ordem adicionada: ${order.symbol} ${order.side} ${order.type} @ ${order.price}`);
    } else {
      console.log(`🔄 Ordem já existe: ${order.symbol} ${order.side} ${order.type}`);
    }
    
    console.log(`🔧 Ordens depois: ${this.orders.length}`);
    console.log(`🔧 Ordens atuais:`, this.orders.map(o => `${o.symbol} ${o.side} ${o.type} ${o.status} @ ${o.price}`));
  }

  // Limpar todas as posições (para recarregar do banco)
  clearPositions() {
    console.log(`🧹 Limpando posições. Antes: ${this.positions.length}`);
    console.log(`🧹 Ordens antes de limpar: ${this.orders.length}`);
    this.positions = [];
    this.orders = [];
    console.log(`🧹 Posições limpas. Depois: ${this.positions.length}`);
    console.log(`🧹 Ordens limpas. Depois: ${this.orders.length}`);
  }

  // Limpar apenas posições (mantendo ordens pendentes)
  clearPositionsOnly() {
    console.log(`🧹 Limpando apenas posições. Antes: ${this.positions.length}`);
    console.log(`🧹 Ordens mantidas: ${this.orders.length}`);
    this.positions = [];
    console.log(`🧹 Posições limpas. Depois: ${this.positions.length}`);
    console.log(`🧹 Ordens mantidas. Depois: ${this.orders.length}`);
  }

  // Calcular PnL atual
  private calculateCurrentPnL(position: Position): number {
    if (position.side === 'long') {
      return (this.currentPrice - position.entryPrice) * position.amount;
    } else {
      return (position.entryPrice - this.currentPrice) * position.amount;
    }
  }

  // Calcular PnL percentual atual
  private calculateCurrentPnLPercent(position: Position): number {
    const pnl = this.calculateCurrentPnL(position);
    return (pnl / (position.entryPrice * position.amount)) * 100;
  }

  // Cancelar ordem
  async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.orders.find(o => o.id === orderId);
    if (order && order.status === 'pending') {
      order.status = 'cancelled';
      
      // Cancelar no banco de dados
      try {
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
          const response = await fetch(`http://localhost:5000/api/pending-orders/${orderId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });

          if (response.ok) {
            console.log('✅ Ordem cancelada no banco de dados');
          } else {
            console.error('❌ Erro ao cancelar ordem no banco');
          }
        }
      } catch (error) {
        console.error('❌ Erro ao cancelar ordem no banco:', error);
      }
      
      return true;
    }
    return false;
  }

  // Fechar posição manualmente
  async closePositionManually(symbol: string): Promise<boolean> {
    const position = this.positions.find(p => p.symbol === symbol);
    if (!position) {
      return false;
    }

    // Criar ordem de fechamento
    const closeOrder: Order = {
      id: `close_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      side: position.side === 'long' ? 'sell' : 'buy',
      type: 'market',
      price: this.currentPrice,
      amount: position.amount,
      status: 'filled',
      timestamp: Date.now(),
      filledPrice: this.currentPrice,
      filledAmount: position.amount,
    };

    this.orders.push(closeOrder);
    
    // Remover posição
    this.positions = this.positions.filter(p => p.symbol !== symbol);
    
    return true;
  }

  // Atualizar TP/SL de uma posição
  updatePositionTPSL(symbol: string, takeProfit?: number, stopLoss?: number): boolean {
    const position = this.positions.find(p => p.symbol === symbol);
    if (!position) {
      console.error(`❌ Posição não encontrada: ${symbol}`);
      return false;
    }

    position.takeProfit = takeProfit;
    position.stopLoss = stopLoss;
    
    console.log(`✅ TP/SL atualizado para ${symbol}:`, { takeProfit, stopLoss });
    return true;
  }

  // Obter preço atual
  getCurrentPrice(): number {
    return this.currentPrice;
  }

  // Limpar ordens de desafio que possam ter sido criadas erroneamente
  cleanupChallengeOrders(): void {
    const beforeCount = this.orders.length;
    this.orders = this.orders.filter(order => !order.id.startsWith('challenge-'));
    const afterCount = this.orders.length;
    
    if (beforeCount !== afterCount) {
      console.log(`🧹 Removidas ${beforeCount - afterCount} ordens de desafio do sistema normal`);
    }
  }
}

export const tradingAPI = new TradingAPI(); 