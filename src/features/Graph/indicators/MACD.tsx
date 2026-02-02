import React from 'react';
import { Box, TextField, Typography } from '@mui/material';

export interface MACDConfig {
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
  macdColor: string;
  signalColor: string;
  histogramColor: string;
}

interface MACDProps {
  config: MACDConfig;
  onConfigChange: (config: MACDConfig) => void;
}

const MACD: React.FC<MACDProps> = ({ config, onConfigChange }) => {
  const handleFastPeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fastPeriod = parseInt(event.target.value);
    onConfigChange({ ...config, fastPeriod });
  };

  const handleSlowPeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const slowPeriod = parseInt(event.target.value);
    onConfigChange({ ...config, slowPeriod });
  };

  const handleSignalPeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const signalPeriod = parseInt(event.target.value);
    onConfigChange({ ...config, signalPeriod });
  };

  const handleMACDColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const macdColor = event.target.value;
    onConfigChange({ ...config, macdColor });
  };

  const handleSignalColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const signalColor = event.target.value;
    onConfigChange({ ...config, signalColor });
  };

  const handleHistogramColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const histogramColor = event.target.value;
    onConfigChange({ ...config, histogramColor });
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, mb: 2, backgroundColor: '#2c2c2c' }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
        MACD
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Período Rápido"
          type="number"
          value={config.fastPeriod}
          onChange={handleFastPeriodChange}
          size="small"
          sx={{ 
            minWidth: 120,
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
          inputProps={{ min: 1, max: 50 }}
        />
        <TextField
          label="Período Lento"
          type="number"
          value={config.slowPeriod}
          onChange={handleSlowPeriodChange}
          size="small"
          sx={{ 
            minWidth: 120,
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
          label="Período Sinal"
          type="number"
          value={config.signalPeriod}
          onChange={handleSignalPeriodChange}
          size="small"
          sx={{ 
            minWidth: 120,
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
          inputProps={{ min: 1, max: 50 }}
        />
        <TextField
          label="Cor MACD"
          type="color"
          value={config.macdColor}
          onChange={handleMACDColorChange}
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
          label="Cor Sinal"
          type="color"
          value={config.signalColor}
          onChange={handleSignalColorChange}
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
          label="Cor Histograma"
          type="color"
          value={config.histogramColor}
          onChange={handleHistogramColorChange}
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

export default MACD; 