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

export interface ADXConfig {
  period: number;
  threshold: number;
}

interface ADXProps {
  config: ADXConfig;
  onConfigChange: (config: ADXConfig) => void;
}

const ADX: React.FC<ADXProps> = ({ config, onConfigChange }) => {
  const handleChange = (field: keyof ADXConfig, value: number) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title="ADX (Average Directional Index)"
        avatar={<Speed color="success" />}
        subheader="Mede força da tendência"
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
              inputProps={{ min: 5, max: 50, step: 1 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">períodos</InputAdornment>
              }}
              helperText="Número de períodos para cálculo"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Limite de Tendência"
              type="number"
              value={config.threshold}
              onChange={(e) => handleChange('threshold', Number(e.target.value))}
              inputProps={{ min: 15, max: 50, step: 5 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">pontos</InputAdornment>
              }}
              helperText="Limite para considerar tendência forte (padrão: 25)"
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
              Limite de Tendência: {config.threshold} pontos
            </Typography>
            <Slider
              value={config.threshold}
              onChange={(_, value) => handleChange('threshold', value as number)}
              min={15}
              max={50}
              step={5}
              marks={[
                { value: 15, label: '15' },
                { value: 20, label: '20' },
                { value: 25, label: '25' },
                { value: 30, label: '30' },
                { value: 50, label: '50' }
              ]}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>
        
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            <strong>Como funciona:</strong> O ADX mede a força da tendência, independentemente da direção. 
            Valores acima de {config.threshold} indicam tendência forte, enquanto valores abaixo indicam 
            mercado lateral. O ADX é usado em conjunto com +DI e -DI para identificar a direção da tendência.
          </Typography>
        </Box>
        
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Interpretação dos Valores:
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'error.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>0-20:</strong> Tendência fraca
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'warning.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>20-25:</strong> Tendência em desenvolvimento
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 12, backgroundColor: 'success.main', borderRadius: '50%' }} />
                <Typography variant="caption">
                  <strong>25+:</strong> Tendência forte
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ADX;
