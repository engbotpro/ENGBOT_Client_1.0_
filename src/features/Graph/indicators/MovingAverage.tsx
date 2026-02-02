import React, { useState } from 'react';
import { Box, TextField, Select, MenuItem, FormControl, InputLabel, Typography } from '@mui/material';

export interface MovingAverageConfig {
  period: number;
  type: 'simple' | 'exponential';
  color: string;
}

interface MovingAverageProps {
  config: MovingAverageConfig;
  onConfigChange: (config: MovingAverageConfig) => void;
}

const MovingAverage: React.FC<MovingAverageProps> = ({ config, onConfigChange }) => {
  console.log('MovingAverage render - config:', config);
  
  const handlePeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== handlePeriodChange chamado ===');
    console.log('Event target value:', event.target.value);
    console.log('Config atual:', config);
    
    const period = parseInt(event.target.value) || 1;
    console.log('Period parsed:', period);
    
    const newConfig = { ...config, period };
    console.log('New config:', newConfig);
    
    console.log('Chamando onConfigChange...');
    onConfigChange(newConfig);
    console.log('onConfigChange chamado');
  };

  const handlePeriodChangeDirect = (value: string) => {
    console.log('=== handlePeriodChangeDirect chamado ===');
    console.log('Value:', value);
    
    const period = parseInt(value) || 1;
    console.log('Period parsed:', period);
    
    const newConfig = { ...config, period };
    console.log('New config:', newConfig);
    
    console.log('Chamando onConfigChange...');
    onConfigChange(newConfig);
    console.log('onConfigChange chamado');
  };

  const handleTypeChange = (event: any) => {
    const type = event.target.value as 'simple' | 'exponential';
    console.log('Type changed from', config.type, 'to', type);
    const newConfig = { ...config, type };
    console.log('New config:', newConfig);
    onConfigChange(newConfig);
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    console.log('Color changed from', config.color, 'to', color);
    const newConfig = { ...config, color };
    console.log('New config:', newConfig);
    onConfigChange(newConfig);
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, mb: 2, backgroundColor: '#2c2c2c' }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
        Média Móvel
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Período"
          type="number"
          value={config.period}
          onChange={(e) => {
            console.log('TextField onChange chamado');
            console.log('Novo valor:', e.target.value);
            handlePeriodChangeDirect(e.target.value);
          }}
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
          inputProps={{ 
            min: 1, 
            max: 200
          }}
        />
        <FormControl size="small" sx={{ 
          minWidth: 150,
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
        }}>
          <InputLabel>Tipo</InputLabel>
          <Select
            value={config.type}
            onChange={handleTypeChange}
            label="Tipo"
          >
            <MenuItem value="simple">Simples</MenuItem>
            <MenuItem value="exponential">Exponencial</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Cor"
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
      </Box>
    </Box>
  );
};

export default MovingAverage; 