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

export interface VolumeConfig {
  period: number;
}

interface VolumeProps {
  config: VolumeConfig;
  onConfigChange: (config: VolumeConfig) => void;
}

const Volume: React.FC<VolumeProps> = ({ config, onConfigChange }) => {
  const handleChange = (field: keyof VolumeConfig, value: number) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title="Volume"
        avatar={<BarChart color="primary" />}
        subheader="Confirma força dos movimentos de preço"
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
              helperText="Número de períodos para calcular a média do volume"
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
            <strong>Como funciona:</strong> O indicador de Volume analisa a quantidade de negociações 
            em um período específico. Volume alto confirma movimentos de preço, enquanto volume baixo 
            pode indicar falta de convicção. Picos de volume frequentemente precedem reversões importantes.
          </Typography>
        </Box>
        
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Sinais de Volume:
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'success.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Volume Alto + Alta:</strong> Confirma tendência de alta
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'error.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Volume Alto + Baixa:</strong> Confirma tendência de baixa
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'warning.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Volume Baixo:</strong> Falta de convicção
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'info.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>Pico de Volume:</strong> Possível reversão
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
        
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Estratégias com Volume:
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} md={6}>
              <Typography variant="caption">
                <strong>Volume Climax:</strong> Picos extremos indicam exaustão
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption">
                <strong>Volume Seco:</strong> Baixo volume em movimentos de preço
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption">
                <strong>Volume Crescente:</strong> Confirma força da tendência
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption">
                <strong>Volume Decrescente:</strong> Indica enfraquecimento
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Volume;
