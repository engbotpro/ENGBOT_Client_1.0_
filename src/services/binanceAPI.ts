// src/services/binanceAPI.ts

export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

export interface ChartData {
  time:   number;
  open:   number;
  high:   number;
  low:    number;
  close:  number;
}

export interface OrderBookEntry {
  price: string;
  quantity: string;
}

export interface OrderBook {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

export interface Trade {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}

export interface Ticker24hr {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface Candle {  
  time: number;    // timestamp em ms  
  open: number;  
  high: number;  
  low: number;  
  close: number;  
  volume: number;  // volume negociado
}

// Função para buscar dados de klines (gráfico)
export const fetchKlines = async (
  symbol: string,
  interval: string,
  limit: number = 100
): Promise<Candle[]> => {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    
    const startTime = Date.now();
    
    // Adicionar timeout de 10 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      
      controller.abort();
    }, 10000);
    
    let response: Response;
    try {
      
      response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;
      
    } catch (error) {
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;
     
      if (error instanceof Error && error.name === 'AbortError') {
       
        throw new Error('Timeout na requisição');
      }
      throw error;
    }
    
   
    
    
    const data: any[][] = await response.json();
    

   

    return data.map(k => ({
      time: k[0],
      open:  parseFloat(k[1]),
      high:  parseFloat(k[2]),
      low:   parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]), // índice 5 é o volume na API da Binance
    }));
  } catch (error) {
    console.error('Erro ao buscar klines da Binance:', error);
    return [];
  }
};

// Função para buscar order book
export const fetchOrderBook = async (
  symbol: string,
  limit: number = 20,
  signal?: AbortSignal
): Promise<OrderBook> => {
  try {
    const url = `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`;
    const resp = await fetch(url, { signal });
    if (!resp.ok) {
      return { lastUpdateId: 0, bids: [], asks: [] };
    }
    return (await resp.json()) as OrderBook;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { lastUpdateId: 0, bids: [], asks: [] };
    }
    console.error('Erro ao buscar order book da Binance:', err);
    return { lastUpdateId: 0, bids: [], asks: [] };
  }
};

// Função para buscar trades recentes
export const fetchRecentTrades = async (symbol: string, limit: number = 50, signal?: AbortSignal): Promise<Trade[]> => {
  try {
    const url = `https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=${limit}`;
    const response = await fetch(url, { signal });
    if (!response.ok) {
      return [];
    }
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return [];
    }
    console.error('Erro ao buscar trades da Binance:', error);
    return [];
  }
};

// Função para buscar ticker 24h
export const fetchTicker24hr = async (symbol: string, signal?: AbortSignal): Promise<Ticker24hr | null> => {
  try {
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
    const response = await fetch(url, { signal });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return null;
    }
    console.error('Erro ao buscar ticker da Binance:', error);
    return null;
  }
};

// Função para buscar todos os símbolos USDT
export const fetchUSDTSymbols = async (): Promise<string[]> => {
  try {
    const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');
    const data = await response.json();
    
    return data.symbols
      .filter((symbol: any) => symbol.symbol.endsWith('USDT') && symbol.status === 'TRADING')
      .map((symbol: any) => symbol.symbol);
  } catch (error) {
    console.error('Erro ao buscar símbolos USDT da Binance:', error);
    return [];
  }
};

// Função para buscar dados históricos por período
export const fetchHistoricalKlines = async (
  symbol: string,
  interval: string,
  startTime: number, // timestamp em ms
  endTime: number     // timestamp em ms
): Promise<Candle[]> => {
  try {
    const allCandles: Candle[] = [];
    let currentStartTime = startTime;
    const maxLimit = 1000; // Binance permite até 1000 candles por requisição
    
    while (currentStartTime < endTime) {
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${currentStartTime}&endTime=${endTime}&limit=${maxLimit}`
      );
      
      if (!response.ok) {
        throw new Error(`Erro na API da Binance: ${response.status}`);
      }
      
      const data: any[][] = await response.json();
      
      if (data.length === 0) break;
      
      const candles = data.map(k => ({
        time: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]), // índice 5 é o volume na API da Binance
      }));
      
      allCandles.push(...candles);
      
      // Se recebemos menos que o limite, chegamos ao fim
      if (data.length < maxLimit) break;
      
      // Próximo startTime é o closeTime do último candle + 1ms
      currentStartTime = data[data.length - 1][6] + 1;
      
      // Pequeno delay para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return allCandles;
  } catch (error) {
    console.error('Erro ao buscar dados históricos da Binance:', error);
    return [];
  }
}; 