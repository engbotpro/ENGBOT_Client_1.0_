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
import { Timeline, TrendingUp, TrendingDown } from '@mui/icons-material';

export interface CCIConfig {
  period: number;
  overbought: number;
  oversold: number;
}

interface CCIProps {
  config: CCIConfig;
  onConfigChange: (config: CCIConfig) => void;
}

const CCI: React.FC<CCIProps> = ({ config, onConfigChange }) => {
  const handleChange = (field: keyof CCIConfig, value: number) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title="CCI (Commodity Channel Index)"
        avatar={<Timeline color="info" />}
        subheader="Identifica ciclos e reversões de preço"
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
              inputProps={{ min: 50, max: 200, step: 10 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">pontos</InputAdornment>
              }}
              helperText="Nível de sobrecompra (padrão: 100)"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Sobrevenda"
              type="number"
              value={config.oversold}
              onChange={(e) => handleChange('oversold', Number(e.target.value))}
              inputProps={{ min: -200, max: -50, step: 10 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">pontos</InputAdornment>
              }}
              helperText="Nível de sobrevenda (padrão: -100)"
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
                { value: 20, label: '20' },
                { value: 50, label: '50' }
              ]}
              valueLabelDisplay="auto"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Níveis de Sobrecompra/Sobrevenda
            </Typography>
            <Box display="flex" alignItems="center" gap={4}>
              <Box flex={1} pr={2}>
                <Typography variant="caption" color="error">
                  Sobrevenda: {config.oversold} pontos
                </Typography>
                <Slider
                  value={config.oversold}
                  onChange={(_, value) => handleChange('oversold', value as number)}
                  min={-200}
                  max={-50}
                  step={10}
                  marks={[
                    { value: -200, label: '-200' },
                    { value: -100, label: '-100' },
                    { value: -50, label: '-50' }
                  ]}
                  valueLabelDisplay="auto"
                />
              </Box>
              <Box flex={1} pl={2}>
                <Typography variant="caption" color="warning.main">
                  Sobrecompra: {config.overbought} pontos
                </Typography>
                <Slider
                  value={config.overbought}
                  onChange={(_, value) => handleChange('overbought', value as number)}
                  min={50}
                  max={200}
                  step={10}
                  marks={[
                    { value: 50, label: '50' },
                    { value: 100, label: '100' },
                    { value: 200, label: '200' }
                  ]}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            <strong>Como funciona:</strong> O CCI mede a variação do preço em relação à sua média móvel, 
            normalizada pelo desvio médio. Valores acima de +100 indicam sobrecompra, enquanto valores 
            abaixo de -100 indicam sobrevenda. O CCI é útil para identificar ciclos e possíveis reversões.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CCI;
