// src/components/OrderBook.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { fetchOrderBook, OrderBook } from '../../services/binanceAPI';

interface OrderBookProps {
  symbol: string;
}

const OrderBookComponent: React.FC<OrderBookProps> = ({ symbol }) => {
  const [orderBook, setOrderBook] = useState<OrderBook>({
    lastUpdateId: 0,
    bids: [],
    asks: [],
  });

  useEffect(() => {
    const abortController = new AbortController();
    let intervalId: NodeJS.Timeout | null = null;
    
    const load = async () => {
      if (abortController.signal.aborted) return;
      try {
        const data = await fetchOrderBook(symbol, 20, abortController.signal);
        if (!abortController.signal.aborted) {
          setOrderBook(data);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('[OrderBook] Erro ao carregar:', error);
        }
      }
    };
    
    // Aguardar um pouco antes de fazer a primeira requisição para evitar sobrecarga
    const initialTimeout = setTimeout(() => {
      if (!abortController.signal.aborted) {
        load();
        intervalId = setInterval(load, 2000); // Aumentar intervalo para 2 segundos
      }
    }, 100);
    
    return () => {
      abortController.abort();
      clearTimeout(initialTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [symbol]);

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
        maxHeight: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ flexShrink: 0 }}>
        Order Book – {symbol}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minHeight: 0 }}>
        {/** VENDAS */}
        <TableContainer component={Paper} sx={{ flex: 1, minHeight: 0 }}>
          <Typography sx={{ px: 2, pt: 1, pb: 0.5 }} color="error.main" variant="caption" fontWeight="bold">
            Preço (Venda)
          </Typography>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'error.main', py: 0.5, fontSize: '0.75rem' }}>Preço</TableCell>
                <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>Quantidade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orderBook.asks.slice(0, 12).map(([price, qty], i) => (
                <TableRow key={i}>
                  <TableCell sx={{ color: 'error.main', py: 0.5, fontSize: '0.75rem' }}>
                    {parseFloat(price).toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>{parseFloat(qty).toFixed(4)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/** COMPRAS */}
        <TableContainer component={Paper} sx={{ flex: 1, minHeight: 0 }}>
          <Typography sx={{ px: 2, pt: 1, pb: 0.5 }} color="success.main" variant="caption" fontWeight="bold">
            Preço (Compra)
          </Typography>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'success.main', py: 0.5, fontSize: '0.75rem' }}>Preço</TableCell>
                <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>Quantidade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orderBook.bids.slice(0, 12).map(([price, qty], i) => (
                <TableRow key={i}>
                  <TableCell sx={{ color: 'success.main', py: 0.5, fontSize: '0.75rem' }}>
                    {parseFloat(price).toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>{parseFloat(qty).toFixed(4)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
    </Paper>
  );
};

export default OrderBookComponent;
