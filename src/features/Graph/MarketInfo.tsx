// src/components/MarketInfo.tsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Chip, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { ListAlt as ListAltIcon } from '@mui/icons-material';
import { fetchTicker24hr, type Ticker24hr } from '../../services/binanceAPI';
import { fetchUSDTSymbols } from '../../services/binanceAPI';

interface MarketInfoProps {
  symbol: string;
  onSymbolChange?: (symbol: string) => void;
  onAllOrdersClick?: () => void;
}

const MarketInfo: React.FC<MarketInfoProps> = ({ symbol, onSymbolChange, onAllOrdersClick }) => {
  const [ticker, setTicker] = useState<Ticker24hr | null>(null);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loadingSymbols, setLoadingSymbols] = useState(true);

  // Carregar símbolos
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const data = await fetchUSDTSymbols();
        setSymbols(data);
        setLoadingSymbols(false);
      } catch (error) {
        console.error('Erro ao buscar símbolos:', error);
        setLoadingSymbols(false);
      }
    };
    fetchSymbols();
  }, []);

  // Carregar dados do ticker
  useEffect(() => {
    const abortController = new AbortController();
    let intervalId: NodeJS.Timeout | null = null;
    
    const fetchData = async () => {
      if (abortController.signal.aborted) return;
      try {
        const data = await fetchTicker24hr(symbol, abortController.signal);
        if (!abortController.signal.aborted && data) {
          setTicker(data);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('[MarketInfo] Erro ao carregar:', error);
        }
      }
    };

    // Aguardar um pouco antes de fazer a primeira requisição
    const initialTimeout = setTimeout(() => {
      if (!abortController.signal.aborted) {
        fetchData();
        intervalId = setInterval(fetchData, 5000);
      }
    }, 200);
    
    return () => {
      abortController.abort();
      clearTimeout(initialTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [symbol]);

  const priceChangePercent = ticker ? parseFloat(ticker.priceChangePercent) : 0;
  const isPositive = priceChangePercent >= 0;

  return (
    <Box sx={{ py: 0.5, width: '100%' }}>
      <Paper sx={{ p: 0.5, px: 1.5 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          flexWrap: 'nowrap',
          justifyContent: 'flex-start',
          width: '100%'
        }}>
          {/* SymbolSelector */}
          <Box sx={{ minWidth: 200, flexShrink: 0 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="symbol-select-label">Símbolo</InputLabel>
              <Select
                labelId="symbol-select-label"
                value={symbol}
                label="Símbolo"
                onChange={(e) => {
                  const newSymbol = e.target.value;
                  onSymbolChange?.(newSymbol);
                }}
                disabled={loadingSymbols}
              >
                {symbols.slice(0, 50).map((sym) => (
                  <MenuItem key={sym} value={sym}>
                    {sym}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Preço atual e variação */}
          {ticker ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="h6" sx={{ color: isPositive ? 'success.main' : 'error.main', fontWeight: 'bold', lineHeight: 1.2 }}>
                  ${parseFloat(ticker.lastPrice).toFixed(2)}
                </Typography>
                <Chip 
                  label={`${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%`}
                  color={isPositive ? 'success' : 'error'}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>

              {/* 24h Alta */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>24h Alta:</Typography>
                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'medium', fontSize: '0.85rem', lineHeight: 1.2 }}>
                  ${parseFloat(ticker.highPrice).toFixed(2)}
                </Typography>
              </Box>

              {/* 24h Baixa */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>24h Baixa:</Typography>
                <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'medium', fontSize: '0.85rem', lineHeight: 1.2 }}>
                  ${parseFloat(ticker.lowPrice).toFixed(2)}
                </Typography>
              </Box>

              {/* Volume 24h */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Volume 24h:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.85rem', lineHeight: 1.2 }}>
                  {parseFloat(ticker.volume).toLocaleString()}
                </Typography>
              </Box>

              {/* Volume USDT */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Volume USDT:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.85rem', lineHeight: 1.2 }}>
                  ${parseFloat(ticker.quoteVolume).toLocaleString()}
                </Typography>
              </Box>
            </>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Carregando...</Typography>
          )}

          {/* Spacer para empurrar o botão para a direita */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Botão Todas as Ordens */}
          {onAllOrdersClick && (
            <Box sx={{ flexShrink: 0 }}>
              <Button 
                variant="contained" 
                size="small"
                startIcon={<ListAltIcon />}
                onClick={onAllOrdersClick}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                  boxShadow: 2,
                }}
              >
                Todas as Ordens
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default MarketInfo; 