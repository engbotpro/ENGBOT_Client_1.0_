import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Alert,
  LinearProgress,
  Slider,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  AutoFixHigh,
  Psychology,
  TrendingUp,
  Speed,
  Settings,
  ExpandMore,
  CheckCircle,
  Warning,
  Info,
  Timeline,
  Assessment,
  Rocket
} from '@mui/icons-material';

interface BacktestResult {
  id: string;
  botConfig: any;
  startDate: string;
  endDate: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  currentStreak: number;
  status: 'running' | 'completed' | 'failed';
  createdAt: string;
}

interface OptimizationPanelProps {
  open: boolean;
  onClose: () => void;
  onRun: (config: any) => void;
  selectedResult: BacktestResult | null;
}

interface OptimizationConfig {
  targetMetric: string;
  optimizationMethod: string;
  maxIterations: number;
  populationSize: number;
  mutationRate: number;
  crossoverRate: number;
  parameters: {
    rsiPeriod: { min: number; max: number; current: number };
    macdFast: { min: number; max: number; current: number };
    macdSlow: { min: number; max: number; current: number };
    macdSignal: { min: number; max: number; current: number };
    stopLoss: { min: number; max: number; current: number };
    takeProfit: { min: number; max: number; current: number };
    positionSize: { min: number; max: number; current: number };
  };
  constraints: {
    maxDrawdown: number;
    minWinRate: number;
    minSharpeRatio: number;
    maxConsecutiveLosses: number;
  };
  advancedSettings: {
    useMachineLearning: boolean;
    useNeuralNetwork: boolean;
    useEnsembleMethods: boolean;
    crossValidation: boolean;
    overfittingProtection: boolean;
  };
}

const OptimizationPanel: React.FC<OptimizationPanelProps> = ({
  open,
  onClose,
  onRun,
  selectedResult
}) => {
  const [config, setConfig] = useState<OptimizationConfig>({
    targetMetric: 'netProfit',
    optimizationMethod: 'genetic',
    maxIterations: 100,
    populationSize: 50,
    mutationRate: 0.1,
    crossoverRate: 0.8,
    parameters: {
      rsiPeriod: { min: 10, max: 30, current: 14 },
      macdFast: { min: 8, max: 16, current: 12 },
      macdSlow: { min: 20, max: 30, current: 26 },
      macdSignal: { min: 7, max: 12, current: 9 },
      stopLoss: { min: 1, max: 10, current: 5 },
      takeProfit: { min: 5, max: 20, current: 10 },
      positionSize: { min: 1, max: 10, current: 5 }
    },
    constraints: {
      maxDrawdown: 20,
      minWinRate: 50,
      minSharpeRatio: 1.0,
      maxConsecutiveLosses: 5
    },
    advancedSettings: {
      useMachineLearning: true,
      useNeuralNetwork: false,
      useEnsembleMethods: true,
      crossValidation: true,
      overfittingProtection: true
    }
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const targetMetrics = [
    { value: 'netProfit', label: 'Lucro Líquido', description: 'Maximizar o lucro total' },
    { value: 'sharpeRatio', label: 'Sharpe Ratio', description: 'Melhorar risco/retorno' },
    { value: 'winRate', label: 'Taxa de Acerto', description: 'Aumentar trades vencedores' },
    { value: 'profitFactor', label: 'Profit Factor', description: 'Melhorar lucro vs perda' },
    { value: 'maxDrawdown', label: 'Máximo Drawdown', description: 'Reduzir perdas máximas' },
    { value: 'custom', label: 'Métrica Customizada', description: 'Combinação personalizada' }
  ];

  const optimizationMethods = [
    { value: 'genetic', label: 'Algoritmo Genético', description: 'Evolução natural dos parâmetros' },
    { value: 'particleSwarm', label: 'Particle Swarm', description: 'Otimização por enxame' },
    { value: 'bayesian', label: 'Otimização Bayesiana', description: 'Aprendizado probabilístico' },
    { value: 'gridSearch', label: 'Busca em Grade', description: 'Teste sistemático de valores' },
    { value: 'randomSearch', label: 'Busca Aleatória', description: 'Exploração aleatória' }
  ];

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (config.maxIterations < 10 || config.maxIterations > 1000) {
      newErrors.maxIterations = 'Iterações devem estar entre 10 e 1000';
    }

    if (config.populationSize < 10 || config.populationSize > 200) {
      newErrors.populationSize = 'Tamanho da população deve estar entre 10 e 200';
    }

    if (config.mutationRate < 0 || config.mutationRate > 1) {
      newErrors.mutationRate = 'Taxa de mutação deve estar entre 0 e 1';
    }

    if (config.crossoverRate < 0 || config.crossoverRate > 1) {
      newErrors.crossoverRate = 'Taxa de crossover deve estar entre 0 e 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRun = async () => {
    if (!validateConfig()) return;

    setLoading(true);
    try {
      const optimizationConfig = {
        ...config,
        baseResult: selectedResult,
        estimatedTime: calculateEstimatedTime()
      };
      
      await onRun(optimizationConfig);
      handleClose();
    } catch (error) {
      console.error('Erro ao executar otimização:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfig({
      targetMetric: 'netProfit',
      optimizationMethod: 'genetic',
      maxIterations: 100,
      populationSize: 50,
      mutationRate: 0.1,
      crossoverRate: 0.8,
      parameters: {
        rsiPeriod: { min: 10, max: 30, current: 14 },
        macdFast: { min: 8, max: 16, current: 12 },
        macdSlow: { min: 20, max: 30, current: 26 },
        macdSignal: { min: 7, max: 12, current: 9 },
        stopLoss: { min: 1, max: 10, current: 5 },
        takeProfit: { min: 5, max: 20, current: 10 },
        positionSize: { min: 1, max: 10, current: 5 }
      },
      constraints: {
        maxDrawdown: 20,
        minWinRate: 50,
        minSharpeRatio: 1.0,
        maxConsecutiveLosses: 5
      },
      advancedSettings: {
        useMachineLearning: true,
        useNeuralNetwork: false,
        useEnsembleMethods: true,
        crossValidation: true,
        overfittingProtection: true
      }
    });
    setErrors({});
    onClose();
  };

  const calculateEstimatedTime = () => {
    const baseTime = config.maxIterations * config.populationSize * 0.1; // segundos
    const methodMultiplier = {
      genetic: 1,
      particleSwarm: 1.2,
      bayesian: 1.5,
      gridSearch: 0.8,
      randomSearch: 0.6
    };
    
    return Math.round(baseTime * methodMultiplier[config.optimizationMethod as keyof typeof methodMultiplier]);
  };

  const getMethodDescription = (method: string) => {
    return optimizationMethods.find(m => m.value === method)?.description || '';
  };

  const getMetricDescription = (metric: string) => {
    return targetMetrics.find(m => m.value === metric)?.description || '';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Psychology color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Otimização com Inteligência Artificial
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Informações do Backteste Base */}
          {selectedResult && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Backteste Base para Otimização
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Estratégia
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {selectedResult.botConfig.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Performance Atual
                      </Typography>
                      <Box display="flex" gap={1}>
                        <Chip 
                          label={`Lucro: $${selectedResult.netProfit.toFixed(2)}`}
                          color={selectedResult.netProfit > 0 ? 'success' : 'error'}
                          size="small"
                        />
                        <Chip 
                          label={`Taxa: ${selectedResult.winRate.toFixed(1)}%`}
                          color="primary"
                          size="small"
                        />
                        <Chip 
                          label={`Sharpe: ${selectedResult.sharpeRatio.toFixed(2)}`}
                          color="secondary"
                          size="small"
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Configuração Básica */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Configuração da Otimização
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Métrica Alvo</InputLabel>
              <Select
                value={config.targetMetric}
                onChange={(e) => setConfig(prev => ({ ...prev, targetMetric: e.target.value }))}
              >
                {targetMetrics.map((metric) => (
                  <MenuItem key={metric.value} value={metric.value}>
                    <Box>
                      <Typography variant="body1">{metric.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {metric.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Método de Otimização</InputLabel>
              <Select
                value={config.optimizationMethod}
                onChange={(e) => setConfig(prev => ({ ...prev, optimizationMethod: e.target.value }))}
              >
                {optimizationMethods.map((method) => (
                  <MenuItem key={method.value} value={method.value}>
                    <Box>
                      <Typography variant="body1">{method.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {method.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Parâmetros do Algoritmo */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Parâmetros do Algoritmo
            </Typography>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Máximo de Iterações"
              type="number"
              value={config.maxIterations}
              onChange={(e) => setConfig(prev => ({ ...prev, maxIterations: Number(e.target.value) }))}
              error={!!errors.maxIterations}
              helperText={errors.maxIterations}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Tamanho da População"
              type="number"
              value={config.populationSize}
              onChange={(e) => setConfig(prev => ({ ...prev, populationSize: Number(e.target.value) }))}
              error={!!errors.populationSize}
              helperText={errors.populationSize}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Taxa de Mutação"
              type="number"
              value={config.mutationRate}
              onChange={(e) => setConfig(prev => ({ ...prev, mutationRate: Number(e.target.value) }))}
              error={!!errors.mutationRate}
              helperText={errors.mutationRate}
              inputProps={{ step: 0.1, min: 0, max: 1 }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Taxa de Crossover"
              type="number"
              value={config.crossoverRate}
              onChange={(e) => setConfig(prev => ({ ...prev, crossoverRate: Number(e.target.value) }))}
              error={!!errors.crossoverRate}
              helperText={errors.crossoverRate}
              inputProps={{ step: 0.1, min: 0, max: 1 }}
            />
          </Grid>

          {/* Parâmetros a Otimizar */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Parâmetros a Otimizar
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">Indicadores Técnicos</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" gutterBottom>
                      Período RSI: {config.parameters.rsiPeriod.current}
                    </Typography>
                    <Slider
                      value={config.parameters.rsiPeriod.current}
                      onChange={(e, value) => setConfig(prev => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          rsiPeriod: { ...prev.parameters.rsiPeriod, current: value as number }
                        }
                      }))}
                      min={config.parameters.rsiPeriod.min}
                      max={config.parameters.rsiPeriod.max}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" gutterBottom>
                      MACD Fast: {config.parameters.macdFast.current}
                    </Typography>
                    <Slider
                      value={config.parameters.macdFast.current}
                      onChange={(e, value) => setConfig(prev => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          macdFast: { ...prev.parameters.macdFast, current: value as number }
                        }
                      }))}
                      min={config.parameters.macdFast.min}
                      max={config.parameters.macdFast.max}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">Gerenciamento de Risco</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" gutterBottom>
                      Stop Loss (%): {config.parameters.stopLoss.current}
                    </Typography>
                    <Slider
                      value={config.parameters.stopLoss.current}
                      onChange={(e, value) => setConfig(prev => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          stopLoss: { ...prev.parameters.stopLoss, current: value as number }
                        }
                      }))}
                      min={config.parameters.stopLoss.min}
                      max={config.parameters.stopLoss.max}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" gutterBottom>
                      Take Profit (%): {config.parameters.takeProfit.current}
                    </Typography>
                    <Slider
                      value={config.parameters.takeProfit.current}
                      onChange={(e, value) => setConfig(prev => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          takeProfit: { ...prev.parameters.takeProfit, current: value as number }
                        }
                      }))}
                      min={config.parameters.takeProfit.min}
                      max={config.parameters.takeProfit.max}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" gutterBottom>
                      Tamanho da Posição (%): {config.parameters.positionSize.current}
                    </Typography>
                    <Slider
                      value={config.parameters.positionSize.current}
                      onChange={(e, value) => setConfig(prev => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          positionSize: { ...prev.parameters.positionSize, current: value as number }
                        }
                      }))}
                      min={config.parameters.positionSize.min}
                      max={config.parameters.positionSize.max}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Restrições */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Restrições de Performance
            </Typography>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Máximo Drawdown (%)"
              type="number"
              value={config.constraints.maxDrawdown}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                constraints: { ...prev.constraints, maxDrawdown: Number(e.target.value) }
              }))}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Taxa de Acerto Mínima (%)"
              type="number"
              value={config.constraints.minWinRate}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                constraints: { ...prev.constraints, minWinRate: Number(e.target.value) }
              }))}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Sharpe Ratio Mínimo"
              type="number"
              value={config.constraints.minSharpeRatio}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                constraints: { ...prev.constraints, minSharpeRatio: Number(e.target.value) }
              }))}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Máximo Perdas Consecutivas"
              type="number"
              value={config.constraints.maxConsecutiveLosses}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                constraints: { ...prev.constraints, maxConsecutiveLosses: Number(e.target.value) }
              }))}
            />
          </Grid>

          {/* Configurações Avançadas */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Configurações Avançadas de IA
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.advancedSettings.useMachineLearning}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        advancedSettings: { ...prev.advancedSettings, useMachineLearning: e.target.checked }
                      }))}
                    />
                  }
                  label="Usar Machine Learning"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.advancedSettings.useNeuralNetwork}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        advancedSettings: { ...prev.advancedSettings, useNeuralNetwork: e.target.checked }
                      }))}
                    />
                  }
                  label="Redes Neurais"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.advancedSettings.useEnsembleMethods}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        advancedSettings: { ...prev.advancedSettings, useEnsembleMethods: e.target.checked }
                      }))}
                    />
                  }
                  label="Métodos Ensemble"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.advancedSettings.crossValidation}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        advancedSettings: { ...prev.advancedSettings, crossValidation: e.target.checked }
                      }))}
                    />
                  }
                  label="Validação Cruzada"
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Estimativa de Tempo */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Speed color="info" />
                  <Typography variant="body1">
                    Tempo estimado: <strong>{calculateEstimatedTime()} segundos</strong>
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Método: {optimizationMethods.find(m => m.value === config.optimizationMethod)?.label} - 
                  {getMethodDescription(config.optimizationMethod)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Alertas */}
          <Grid item xs={12}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Dica:</strong> A otimização com IA pode levar alguns minutos. 
                Quanto mais parâmetros e maior a população, mais tempo será necessário, 
                mas melhores serão os resultados.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleRun} 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <LinearProgress /> : <Rocket />}
        >
          {loading ? 'Otimizando...' : 'Iniciar Otimização IA'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OptimizationPanel; 