import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Slider,
  InputAdornment
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export interface HILOConfig {
  period: number;
  multiplier: number;
}

interface HILOProps {
  config: HILOConfig;
  onConfigChange: (config: HILOConfig) => void;
}

const HILO: React.FC<HILOProps> = ({ config, onConfigChange }) => {
  const handleChange = (field: keyof HILOConfig, value: number) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title="HILO (High-Low)"
        avatar={<TrendingUp color="primary" />}
        subheader="Identifica níveis de suporte e resistência dinâmicos"
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Período"
              type="number"
              value={config.period}
              onChange={(e) => handleChange('period', Number(e.target.value))}
              inputProps={{ min: 5, max: 100, step: 1 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">períodos</InputAdornment>
              }}
              helperText="Número de períodos para calcular os níveis"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Multiplicador"
              type="number"
              value={config.multiplier}
              onChange={(e) => handleChange('multiplier', Number(e.target.value))}
              inputProps={{ min: 0.1, max: 5, step: 0.1 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">x</InputAdornment>
              }}
              helperText="Multiplicador para ajustar a sensibilidade"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Período: {config.period} períodos
            </Typography>
            <Slider
              value={config.period}
              onChange={(_, value) => handleChange('period', value as number)}
              min={5}
              max={100}
              step={1}
              marks={[
                { value: 5, label: '5' },
                { value: 20, label: '20' },
                { value: 50, label: '50' },
                { value: 100, label: '100' }
              ]}
              valueLabelDisplay="auto"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Multiplicador: {config.multiplier}x
            </Typography>
            <Slider
              value={config.multiplier}
              onChange={(_, value) => handleChange('multiplier', value as number)}
              min={0.1}
              max={5}
              step={0.1}
              marks={[
                { value: 0.1, label: '0.1x' },
                { value: 1, label: '1x' },
                { value: 2, label: '2x' },
                { value: 5, label: '5x' }
              ]}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>
        
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            <strong>Como funciona:</strong> O HILO calcula níveis de suporte e resistência baseados nos 
            máximos e mínimos de um período específico, multiplicados por um fator para ajustar a sensibilidade.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default HILO;
