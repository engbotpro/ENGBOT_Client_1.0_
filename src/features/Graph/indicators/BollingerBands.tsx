import React from 'react';
import { Box, TextField, Typography } from '@mui/material';

export interface BollingerBandsConfig {
  period: number;
  standardDeviation: number;
  upperColor: string;
  lowerColor: string;
  middleColor: string;
}

interface BollingerBandsProps {
  config: BollingerBandsConfig;
  onConfigChange: (config: BollingerBandsConfig) => void;
}

const BollingerBands: React.FC<BollingerBandsProps> = ({ config, onConfigChange }) => {
  const handlePeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const period = parseInt(event.target.value);
    onConfigChange({ ...config, period });
  };

  const handleStandardDeviationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const standardDeviation = parseFloat(event.target.value);
    onConfigChange({ ...config, standardDeviation });
  };

  const handleUpperColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const upperColor = event.target.value;
    onConfigChange({ ...config, upperColor });
  };

  const handleLowerColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const lowerColor = event.target.value;
    onConfigChange({ ...config, lowerColor });
  };

  const handleMiddleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const middleColor = event.target.value;
    onConfigChange({ ...config, middleColor });
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, mb: 2, backgroundColor: '#2c2c2c' }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
        Bandas de Bollinger
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
          inputProps={{ min: 1, max: 200 }}
        />
        <TextField
          label="Desvio Padrão"
          type="number"
          value={config.standardDeviation}
          onChange={handleStandardDeviationChange}
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
          inputProps={{ min: 0.1, max: 5, step: 0.1 }}
        />
        <TextField
          label="Cor Superior"
          type="color"
          value={config.upperColor}
          onChange={handleUpperColorChange}
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
          label="Cor Inferior"
          type="color"
          value={config.lowerColor}
          onChange={handleLowerColorChange}
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
          label="Cor Média"
          type="color"
          value={config.middleColor}
          onChange={handleMiddleColorChange}
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

export default BollingerBands; 