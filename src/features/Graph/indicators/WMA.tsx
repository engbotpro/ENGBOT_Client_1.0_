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
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export interface WMAConfig {
  period: number;
}

interface WMAProps {
  config: WMAConfig;
  onConfigChange: (config: WMAConfig) => void;
}

const WMA: React.FC<WMAProps> = ({ config, onConfigChange }) => {
  const handleChange = (field: keyof WMAConfig, value: number) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title="WMA (Weighted Moving Average)"
        avatar={<TrendingUp color="primary" />}
        subheader="Média Móvel Ponderada - Dá mais peso aos preços recentes"
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
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
              helperText="Número de períodos para calcular a média ponderada"
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
                { value: 10, label: '10' },
                { value: 20, label: '20' },
                { value: 50, label: '50' },
                { value: 100, label: '100' }
              ]}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>
        
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            <strong>Como funciona:</strong> A WMA é uma média móvel que atribui pesos diferentes aos preços, 
            dando mais importância aos preços mais recentes. Por exemplo, em uma WMA de 5 períodos, o preço 
            mais recente tem peso 5, o segundo mais recente peso 4, e assim por diante. Isso torna a WMA 
            mais responsiva às mudanças recentes de preço comparada à SMA.
          </Typography>
        </Box>
        
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Vantagens da WMA:
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'success.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Responsividade:</strong> Reage mais rapidamente a mudanças
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'info.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Menos Lag:</strong> Reduz o atraso da média móvel
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'warning.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Filtro de Ruído:</strong> Suaviza flutuações menores
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'error.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Mais Sensível:</strong> Pode gerar mais sinais falsos
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Aplicações:
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} md={4}>
              <Typography variant="caption">
                <strong>Identificação de Tendências:</strong> Suaviza preços para mostrar direção
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption">
                <strong>Suporte/Resistência:</strong> Níveis dinâmicos de preço
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption">
                <strong>Cruzamentos:</strong> Sinais de entrada e saída
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WMA;
