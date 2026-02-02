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
import { TrendingUp, TrendingDown, BarChart } from '@mui/icons-material';

export interface OBVConfig {
  period: number;
}

interface OBVProps {
  config: OBVConfig;
  onConfigChange: (config: OBVConfig) => void;
}

const OBV: React.FC<OBVProps> = ({ config, onConfigChange }) => {
  const handleChange = (field: keyof OBVConfig, value: number) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title="OBV (On-Balance Volume)"
        avatar={<BarChart color="info" />}
        subheader="Confirma movimentos de preço com volume"
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
              helperText="Número de períodos para suavizar o OBV"
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
                { value: 20, label: '20' },
                { value: 50, label: '50' }
              ]}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>
        
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            <strong>Como funciona:</strong> O OBV é um indicador de volume que adiciona o volume quando o 
            preço sobe e subtrai quando o preço desce. Isso cria uma linha acumulativa que confirma 
            movimentos de preço. Quando o OBV e o preço se movem na mesma direção, confirma a tendência. 
            Quando divergem, pode indicar uma possível reversão.
          </Typography>
        </Box>
        
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Sinais de Trading:
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'success.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Confirmação de Alta:</strong> Preço e OBV sobem juntos
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'error.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Confirmação de Baixa:</strong> Preço e OBV descem juntos
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'warning.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Divergência de Alta:</strong> Preço sobe, OBV desce
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'info.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Divergência de Baixa:</strong> Preço desce, OBV sobe
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
                <strong>Confirmação:</strong> Valida movimentos de preço
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption">
                <strong>Divergências:</strong> Identifica reversões
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption">
                <strong>Breakouts:</strong> Confirma rompimentos
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default OBV;
