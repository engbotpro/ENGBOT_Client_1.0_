import React from 'react';
import { Box, TextField, Typography } from '@mui/material';

export interface RSIConfig {
  period: number;
  overbought: number;
  oversold: number;
  color: string;
  overboughtColor: string;
  oversoldColor: string;
}

interface RSIProps {
  config: RSIConfig;
  onConfigChange: (config: RSIConfig) => void;
}

const RSI: React.FC<RSIProps> = ({ config, onConfigChange }) => {
  const handlePeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const period = parseInt(event.target.value);
    onConfigChange({ ...config, period });
  };

  const handleOverboughtChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const overbought = parseInt(event.target.value);
    onConfigChange({ ...config, overbought });
  };

  const handleOversoldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const oversold = parseInt(event.target.value);
    onConfigChange({ ...config, oversold });
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    onConfigChange({ ...config, color });
  };

  const handleOverboughtColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const overboughtColor = event.target.value;
    onConfigChange({ ...config, overboughtColor });
  };

  const handleOversoldColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const oversoldColor = event.target.value;
    onConfigChange({ ...config, oversoldColor });
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, mb: 2, backgroundColor: '#2c2c2c' }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
        RSI (Índice de Força Relativa)
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Período"
          type="number"
          value={config.period}
          onChange={handlePeriodChange}
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
          inputProps={{ min: 1, max: 100 }}
        />
        <TextField
          label="Sobrecompra"
          type="number"
          value={config.overbought}
          onChange={handleOverboughtChange}
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
          inputProps={{ min: 50, max: 100 }}
        />
        <TextField
          label="Sobrevenda"
          type="number"
          value={config.oversold}
          onChange={handleOversoldChange}
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
          inputProps={{ min: 0, max: 50 }}
        />
        <TextField
          label="Cor RSI"
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
          label="Cor Sobrecompra"
          type="color"
          value={config.overboughtColor}
          onChange={handleOverboughtColorChange}
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
          label="Cor Sobrevenda"
          type="color"
          value={config.oversoldColor}
          onChange={handleOversoldColorChange}
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
      </Box>
    </Box>
  );
};

export default RSI; 