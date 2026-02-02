// src/components/Ticker.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

interface TickerProps {
  onSymbolSelect?: (symbol: string) => void;
}

interface TickerData {
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
}

const Ticker: React.FC<TickerProps> = ({ onSymbolSelect }) => {
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [loading, setLoading] = useState(true);

  // Lista de símbolos populares para mostrar
  const popularSymbols = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT',
    'XRPUSDT', 'DOTUSDT', 'LINKUSDT', 'LTCUSDT', 'AVAXUSDT',
    'DOGEUSDT', 'MATICUSDT', 'SHIBUSDT', 'UNIUSDT', 'ATOMUSDT'
  ];

  useEffect(() => {
    const fetchTickers = async () => {
      try {
        // Buscar dados de ticker 24h para todos os símbolos
        const promises = popularSymbols.map(async (symbol) => {
          try {
            const response = await fetch(
              `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
            );
            if (!response.ok) return null;
            
            const data = await response.json();
            return {
              symbol: data.symbol,
              price: parseFloat(data.lastPrice),
              priceChange: parseFloat(data.priceChange),
              priceChangePercent: parseFloat(data.priceChangePercent),
              volume: parseFloat(data.volume),
            };
          } catch (error) {
            console.error(`Erro ao buscar ticker para ${symbol}:`, error);
            return null;
          }
        });

        const results = await Promise.all(promises);
        const validTickers = results.filter((t): t is TickerData => t !== null);
        
        // Ordenar por volume (mais negociados primeiro)
        validTickers.sort((a, b) => b.volume - a.volume);
        
        // Atualizar apenas se houver dados válidos
        if (validTickers.length > 0) {
          setTickers(validTickers);
          setLoading(false); // Marcar como carregado apenas quando dados estiverem disponíveis
        }
      } catch (error) {
        console.error('Erro ao buscar tickers:', error);
        // Não alterar dados ou loading em caso de erro para manter dados antigos visíveis
      }
    };

    fetchTickers();
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(fetchTickers, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const formatSymbol = (symbol: string) => {
    return symbol.replace('USDT', '/USDT');
  };

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return price.toFixed(2);
    } else if (price >= 0.01) {
      return price.toFixed(4);
    } else {
      return price.toFixed(8);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxHeight: '100%',
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          p: 2,
          maxHeight: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ flexShrink: 0 }}>
          Últimos Preços
        </Typography>

        <TableContainer sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <Table size="small" stickyHeader sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ py: 0.5, fontSize: '0.75rem', width: '40%' }}>Moeda</TableCell>
                <TableCell align="right" sx={{ py: 0.5, fontSize: '0.75rem', width: '30%', fontFamily: 'monospace' }}>Preço</TableCell>
                <TableCell align="right" sx={{ py: 0.5, fontSize: '0.75rem', width: '30%', fontFamily: 'monospace' }}>24h</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 0.5, fontSize: '0.75rem' }}>
                    {loading ? 'Carregando...' : 'Nenhum dado disponível'}
                  </TableCell>
                </TableRow>
              ) : (
                tickers.map((ticker) => (
                  <TableRow
                    key={ticker.symbol}
                    hover
                    onClick={() => onSymbolSelect?.(ticker.symbol)}
                    sx={{
                      cursor: onSymbolSelect ? 'pointer' : 'default',
                      '&:hover': onSymbolSelect ? {
                        backgroundColor: 'action.hover',
                      } : {},
                    }}
                  >
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem', fontWeight: 'medium', width: '40%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {formatSymbol(ticker.symbol)}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 0.5, fontSize: '0.75rem', width: '30%', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {formatPrice(ticker.price)}
                    </TableCell>
                    <TableCell 
                      align="right" 
                      sx={{ 
                        py: 0.5, 
                        fontSize: '0.75rem',
                        width: '30%',
                        fontFamily: 'monospace',
                        whiteSpace: 'nowrap',
                        color: ticker.priceChangePercent >= 0
                          ? 'success.main'
                          : 'error.main',
                        fontWeight: 'medium',
                      }}
                    >
                      {ticker.priceChangePercent >= 0 ? '+' : ''}
                      {ticker.priceChangePercent.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Paper>
  );
};

export default Ticker;

