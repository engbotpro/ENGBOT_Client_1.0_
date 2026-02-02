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
import { TrendingUp, TrendingDown, ChangeCircle } from '@mui/icons-material';

export interface ParabolicSARConfig {
  acceleration: number;
  maximum: number;
}

interface ParabolicSARProps {
  config: ParabolicSARConfig;
  onConfigChange: (config: ParabolicSARConfig) => void;
}

const ParabolicSAR: React.FC<ParabolicSARProps> = ({ config, onConfigChange }) => {
  const handleChange = (field: keyof ParabolicSARConfig, value: number) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title="Parabolic SAR"
        avatar={<ChangeCircle color="secondary" />}
        subheader="Stop and Reverse Parabólico - Identifica reversões de tendência"
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Aceleração"
              type="number"
              value={config.acceleration}
              onChange={(e) => handleChange('acceleration', Number(e.target.value))}
              inputProps={{ min: 0.01, max: 0.5, step: 0.01 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">pontos</InputAdornment>
              }}
              helperText="Taxa de aceleração (padrão: 0.02)"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Máximo"
              type="number"
              value={config.maximum}
              onChange={(e) => handleChange('maximum', Number(e.target.value))}
              inputProps={{ min: 0.1, max: 1.0, step: 0.1 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">pontos</InputAdornment>
              }}
              helperText="Valor máximo da aceleração (padrão: 0.2)"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Aceleração: {config.acceleration} pontos
            </Typography>
            <Slider
              value={config.acceleration}
              onChange={(_, value) => handleChange('acceleration', value as number)}
              min={0.01}
              max={0.5}
              step={0.01}
              marks={[
                { value: 0.01, label: '0.01' },
                { value: 0.02, label: '0.02' },
                { value: 0.05, label: '0.05' },
                { value: 0.1, label: '0.1' },
                { value: 0.5, label: '0.5' }
              ]}
              valueLabelDisplay="auto"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Máximo: {config.maximum} pontos
            </Typography>
            <Slider
              value={config.maximum}
              onChange={(_, value) => handleChange('maximum', value as number)}
              min={0.1}
              max={1.0}
              step={0.1}
              marks={[
                { value: 0.1, label: '0.1' },
                { value: 0.2, label: '0.2' },
                { value: 0.5, label: '0.5' },
                { value: 1.0, label: '1.0' }
              ]}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>
        
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            <strong>Como funciona:</strong> O Parabolic SAR é um indicador de tendência que coloca pontos 
            acima ou abaixo do preço, dependendo da direção da tendência. Quando o preço cruza o SAR, 
            indica uma possível reversão de tendência. A aceleração determina quão rapidamente o SAR 
            se move em direção ao preço.
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
                  <strong>Compra:</strong> Preço cruza acima do SAR
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'error.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Venda:</strong> Preço cruza abaixo do SAR
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Configurações Recomendadas:
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} md={4}>
              <Typography variant="caption">
                <strong>Conservador:</strong> Acc: 0.02, Max: 0.2
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption">
                <strong>Moderado:</strong> Acc: 0.05, Max: 0.3
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption">
                <strong>Agressivo:</strong> Acc: 0.1, Max: 0.5
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ParabolicSAR;
