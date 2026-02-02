import React from 'react';
import { Box, TextField, Typography } from '@mui/material';

export interface StochasticOscillatorConfig {
  kPeriod: number;
  dPeriod: number;
  slowing: number;
  overbought: number;
  oversold: number;
  kColor: string;
  dColor: string;
  overboughtColor: string;
  oversoldColor: string;
}

interface StochasticOscillatorProps {
  config: StochasticOscillatorConfig;
  onConfigChange: (config: StochasticOscillatorConfig) => void;
}

const StochasticOscillator: React.FC<StochasticOscillatorProps> = ({ config, onConfigChange }) => {
  const handleKPeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const kPeriod = parseInt(event.target.value);
    onConfigChange({ ...config, kPeriod });
  };

  const handleDPeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dPeriod = parseInt(event.target.value);
    onConfigChange({ ...config, dPeriod });
  };

  const handleSlowingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const slowing = parseInt(event.target.value);
    onConfigChange({ ...config, slowing });
  };

  const handleOverboughtChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const overbought = parseInt(event.target.value);
    onConfigChange({ ...config, overbought });
  };

  const handleOversoldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const oversold = parseInt(event.target.value);
    onConfigChange({ ...config, oversold });
  };

  const handleKColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const kColor = event.target.value;
    onConfigChange({ ...config, kColor });
  };

  const handleDColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dColor = event.target.value;
    onConfigChange({ ...config, dColor });
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
        Oscilador Estocástico
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Período %K"
          type="number"
          value={config.kPeriod}
          onChange={handleKPeriodChange}
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
          label="Período %D"
          type="number"
          value={config.dPeriod}
          onChange={handleDPeriodChange}
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
          label="Suavização"
          type="number"
          value={config.slowing}
          onChange={handleSlowingChange}
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
          inputProps={{ min: 1, max: 10 }}
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
          label="Cor %K"
          type="color"
          value={config.kColor}
          onChange={handleKColorChange}
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
          label="Cor %D"
          type="color"
          value={config.dColor}
          onChange={handleDColorChange}
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

export default StochasticOscillator; 