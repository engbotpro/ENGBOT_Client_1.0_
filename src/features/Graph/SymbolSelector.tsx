// src/components/SymbolSelector.tsx
import React, { useEffect, useState } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Typography, Paper } from '@mui/material';
import { fetchUSDTSymbols } from '../../services/binanceAPI';

interface SymbolSelectorProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
}

const SymbolSelector: React.FC<SymbolSelectorProps> = ({ selectedSymbol, onSymbolChange }) => {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const data = await fetchUSDTSymbols();
        setSymbols(data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar símbolos:', error);
        setLoading(false);
      }
    };

    fetchSymbols();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="body2">Carregando...</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 1, height: '100%' }}>
      <Box sx={{ p: 1,  }}>
        <FormControl fullWidth size="small">
          <InputLabel id="symbol-select-label">Símbolo</InputLabel>
          <Select
            labelId="symbol-select-label"
            value={selectedSymbol}
            label="Símbolo"
            onChange={(e) => {
              const newSymbol = e.target.value;
              console.log('[SymbolSelector] Símbolo alterado:', { from: selectedSymbol, to: newSymbol });
              onSymbolChange(newSymbol);
              console.log('[SymbolSelector] onSymbolChange chamado');
            }}
          >
            {symbols.slice(0, 50).map((symbol) => (
              <MenuItem key={symbol} value={symbol}>
                {symbol}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
};

export default SymbolSelector; 