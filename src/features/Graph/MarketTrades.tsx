import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

interface Trade { price: string; amount: string; time: string; }

const trades: Trade[] = [
  { price: '113,301.23', amount: '0.00018', time: '14:26:28' },
  { price: '113,301.22', amount: '0.00088', time: '14:26:28' },
  // … e assim por diante
];

const MarketTrades: React.FC = () => (
  <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, overflowY: 'auto', maxHeight: 300 }}>
    <Typography variant="subtitle2" sx={{ p: 1 }}>Trades de Mercado</Typography>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Preço (USDT)</TableCell>
          <TableCell>Quantidade (BTC)</TableCell>
          <TableCell>Hora</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {trades.map((t, i) => (
          <TableRow key={i}>
            <TableCell sx={{ color: i % 2 === 0 ? 'success.main' : 'error.main' }}>{t.price}</TableCell>
            <TableCell>{t.amount}</TableCell>
            <TableCell>{t.time}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Box>
);

export default MarketTrades;
