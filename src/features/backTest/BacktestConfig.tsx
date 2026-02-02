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
  LinearProgress
} from '@mui/material';
// Temporarily removed date picker imports to fix React import issues
import { Bot } from '../../types/bot';

interface BacktestConfigProps {
  open: boolean;
  onClose: () => void;
  onRun: (config: any) => void;
  bots?: Bot[];
}

interface BacktestConfigData {
  name: string;
  botId: string;
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
  initialCapital: number;
  commission: number;
  slippage: number;
  includeFees: boolean;
  includeSlippage: boolean;
}

const BacktestConfig: React.FC<BacktestConfigProps> = ({
  open,
  onClose,
  onRun,
  bots = []
}) => {
  // Garantir que bots seja sempre um array válido
  const validBots = Array.isArray(bots) ? bots.filter((bot) => 
    bot && 
    bot.id && 
    bot.config && 
    typeof bot.config === 'object' &&
    bot.config.name && 
    bot.config.symbol
  ) : [];

  const [config, setConfig] = useState<BacktestConfigData>({
    name: '',
    botId: '',
    startDate: null,
    endDate: null,
    startTime: '00:00',
    endTime: '23:59',
    initialCapital: 10000,
    commission: 0.1,
    slippage: 0.05,
    includeFees: true,
    includeSlippage: true
  });

  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (config.botId && validBots.length > 0) {
      const bot = validBots.find(b => b && b.id === config.botId);
      setSelectedBot(bot || null);
      if (bot && bot.config && bot.config.name && !config.name) {
        setConfig(prev => ({ ...prev, name: `${bot.config.name} - Backteste` }));
      }
    }
  }, [config.botId, validBots]);

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!config.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!config.botId) {
      newErrors.botId = 'Selecione um robô';
    }

    if (!config.startDate) {
      newErrors.startDate = 'Data inicial é obrigatória';
    }

    if (!config.endDate) {
      newErrors.endDate = 'Data final é obrigatória';
    }

    if (config.startDate && config.endDate && config.startDate >= config.endDate) {
      newErrors.endDate = 'Data final deve ser posterior à data inicial';
    }

    if (config.initialCapital <= 0) {
      newErrors.initialCapital = 'Capital inicial deve ser maior que zero';
    }

    if (config.commission < 0) {
      newErrors.commission = 'Comissão não pode ser negativa';
    }

    if (config.slippage < 0) {
      newErrors.slippage = 'Slippage não pode ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRun = async () => {
    if (!validateConfig()) return;

    setLoading(true);
    try {
      // Combinar data e horário para criar timestamps completos
      let startDateTime: Date | null = null;
      let endDateTime: Date | null = null;
      
      if (config.startDate && config.startTime) {
        const [hours, minutes] = config.startTime.split(':').map(Number);
        startDateTime = new Date(config.startDate);
        startDateTime.setHours(hours, minutes, 0, 0);
      }
      
      if (config.endDate && config.endTime) {
        const [hours, minutes] = config.endTime.split(':').map(Number);
        endDateTime = new Date(config.endDate);
        endDateTime.setHours(hours, minutes, 0, 0);
      }
      
      const backtestConfig = {
        ...config,
        startDate: startDateTime?.toISOString().split('T')[0] || config.startDate?.toISOString().split('T')[0],
        endDate: endDateTime?.toISOString().split('T')[0] || config.endDate?.toISOString().split('T')[0],
        startTime: config.startTime,
        endTime: config.endTime,
        timeframe: selectedBot?.config?.timeframe || '1h', // Usar timeframe do bot
        botConfig: selectedBot?.config
      };
      
      await onRun(backtestConfig);
      handleClose();
    } catch (error) {
      console.error('Erro ao executar backteste:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfig({
      name: '',
      botId: '',
      startDate: null,
      endDate: null,
      startTime: '00:00',
      endTime: '23:59',
      initialCapital: 10000,
      commission: 0.1,
      slippage: 0.05,
      includeFees: true,
      includeSlippage: true
    });
    setSelectedBot(null);
    setErrors({});
    onClose();
  };


  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight="bold">
          Configurar Backteste
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
            {/* Configuração Básica */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Configuração Básica
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome do Backteste"
                value={config.name}
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.botId}>
                <InputLabel id="bot-select-label" shrink={true}>Selecionar Robô</InputLabel>
                <Select
                  labelId="bot-select-label"
                  label="Selecionar Robô"
                  value={config.botId}
                  onChange={(e) => setConfig(prev => ({ ...prev, botId: e.target.value }))}
                  notched
                >
                  {validBots.length > 0 ? (
                    validBots.map((bot) => {
                      if (!bot || !bot.id || !bot.config) {
                        return null;
                      }
                      const botName = (bot.config && typeof bot.config === 'object' && bot.config.name) 
                        ? String(bot.config.name) 
                        : 'Bot sem nome';
                      const botSymbol = (bot.config && typeof bot.config === 'object' && bot.config.symbol) 
                        ? String(bot.config.symbol) 
                        : 'N/A';
                      return (
                        <MenuItem key={bot.id} value={bot.id}>
                          {botName} ({botSymbol})
                        </MenuItem>
                      );
                    }).filter(Boolean)
                  ) : (
                    <MenuItem disabled>Nenhum robô disponível</MenuItem>
                  )}
                </Select>
                {errors.botId && (
                  <Typography variant="caption" color="error">
                    {errors.botId}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data Inicial (YYYY-MM-DD)"
                type="date"
                value={config.startDate ? config.startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setConfig(prev => ({ ...prev, startDate: e.target.value ? new Date(e.target.value) : null }))}
                error={!!errors.startDate}
                helperText={errors.startDate}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data Final (YYYY-MM-DD)"
                type="date"
                value={config.endDate ? config.endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setConfig(prev => ({ ...prev, endDate: e.target.value ? new Date(e.target.value) : null }))}
                error={!!errors.endDate}
                helperText={errors.endDate}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Horário de Início"
                type="time"
                value={config.startTime}
                onChange={(e) => setConfig(prev => ({ ...prev, startTime: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Horário de Fim"
                type="time"
                value={config.endTime}
                onChange={(e) => setConfig(prev => ({ ...prev, endTime: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Configuração de Capital */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Configuração de Capital
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Capital Inicial ($)"
                type="number"
                value={config.initialCapital}
                onChange={(e) => setConfig(prev => ({ ...prev, initialCapital: Number(e.target.value) }))}
                error={!!errors.initialCapital}
                helperText={errors.initialCapital}
                InputProps={{
                  startAdornment: '$'
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Comissão (%)"
                type="number"
                value={config.commission}
                onChange={(e) => setConfig(prev => ({ ...prev, commission: Number(e.target.value) }))}
                error={!!errors.commission}
                helperText={errors.commission}
                InputProps={{
                  endAdornment: '%'
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Slippage (%)"
                type="number"
                value={config.slippage}
                onChange={(e) => setConfig(prev => ({ ...prev, slippage: Number(e.target.value) }))}
                error={!!errors.slippage}
                helperText={errors.slippage}
                InputProps={{
                  endAdornment: '%'
                }}
              />
            </Grid>

            {/* Informações do Robô Selecionado */}
            {selectedBot && selectedBot.config && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Configuração do Robô
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">
                          Nome
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {selectedBot.config.name || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">
                          Símbolo
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {selectedBot.config.symbol || 'N/A'}
                        </Typography>
                      </Grid>
                      {selectedBot.config.indicators && selectedBot.config.indicators.length > 0 && (
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Indicador Principal
                          </Typography>
                          <Typography variant="body1">
                            {selectedBot.config.indicators.find((ind: any) => ind.type === 'primary')?.name || 'N/A'}
                          </Typography>
                        </Grid>
                      )}
                      {selectedBot.config.entryMethod && (
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Método de Entrada
                          </Typography>
                          <Typography variant="body1">
                            {selectedBot.config.entryMethod.type} - {selectedBot.config.entryMethod.condition}
                          </Typography>
                        </Grid>
                      )}
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">
                          Timeframe
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {selectedBot.config.timeframe || '1h'}
                        </Typography>
                      </Grid>
                      {selectedBot.config.riskManagement && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Gerenciamento de Risco
                          </Typography>
                          <Box display="flex" gap={1} mt={1}>
                            <Chip 
                              label={`Max Drawdown: ${selectedBot.config.riskManagement.maxDrawdown}%`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip 
                              label={`Max Posições: ${selectedBot.config.riskManagement.maxOpenPositions}`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip 
                              label={`Max Perda Diária: $${selectedBot.config.riskManagement.maxDailyLoss}`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Alertas */}
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Dica:</strong> Para resultados mais precisos, use períodos de pelo menos 30 dias 
                  e considere incluir taxas e slippage nas simulações.
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
          disabled={loading || !config.botId}
          startIcon={loading ? <LinearProgress /> : null}
        >
          {loading ? 'Executando...' : 'Executar Backteste'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BacktestConfig; 