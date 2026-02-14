import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

import {
  Box,
  Stack,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  Card,
  Typography,
  Grid,
  Paper,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  Savings as SavingsIcon,
  MonetizationOn as MonetizationOnIcon,
  History as HistoryIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

import type { CompoundParams } from '../../types/calculate';

import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from 'recharts';
import NumericFormatCustom, { PercentageFormatCustom } from '../../components/NumericFormatCustom';

const STORAGE_KEY = 'financialIndependence_simulations';

interface SavedFISimulation {
  id: string;
  name: string;
  initial: number;
  rate: number;
  ratePeriod: 'ANUAL' | 'MENSAL';
  term: number;
  termUnit: 'ANOS' | 'MESES';
  taxPercent: number;
  contribution: number;
  contribPeriod: 'ANUAL' | 'MENSAL';
  series: Array<{ period: number; value: number }>;
  finalValue: number;
  taxValue: number;
  netValue: number;
  safeWithdraw: number;
  createdAt: string;
}

const FinancialIndependence: React.FC = () => {
  const userId = useSelector((s: RootState) => s.auth.user?.id ?? '');

  const [initial, setInitial] = useState('0');
  const [rate, setRate] = useState('0');
  const [ratePeriod, setRatePeriod] = useState<'ANUAL' | 'MENSAL'>('ANUAL');
  const [term, setTerm] = useState('0');
  const [termUnit, setTermUnit] = useState<'ANOS' | 'MESES'>('ANOS');
  const [taxPercent, setTaxPercent] = useState('0');
  const [contribution, setContribution] = useState('0');
  const [contribPeriod, setContribPeriod] = useState<'ANUAL' | 'MENSAL'>('MENSAL');

  const [series, setSeries] = useState<Array<{ period: number; value: number }>>([]);
  const [savedSimulations, setSavedSimulations] = useState<SavedFISimulation[]>([]);
  const [simulationName, setSimulationName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setSavedSimulations(parsed);
      }
    } catch (e) {
      console.error('Erro ao carregar simulações:', e);
    }
  }, []);

  const saveSimulations = (list: SavedFISimulation[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Erro ao salvar simulações:', e);
    }
  };

  const handleDeleteForm = () => {
    setInitial('0');
    setRate('0');
    setRatePeriod('ANUAL');
    setTerm('0');
    setTermUnit('ANOS');
    setTaxPercent('0');
    setContribution('0');
    setContribPeriod('MENSAL');
    setSeries([]);
  };

  const handleDeleteSimulation = (id: string) => {
    const updated = savedSimulations.filter(s => s.id !== id);
    setSavedSimulations(updated);
    saveSimulations(updated);
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  };

  /* ————————————————— Helpers ————————————————— */
  const generateSeries = (params: CompoundParams) => {
    const { initial, rate, ratePeriod, term, termUnit, monthly } = params;

    const totalMonths = termUnit === 'ANOS' ? term * 12 : term;
    const i           = ratePeriod === 'ANUAL' ? rate / 100 / 12 : rate / 100;

    const arr: (typeof series)[number][] = [];

    for (let n = 0; n <= totalMonths; n++) {
      const principal = initial * Math.pow(1 + i, n);
      const contrib =
        i !== 0 ? monthly * ((Math.pow(1 + i, n) - 1) / i) : monthly * n;

      arr.push({ period: n, value: principal + contrib });
    }
    return arr;
  };

  const calculate = () => {
    const convertToNumber = (v: string) => Number(v.replace(',', '.'));

    const numericInitial = convertToNumber(initial);
    const numericRate = convertToNumber(rate);
    const numericTerm = convertToNumber(term);
    const numericTaxPct = convertToNumber(taxPercent);
    const numericContrib = convertToNumber(contribution);
    const monthlyContrib = contribPeriod === 'ANUAL' ? numericContrib / 12 : numericContrib;

    const baseSeries = generateSeries({
      initial: numericInitial,
      rate: numericRate,
      ratePeriod,
      term: numericTerm,
      termUnit,
      monthly: monthlyContrib,
    });
    setSeries(baseSeries);
  };

  const handleSaveSimulation = () => {
    if (!simulationName.trim() || series.length === 0) return;
    const finalVal = series[series.length - 1].value;
    const initVal = Number(initial.replace(',', '.')) || 0;
    const profit = finalVal - initVal;
    const taxVal = profit * ((Number(taxPercent.replace(',', '.')) || 0) / 100);
    const netVal = finalVal - taxVal;
    const monthlyRate = ratePeriod === 'ANUAL' ? (Number(rate.replace(',', '.')) || 0) / 12 / 100 : (Number(rate.replace(',', '.')) || 0) / 100;
    const safeWithdrawVal = netVal * monthlyRate;

    const sim: SavedFISimulation = {
      id: Date.now().toString(),
      name: simulationName.trim(),
      initial: initVal,
      rate: Number(rate.replace(',', '.')) || 0,
      ratePeriod,
      term: Number(term.replace(',', '.')) || 0,
      termUnit,
      taxPercent: Number(taxPercent.replace(',', '.')) || 0,
      contribution: Number(contribution.replace(',', '.')) || 0,
      contribPeriod,
      series: [...series],
      finalValue: finalVal,
      taxValue: taxVal,
      netValue: netVal,
      safeWithdraw: safeWithdrawVal,
      createdAt: new Date().toISOString(),
    };
    const updated = [sim, ...savedSimulations];
    setSavedSimulations(updated);
    saveSimulations(updated);
    setSimulationName('');
  };

  const handleLoadSimulation = (s: SavedFISimulation) => {
    setInitial(s.initial.toString());
    setRate(s.rate.toString());
    setRatePeriod(s.ratePeriod);
    setTerm(s.term.toString());
    setTermUnit(s.termUnit);
    setTaxPercent(s.taxPercent.toString());
    setContribution(s.contribution.toString());
    setContribPeriod(s.contribPeriod);
    setSeries(s.series);
  };

  const finalValue = series.length ? series.at(-1)!.value : null;
  const taxValue = finalValue != null
    ? (finalValue - (Number(initial.replace(',', '.')) || 0)) * ((Number(taxPercent.replace(',', '.')) || 0) / 100)
    : null;
  const netValue = finalValue != null && taxValue != null ? finalValue - taxValue : null;
  const safeWithdraw = netValue != null
    ? netValue * (ratePeriod === 'ANUAL' ? (Number(rate.replace(',', '.')) || 0) / 12 / 100 : (Number(rate.replace(',', '.')) || 0) / 100)
    : null;

  /* ————————————————— Render ————————————————— */
  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main' }}>
        <SavingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Calculadora de Independência Financeira
      </Typography>

      <Grid container spacing={3}>
        {/* Formulário */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Parâmetros do Plano
            </Typography>
            
            <Stack spacing={3}>
              {/* Capital inicial */}
              <TextField
  label="Capital Inicial"
  name="initial"
  value={initial}
  onChange={(e) => setInitial(e.target.value)}
  InputProps={{
    inputComponent: NumericFormatCustom as any,
    startAdornment: <InputAdornment position="start">R$</InputAdornment>
  }}
  fullWidth
  variant="outlined"
  size="medium"
/>

              {/* Taxa + periodicidade */}
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Taxa de Juros"
                  name="rate"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  InputProps={{
                    inputComponent: PercentageFormatCustom as any,
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                  fullWidth
                  variant="outlined"
                  size="medium"
                />
                <Select
                  value={ratePeriod}
                  onChange={(e) => setRatePeriod(e.target.value as 'ANUAL' | 'MENSAL')}
                  variant="outlined"
                  size="medium"
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="ANUAL">Anual</MenuItem>
                  <MenuItem value="MENSAL">Mensal</MenuItem>
                </Select>
              </Stack>

              {/* Período + unidade */}
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Período"
                  name="term"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  InputProps={{
                    inputComponent: NumericFormatCustom as any,
                  }}
                  fullWidth
                  variant="outlined"
                  size="medium"
                />
                <Select
                  value={termUnit}
                  onChange={(e) => setTermUnit(e.target.value as 'ANOS' | 'MESES')}
                  variant="outlined"
                  size="medium"
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="ANOS">Anos</MenuItem>
                  <MenuItem value="MESES">Meses</MenuItem>
                </Select>
              </Stack>

              {/* Aporte mensal */}
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Aporte"
                  name="contribution"
                  value={contribution}
                  onChange={(e) => setContribution(e.target.value)}
                  InputProps={{
                    inputComponent: NumericFormatCustom as any,
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>
                  }}
                  fullWidth
                  variant="outlined"
                  size="medium"
                />
                <Select
                  value={contribPeriod}
                  onChange={(e) => setContribPeriod(e.target.value as 'ANUAL' | 'MENSAL')}
                  variant="outlined"
                  size="medium"
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="ANUAL">Anual</MenuItem>
                  <MenuItem value="MENSAL">Mensal</MenuItem>
                </Select>
              </Stack>

              {/* Imposto */}
              <TextField
                label="Imposto a Pagar (%)"
                name="taxPercent"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                InputProps={{
                  inputComponent: PercentageFormatCustom as any,
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
                fullWidth
                variant="outlined"
                size="medium"
              />

              {/* Botões */}
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleDeleteForm}
                  startIcon={<DeleteIcon />}
                  fullWidth
                  size="large"
                >
                  Limpar
                </Button>
                <Button
                  variant="contained"
                  onClick={calculate}
                  startIcon={<CalculateIcon />}
                  fullWidth
                  size="large"
                >
                  {isLoading ? 'Calculando...' : 'Calcular'}
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Grid>

        {/* Resultados */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              <MonetizationOnIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Resultados da Independência
            </Typography>
            
            {finalValue !== null ? (
  <Stack spacing={2}>
    {/* Patrimônio Total Final (já vindo como número) */}
    <TextField
      label="Patrimônio Total Final"
      value={finalValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">R$</InputAdornment>
        ),
        readOnly: true,
      }}
      fullWidth
      variant="outlined"
      size="medium"
      sx={{ 
        '& .MuiInputBase-input': { 
          fontWeight: 'bold',
          color: 'success.main',
          fontSize: '1.1rem'
        }
      }}
    />

    {/* Valor do Imposto (string → número) */}
    <TextField
      label="Valor do Imposto"
      value={
        taxValue != null
          ? Number(taxValue).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : '0,00'
      }
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">R$</InputAdornment>
        ),
        readOnly: true,
      }}
      fullWidth
      variant="outlined"
      size="medium"
      sx={{ 
        '& .MuiInputBase-input': { 
          color: 'error.main',
          fontSize: '1.1rem',
          fontWeight: 'bold',
        }
      }}
    />

    {/* Patrimônio Líquido (string → número) */}
    <TextField
      label="Patrimônio Líquido"
      value={
        netValue != null
          ? Number(netValue).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : '0,00'
      }
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">R$</InputAdornment>
        ),
        readOnly: true,
      }}
      fullWidth
      variant="outlined"
      size="medium"
      sx={{ 
        '& .MuiInputBase-input': { 
          fontWeight: 'bold',
          color: 'primary.main',
          fontSize: '1.1rem'
        }
      }}
    />

    {/* Saque Mensal Sustentável (string → número) */}
    <TextField
      label="Saque Mensal Sustentável"
      value={
        safeWithdraw != null
          ? Number(safeWithdraw).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : '0,00'
      }
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">R$</InputAdornment>
        ),
        readOnly: true,
      }}
      fullWidth
      variant="outlined"
      size="medium"
      sx={{ 
        '& .MuiInputBase-input': { 
          fontWeight: 'bold',
          color: 'success.main',
          fontSize: '1.2rem'
        }
      }}
    />
  </Stack>
) : (
              <Alert severity="info">
                Preencha os parâmetros e clique em "Calcular" para ver os resultados da sua independência financeira.
              </Alert>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Salvar simulação */}
      {series.length > 0 && (
        <Card elevation={2} sx={{ mt: 3, p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Nome da simulação"
              value={simulationName}
              onChange={(e) => setSimulationName(e.target.value)}
              placeholder="Ex: Aposentadoria 2035"
              size="small"
              sx={{ flex: 1 }}
            />
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleSaveSimulation}
              disabled={!simulationName.trim()}
            >
              Salvar
            </Button>
          </Stack>
        </Card>
      )}

      {/* Simulações salvas */}
      {savedSimulations.length > 0 && (
        <Card elevation={3} sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Simulações Salvas
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ width: 40 }} />
                  <TableCell>Nome</TableCell>
                  <TableCell align="right">Patrimônio Final</TableCell>
                  <TableCell align="right">Saque Mensal</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {savedSimulations.map((s) => (
                  <React.Fragment key={s.id}>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <IconButton size="small" onClick={() => toggleExpand(s.id)} aria-label={expandedIds.has(s.id) ? 'Minimizar' : 'Expandir'}>
                          {expandedIds.has(s.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell align="right">
                        R$ {s.netValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right">
                        R$ {s.safeWithdraw.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{new Date(s.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button size="small" variant="outlined" onClick={() => handleLoadSimulation(s)}>
                            Carregar
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => { setDeleteTargetId(s.id); setDeleteDialogOpen(true); }}
                          >
                            Excluir
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 0, borderBottom: 0 }}>
                        <Collapse in={expandedIds.has(s.id)} timeout="auto" unmountOnExit>
                          <Box sx={{ py: 2, px: 1, bgcolor: 'action.hover' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Resultados detalhados</Typography>
                            <Stack direction="row" spacing={3} flexWrap="wrap">
                              <Typography variant="body2">Patrimônio Total: <strong>R$ {s.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></Typography>
                              <Typography variant="body2">Imposto: <strong>R$ {s.taxValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></Typography>
                              <Typography variant="body2">Patrimônio Líquido: <strong>R$ {s.netValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></Typography>
                              <Typography variant="body2">Saque Mensal: <strong>R$ {s.safeWithdraw.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></Typography>
                              <Typography variant="body2">Parâmetros: {s.initial.toLocaleString('pt-BR')} inicial, {s.rate}% {s.ratePeriod === 'ANUAL' ? 'a.a.' : 'a.m.'}, aporte R$ {s.contribution.toLocaleString('pt-BR')}/{s.contribPeriod === 'ANUAL' ? 'ano' : 'mês'}, {s.term} {s.termUnit === 'ANOS' ? 'anos' : 'meses'}</Typography>
                            </Stack>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); setDeleteTargetId(null); }}>
        <DialogTitle>Excluir simulação</DialogTitle>
        <DialogContent>
          <DialogContentText>Deseja realmente excluir esta simulação?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); setDeleteTargetId(null); }}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={() => deleteTargetId && handleDeleteSimulation(deleteTargetId)}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Gráfico */}
      {series.length > 0 && (
        <Card elevation={3} sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Evolução do Patrimônio
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 20, right: 30, left: 50, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="period"
                  label={{
                    value: 'Meses',
                    position: 'insideBottomRight',
                    offset: -5,
                  }}
                />
                <YAxis 
                  tickFormatter={(v) => `R$${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  domain={['dataMin - 1000', 'dataMax + 1000']}
                  width={80}
                />
                <Tooltip 
                  formatter={(v) => [`R$${(v as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Patrimônio']}
                  labelFormatter={(label) => `Mês ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  dot={false}
                  stroke="#2e7d32"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Card>
      )}
    </Box>
  );
};

export default FinancialIndependence;
