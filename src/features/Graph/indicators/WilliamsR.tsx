import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Slider,
  InputAdornment
} from '@mui/material';
import { TrendingDown, TrendingUp } from '@mui/icons-material';

export interface WilliamsRConfig {
  period: number;
  overbought: number;
  oversold: number;
}

interface WilliamsRProps {
  config: WilliamsRConfig;
  onConfigChange: (config: WilliamsRConfig) => void;
}

const WilliamsR: React.FC<WilliamsRProps> = ({ config, onConfigChange }) => {
  const handleChange = (field: keyof WilliamsRConfig, value: number) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title="Williams %R"
        avatar={<TrendingDown color="secondary" />}
        subheader="Oscilador de momentum similar ao Stochastic"
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Período"
              type="number"
              value={config.period}
              onChange={(e) => handleChange('period', Number(e.target.value))}
              inputProps={{ min: 5, max: 50, step: 1 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">períodos</InputAdornment>
              }}
              helperText="Número de períodos para cálculo"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Sobrecompra"
              type="number"
              value={config.overbought}
              onChange={(e) => handleChange('overbought', Number(e.target.value))}
              inputProps={{ min: -50, max: 0, step: 5 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
              helperText="Nível de sobrecompra (padrão: -20)"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Sobrevenda"
              type="number"
              value={config.oversold}
              onChange={(e) => handleChange('oversold', Number(e.target.value))}
              inputProps={{ min: -100, max: -50, step: 5 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
              helperText="Nível de sobrevenda (padrão: -80)"
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
              max={50}
              step={1}
              marks={[
                { value: 5, label: '5' },
                { value: 14, label: '14' },
                { value: 21, label: '21' },
                { value: 50, label: '50' }
              ]}
              valueLabelDisplay="auto"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Níveis de Sobrecompra/Sobrevenda
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Box flex={1}>
                <Typography variant="caption" color="error">
                  Sobrevenda: {config.oversold}%
                </Typography>
                <Slider
                  value={config.oversold}
                  onChange={(_, value) => handleChange('oversold', value as number)}
                  min={-100}
                  max={-50}
                  step={5}
                  marks={[
                    { value: -100, label: '-100%' },
                    { value: -80, label: '-80%' },
                    { value: -50, label: '-50%' }
                  ]}
                  valueLabelDisplay="auto"
                />
              </Box>
              <Box flex={1}>
                <Typography variant="caption" color="warning.main">
                  Sobrecompra: {config.overbought}%
                </Typography>
                <Slider
                  value={config.overbought}
                  onChange={(_, value) => handleChange('overbought', value as number)}
                  min={-50}
                  max={0}
                  step={5}
                  marks={[
                    { value: -50, label: '-50%' },
                    { value: -20, label: '-20%' },
                    { value: 0, label: '0%' }
                  ]}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            <strong>Como funciona:</strong> O Williams %R é um oscilador que mede a posição do preço de fechamento 
            em relação ao range de preços (máximo-mínimo) de um período específico. Valores próximos a 0% indicam 
            sobrecompra, enquanto valores próximos a -100% indicam sobrevenda.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WilliamsR;
