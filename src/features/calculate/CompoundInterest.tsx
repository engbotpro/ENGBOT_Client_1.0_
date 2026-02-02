/**
 * src/components/CompoundInterest.tsx
 *
 * Formulário + gráfico de juros compostos
 * — faz POST (cria/atualiza) e GET (carrega o último cálculo salvo).
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import type { CompoundSaved } from '../../types/calculate';

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
  CardContent,
  Typography,
  Grid,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';

import {
  useCalculateCompoundMutation,
  useGetCompoundQuery,
  useDeleteCompoundMutation
} from '../calculate/CalculateAPI';

import type { CompoundParams, CompoundResult } from '../../types/calculate';

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

const CompoundInterest: React.FC = () => {
  /* —— dados de autenticação —— */
  const userId = useSelector((state: RootState) => state.auth.user?.id ?? '');

  /* —— estados do formulário —— */
  const [initial, setInitial]     = useState('0');
  const [rate, setRate]           = useState('0');
  const [ratePeriod, setRatePeriod] = useState<'ANUAL' | 'MENSAL'>('ANUAL');
  const [term, setTerm]           = useState('0');
  const [termUnit, setTermUnit]   = useState<'ANOS' | 'MESES'>('ANOS');
  const [taxPercent, setTaxPercent] = useState('0');

  /* —— série de pontos para o gráfico —— */
  const [series, setSeries] = useState<Array<{ period: number; value: number }>>(
    [],
  );

  /* —— RTK Query —— */
  const [calculateCompound, { isLoading }] = useCalculateCompoundMutation();
  const {
  data: saved,
} = useGetCompoundQuery(userId, { skip: !userId }) as {
  data: CompoundSaved | undefined;
};
const [deleteCompound, { isLoading: deleting }] = useDeleteCompoundMutation();

const handleDelete = () => {
  if (!userId) return;
  deleteCompound(userId);
  setInitial('0');
    setRate('0');
    setRatePeriod('ANUAL');
    setTerm('0');
    setTermUnit('ANOS');
    setTaxPercent('0');
    setSeries([]);
};

console.log('saved', saved)

  /* ——————————————————————————————————————————————————————————
   * Helpers
   * —————————————————————————————————————————————————————————— */
  const generateSeries = (params: CompoundParams) => {
    const { initial, rate, ratePeriod, term, termUnit, monthly } = params;

    const totalMonths = termUnit === 'ANOS' ? term * 12 : term;
    const i           = ratePeriod === 'ANUAL' ? rate / 100 / 12 : rate / 100;

    const arr: Array<{ period: number; value: number }> = [];

    for (let n = 0; n <= totalMonths; n++) {
      const principal = initial * Math.pow(1 + i, n);
      const contrib =
        i !== 0 ? monthly * ((Math.pow(1 + i, n) - 1) / i) : monthly * n;

      arr.push({ period: n, value: principal + contrib });
    }
    return arr;
  };

  
  const calculate = () => {
    // Converte vírgulas em pontos para os campos numéricos
    const convertToNumber = (value: string) => {
      return Number(value.replace(',', '.'));
    };

    const numericInitial  = convertToNumber(initial);
    const numericRate     = convertToNumber(rate);
    const numericTerm     = convertToNumber(term);
    const numericTaxPct   = convertToNumber(taxPercent);

    /* —— gera série local —— */
    const baseSeries = generateSeries({
      initial: numericInitial,
      rate: numericRate,
      ratePeriod,
      term: numericTerm,
      termUnit,
      monthly: 0,
    });
    setSeries(baseSeries);

    /* —— dispara mutação POST —— */
    calculateCompound({
      initial : numericInitial,
      rate    : numericRate,
      ratePeriod,
      term    : numericTerm,
      termUnit,
      monthly : 0,
      userId,
      tax     : numericTaxPct,  // alíquota em %
    } as CompoundParams);
  };

  /* ——————————————————————————————————————————————————————————
   * Efeito: popula formulário se encontrar registro salvo
   * —————————————————————————————————————————————————————————— */
  useEffect(() => {
    if (!saved) return;

    setInitial(saved.initial?.toString() || '0');
    setRate(saved.rate?.toString() || '0');
    setRatePeriod(saved.ratePeriod as 'ANUAL' | 'MENSAL' || 'ANUAL');
    setTerm(saved.term?.toString() || '0');
    setTermUnit(saved.termUnit as 'ANOS' | 'MESES' || 'ANOS');
    setTaxPercent(saved.tax?.toString() || '0');

    setSeries(
      generateSeries({
        initial : saved.initial || 0,
        rate    : saved.rate || 0,
        ratePeriod: saved.ratePeriod || 'ANUAL',
        term    : saved.term || 0,
        termUnit: saved.termUnit || 'ANOS',
        monthly : 0,
      }),
    );
  }, [saved]);

  /* —— valores derivados —— */
  const finalValue = series.length ? series[series.length - 1].value : null;  
  const taxValue = saved?.taxValue;
  const netValue = saved?.netValue

    

  /* ——————————————————————————————————————————————————————————
   * Render
   * —————————————————————————————————————————————————————————— */
  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main' }}>
        <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Calculadora de Juros Compostos
      </Typography>

      <Grid container spacing={3}>
        {/* Formulário */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Parâmetros do Investimento
            </Typography>
            
            <Stack spacing={3}>
              {/* Valor Inicial */}
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

              {/* Taxa de Juros + período */}
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Taxa de Juros"
                  name="rate"
                  type="text"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  InputProps={{
                    inputComponent: PercentageFormatCustom as any,
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  fullWidth
                  variant="outlined"
                  size="medium"
                />
                <Select
                  value={ratePeriod}
                  onChange={(e) =>
                    setRatePeriod(e.target.value as 'ANUAL' | 'MENSAL')
                  }
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
                  type="text"
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
                  onChange={(e) =>
                    setTermUnit(e.target.value as 'ANOS' | 'MESES')
                  }
                  variant="outlined"
                  size="medium"
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="ANOS">Anos</MenuItem>
                  <MenuItem value="MESES">Meses</MenuItem>
                </Select>
              </Stack>

              {/* Imposto */}
              <TextField
                label="Imposto a Pagar (%)"
                name="taxPercent"
                type="text"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                InputProps={{
                  inputComponent: PercentageFormatCustom as any,
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                fullWidth
                variant="outlined"
                size="medium"
              />

              {/* Botões */}
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleDelete}
                  startIcon={<DeleteIcon />}
                  fullWidth
                  size="large"
                >
                  Limpar
                </Button>
                <Button
                  variant="contained"
                  onClick={calculate}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <CalculateIcon />}
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
              <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Resultados
            </Typography>
            
            {finalValue !== null ? (
              <Stack spacing={2}>
                <TextField
                  label="Capital Total Final"
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

                <TextField
                  label="Valor do Imposto"
                  value={
                    taxValue !== null && taxValue !== undefined
                      ? taxValue.toLocaleString('pt-BR', {
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

                <TextField
                  label="Valor Final Líquido"
                  value={
                    netValue !== null && netValue !== undefined
                      ? netValue.toLocaleString('pt-BR', {
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
                      fontSize: '1.2rem'
                    }
                  }}
                />
              </Stack>
            ) : (
              <Alert severity="info">
                Preencha os parâmetros e clique em "Calcular" para ver os resultados.
              </Alert>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Gráfico */}
      {series.length > 0 && (
        <Card elevation={3} sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Evolução do Investimento
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
                  formatter={(v) => [`R$${(v as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                  labelFormatter={(label) => `Mês ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  dot={false}
                  stroke="#1976d2"
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

export default CompoundInterest;
