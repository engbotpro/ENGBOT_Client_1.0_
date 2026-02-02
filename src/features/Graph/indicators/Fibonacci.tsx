import React, { useState } from 'react';
import { Box, TextField, Typography, Button, Alert } from '@mui/material';

export interface FibonacciConfig {
  startIndex?: number; // Índice do candle inicial
  endIndex?: number; // Índice do candle final
  startPrice?: number; // Preço inicial
  endPrice?: number; // Preço final
  color: string;
  lineWidth: number;
  showLabels: boolean;
  levels: number[]; // Níveis de Fibonacci a mostrar (0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0)
}

interface FibonacciProps {
  config: FibonacciConfig;
  onConfigChange: (config: FibonacciConfig) => void;
  onSelectPoints?: (mode: 'selecting' | null) => void; // Callback para ativar modo de seleção
}

const Fibonacci: React.FC<FibonacciProps> = ({ config, onConfigChange, onSelectPoints }) => {
  const [isSelecting, setIsSelecting] = useState(false);

  const defaultLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...config, color: event.target.value });
  };

  const handleLineWidthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const lineWidth = parseInt(event.target.value);
    onConfigChange({ ...config, lineWidth });
  };

  const handleShowLabelsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...config, showLabels: event.target.checked });
  };

  const handleSelectPoints = () => {
    setIsSelecting(true);
    onSelectPoints?.('selecting');
  };

  const handleCancelSelection = () => {
    setIsSelecting(false);
    onSelectPoints?.(null);
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, mb: 2, backgroundColor: '#2c2c2c' }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
        Fibonacci Retracement
      </Typography>
      
      {!config.startPrice || !config.endPrice ? (
        <Alert severity="info" sx={{ mb: 2, backgroundColor: '#3c3c3c', color: '#fff' }}>
          Clique duas vezes no gráfico para definir o ponto inicial e final do Fibonacci.
        </Alert>
      ) : (
        <Box sx={{ mb: 2, p: 1, backgroundColor: '#3c3c3c', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
            Ponto Inicial: ${config.startPrice?.toFixed(2)}
          </Typography>
          <Typography variant="body2" sx={{ color: '#fff' }}>
            Ponto Final: ${config.endPrice?.toFixed(2)}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Button
          variant={isSelecting ? 'contained' : 'outlined'}
          color={isSelecting ? 'error' : 'primary'}
          onClick={isSelecting ? handleCancelSelection : handleSelectPoints}
          size="small"
        >
          {isSelecting ? 'Cancelar Seleção' : 'Reiniciar Seleção'}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Cor das Linhas"
          type="color"
          value={config.color}
          onChange={handleColorChange}
          size="small"
          sx={{ 
            minWidth: 100,
            '& .MuiInputBase-root': {
              backgroundColor: '#3c3c3c',
              color: '#fff',
            },
            '& .MuiInputLabel-root': {
              color: '#ccc',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#4caf50',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#555',
              },
              '&:hover fieldset': {
                borderColor: '#777',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4caf50',
              },
            },
          }}
        />
        <TextField
          label="Espessura"
          type="number"
          value={config.lineWidth}
          onChange={handleLineWidthChange}
          size="small"
          inputProps={{ min: 1, max: 5 }}
          sx={{ 
            minWidth: 100,
            '& .MuiInputBase-root': {
              backgroundColor: '#3c3c3c',
              color: '#fff',
            },
            '& .MuiInputLabel-root': {
              color: '#ccc',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#4caf50',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#555',
              },
              '&:hover fieldset': {
                borderColor: '#777',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4caf50',
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default Fibonacci;
