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

export interface ATRConfig {
  period: number;
}

interface ATRProps {
  config: ATRConfig;
  onConfigChange: (config: ATRConfig) => void;
}

const ATR: React.FC<ATRProps> = ({ config, onConfigChange }) => {
  const handleChange = (field: keyof ATRConfig, value: number) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title="ATR (Average True Range)"
        avatar={<Timeline color="warning" />}
        subheader="Mede volatilidade do mercado"
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
              inputProps={{ min: 5, max: 50, step: 1 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">períodos</InputAdornment>
              }}
              helperText="Número de períodos para calcular a média da volatilidade"
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
                { value: 10, label: '10' },
                { value: 14, label: '14' },
                { value: 21, label: '21' },
                { value: 50, label: '50' }
              ]}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>
        
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            <strong>Como funciona:</strong> O ATR mede a volatilidade do mercado calculando a média do 
            "True Range" (faixa verdadeira) ao longo de um período específico. O True Range considera 
            o maior valor entre: diferença atual high-low, diferença entre high atual e close anterior, 
            ou diferença entre low atual e close anterior.
          </Typography>
        </Box>
        
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Aplicações do ATR:
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'info.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Stop Loss Dinâmico:</strong> Ajusta stops baseado na volatilidade
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'success.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Take Profit:</strong> Define alvos baseados na volatilidade
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'warning.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Filtro de Entrada:</strong> Evita entradas em baixa volatilidade
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'error.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Gestão de Risco:</strong> Ajusta tamanho da posição
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ATR;
