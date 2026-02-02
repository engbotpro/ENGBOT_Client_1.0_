// src/components/Trades.tsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { fetchRecentTrades, type Trade } from '../../services/binanceAPI';

interface TradesProps {
  symbol: string;
}

const Trades: React.FC<TradesProps> = ({ symbol }) => {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    const abortController = new AbortController();
    let intervalId: NodeJS.Timeout | null = null;
    
    const fetchData = async () => {
      if (abortController.signal.aborted) return;
      try {
        const data = await fetchRecentTrades(symbol, 50, abortController.signal);
        if (!abortController.signal.aborted) {
          setTrades(data);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('[Trades] Erro ao carregar:', error);
        }
      }
    };

    // Aguardar um pouco antes de fazer a primeira requisição
    const initialTimeout = setTimeout(() => {
      if (!abortController.signal.aborted) {
        fetchData();
        intervalId = setInterval(fetchData, 3000); // Aumentar intervalo para 3 segundos
      }
    }, 300);
    
    return () => {
      abortController.abort();
      clearTimeout(initialTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [symbol]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Paper
      elevation={3}
      sx={{ 
        flex: 1, 
        display:'flex', 
        flexDirection:'column', 
        overflow:'hidden',
        maxHeight: '100%',
        borderRadius: 2,
      }}
    >
    <Box
      sx={{
        p: 2,
        maxHeight: 500,        // altura máxima reduzida de 400 para 300
        overflowY: 'auto',     // scroll vertical quando extrapolar
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ flexShrink: 0 }}>
        Trades Recentes – {symbol}
      </Typography>
      
      <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>Preço</TableCell>
              <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>Quantidade</TableCell>
              <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>Total</TableCell>
              <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>Hora</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trades.slice(0, 20).map((trade) => (
              <TableRow key={trade.id}>
                <TableCell 
                  sx={{ 
                    color: trade.isBuyerMaker ? 'error.main' : 'success.main',
                    fontWeight: 'bold',
                    py: 0.5,
                    fontSize: '0.75rem'
                  }}
                >
                  {parseFloat(trade.price).toFixed(2)}
                </TableCell>
                <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                  {parseFloat(trade.qty).toFixed(4)}
                </TableCell>
                <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                  {parseFloat(trade.quoteQty).toFixed(2)}
                </TableCell>
                <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                  {formatTime(trade.time)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
    </Paper>
  );
};

export default Trades; 