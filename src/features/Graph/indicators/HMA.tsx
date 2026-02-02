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
import { TrendingUp, TrendingDown, Speed } from '@mui/icons-material';

export interface HMAConfig {
  period: number;
}

interface HMAProps {
  config: HMAConfig;
  onConfigChange: (config: HMAConfig) => void;
}

const HMA: React.FC<HMAProps> = ({ config, onConfigChange }) => {
  const handleChange = (field: keyof HMAConfig, value: number) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title="HMA (Hull Moving Average)"
        avatar={<Speed color="success" />}
        subheader="Média Móvel de Hull - Reduz lag e melhora responsividade"
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
              helperText="Número de períodos para calcular a média de Hull"
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
            <strong>Como funciona:</strong> A HMA é uma média móvel avançada que combina múltiplas médias 
            móveis ponderadas para reduzir significativamente o lag (atraso) das médias móveis tradicionais. 
            Ela usa uma fórmula complexa que envolve WMA de diferentes períodos para criar uma linha mais 
            suave e responsiva às mudanças de preço.
          </Typography>
        </Box>
        
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Vantagens da HMA:
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'success.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Baixo Lag:</strong> Reduz significativamente o atraso
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'info.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Alta Responsividade:</strong> Reage rapidamente a mudanças
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'warning.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Suavização:</strong> Linha mais suave que outras médias
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'error.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Complexidade:</strong> Cálculo mais complexo
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
                <strong>Identificação de Tendências:</strong> Mudanças de direção mais rápidas
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption">
                <strong>Suporte/Resistência:</strong> Níveis dinâmicos mais precisos
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption">
                <strong>Cruzamentos:</strong> Sinais mais oportunos
              </Typography>
            </Grid>
          </Grid>
        </Box>
        
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Comparação com Outras Médias:
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} md={4}>
              <Typography variant="caption">
                <strong>vs SMA:</strong> Muito mais responsiva
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption">
                <strong>vs EMA:</strong> Menos lag, mais suave
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption">
                <strong>vs WMA:</strong> Melhor suavização
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default HMA;
