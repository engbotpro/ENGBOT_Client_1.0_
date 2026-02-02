import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Snackbar,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Pagination,
  Stack
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  Refresh,
  TrendingUp,
  TrendingDown,
  Timeline,
  Analytics,
  History,
  Assessment,
  Speed,
  Psychology
} from '@mui/icons-material';
import ManualTradeForm from './ManualTradeForm';
import { Trade, TradeStats } from '../../types/trade';
import { 
  fetchUserTrades, 
  fetchTradeStats, 
  formatTradeDate, 
  formatCurrency, 
  getPnLColor,
  getTradeTypeLabel,
  getEnvironmentLabel,
  getEnvironmentColor,
  createTrade,
  updateTrade
} from '../../services/tradeAPI';

const HistoricalPage: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualTradeOpen, setManualTradeOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [symbolFilter, setSymbolFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [tradeTypeFilter, setTradeTypeFilter] = useState<string>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Paginação
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    try {
      setLoading(true);
      const [tradesData, statsData] = await Promise.all([
        fetchUserTrades(),
        fetchTradeStats()
      ]);
      setTrades(tradesData);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar trades:', error);
      showSnackbar('Erro ao carregar histórico de trades', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTrade = (trade: Trade) => {
    setSelectedTrade(trade);
    setManualTradeOpen(true);
  };

  const handleSaveTrade = async (trade: Trade) => {
    try {
      if (selectedTrade) {
        // Editar trade existente
        await updateTrade(trade.id, {
          pnl: trade.pnl,
          pnlPercent: trade.pnlPercent,
          status: trade.status,
          exitTime: trade.exitTime,
          fees: trade.fees,
          notes: trade.notes
        });
        showSnackbar('Trade atualizado com sucesso!', 'success');
      } else {
        // Criar novo trade
        const newTradeData = {
          symbol: trade.symbol,
          side: trade.side,
          type: trade.type,
          quantity: trade.quantity,
          price: trade.price,
          total: trade.total,
          tradeType: trade.tradeType,
          environment: trade.environment,
          stopLoss: trade.stopLoss,
          takeProfit: trade.takeProfit,
          notes: trade.notes,
          botId: trade.botId,
          botName: trade.botName
        };
        
        await createTrade(newTradeData);
        showSnackbar('Trade criado com sucesso!', 'success');
      }
      
      // Recarregar os dados
      await loadTrades();
    } catch (error) {
      console.error('Erro ao salvar trade:', error);
      showSnackbar('Erro ao salvar trade', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Filtrar trades
  const filteredTrades = trades.filter(trade => {
    const matchesStatus = statusFilter === 'all' || trade.status === statusFilter;
    const matchesSymbol = !symbolFilter || 
      trade.symbol.toLowerCase().includes(symbolFilter.toLowerCase());
    const matchesType = typeFilter === 'all' || trade.side === typeFilter;
    const matchesTradeType = tradeTypeFilter === 'all' || trade.tradeType === tradeTypeFilter;
    const matchesEnvironment = environmentFilter === 'all' || trade.environment === environmentFilter;
    const matchesSearch = !searchTerm || 
      trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.botName?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSymbol && matchesType && matchesTradeType && matchesEnvironment && matchesSearch;
  });

  // Calcular paginação
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTrades = filteredTrades.slice(startIndex, endIndex);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, symbolFilter, typeFilter, tradeTypeFilter, environmentFilter, searchTerm]);

  // Estatísticas
  const totalTrades = trades.length;
  const closedTrades = trades.filter(t => t.status === 'closed').length;
  const openTrades = trades.filter(t => t.status === 'open').length;
  const totalProfit = trades
    .filter(t => t.pnl !== undefined)
    .reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winRate = closedTrades > 0 
    ? (trades.filter(t => t.status === 'closed' && (t.pnl || 0) > 0).length / closedTrades) * 100 
    : 0;

  const symbols = Array.from(new Set(trades.map(t => t.symbol)));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed':
        return 'success';
      case 'open':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'closed':
        return 'Fechado';
      case 'open':
        return 'Aberto';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            Histórico de Trading
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setManualTradeOpen(true)}
          >
            Registrar Trade Manual
          </Button>
        </Box>

        {/* Estatísticas */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {totalTrades}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de Trades
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {closedTrades}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Trades Fechados
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                  <Typography 
                    variant="h6" 
                    color={totalProfit >= 0 ? 'success' : 'error'}
                  >
                    {formatCurrency(totalProfit)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lucro Total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {winRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Taxa de Acerto
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filtros */}
        <Card>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  placeholder="Buscar trades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <Search />
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="open">Abertos</MenuItem>
                    <MenuItem value="closed">Fechados</MenuItem>
                    <MenuItem value="cancelled">Cancelados</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={typeFilter}
                    label="Tipo"
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="buy">Compras</MenuItem>
                    <MenuItem value="sell">Vendas</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Operação</InputLabel>
                  <Select
                    value={tradeTypeFilter}
                    label="Tipo de Operação"
                    onChange={(e) => setTradeTypeFilter(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="manual">Manual</MenuItem>
                    <MenuItem value="automated">Automático</MenuItem>
                    <MenuItem value="bot">Bot</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Ambiente</InputLabel>
                  <Select
                    value={environmentFilter}
                    label="Ambiente"
                    onChange={(e) => setEnvironmentFilter(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="real">Real</MenuItem>
                    <MenuItem value="simulated">Simulado</MenuItem>
                    <MenuItem value="paper">Paper Trading</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Símbolo</InputLabel>
                  <Select
                    value={symbolFilter}
                    label="Símbolo"
                    onChange={(e) => setSymbolFilter(e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {symbols.map(symbol => (
                      <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Por Página</InputLabel>
                  <Select
                    value={itemsPerPage}
                    label="Por Página"
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={loadTrades}
                    disabled={loading}
                  >
                    Atualizar
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    onClick={() => {
                      setStatusFilter('all');
                      setTypeFilter('all');
                      setTradeTypeFilter('all');
                      setEnvironmentFilter('all');
                      setSymbolFilter('');
                      setSearchTerm('');
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Trades" icon={<History />} />
          <Tab label="Análise" icon={<Analytics />} />
          <Tab label="Relatórios" icon={<Assessment />} />
        </Tabs>
      </Card>

      {/* Conteúdo das Tabs */}
      {activeTab === 0 && (
        <Box mt={3}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <LinearProgress sx={{ width: '100%' }} />
            </Box>
          ) : filteredTrades.length === 0 ? (
            <Card>
              <CardContent>
                <Box textAlign="center" py={4}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Nenhum trade encontrado
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {trades.length === 0 
                      ? 'Registre seu primeiro trade para começar'
                      : 'Tente ajustar os filtros de busca'
                    }
                  </Typography>
                  {trades.length === 0 && (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setManualTradeOpen(true)}
                      sx={{ mt: 2 }}
                    >
                      Registrar Primeiro Trade
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Data/Hora</TableCell>
                      <TableCell>Símbolo</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Preço</TableCell>
                      <TableCell>Quantidade</TableCell>
                      <TableCell>Valor Total</TableCell>
                      <TableCell>PnL</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Tipo de Operação</TableCell>
                      <TableCell>Ambiente</TableCell>
                      <TableCell>Observações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedTrades.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell>
                          {formatTradeDate(trade.entryTime)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {trade.symbol}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={trade.side === 'buy' ? 'Compra' : 'Venda'} 
                            color={trade.side === 'buy' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatCurrency(trade.price)}</TableCell>
                        <TableCell>{trade.quantity.toFixed(4)}</TableCell>
                        <TableCell>{formatCurrency(trade.total)}</TableCell>
                        <TableCell>
                          {trade.pnl !== undefined ? (
                            <Typography 
                              variant="body2" 
                              color={getPnLColor(trade.pnl)}
                              fontWeight="bold"
                            >
                              {formatCurrency(trade.pnl)}
                              {trade.pnlPercent && (
                                <span> ({trade.pnlPercent > 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%)</span>
                              )}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getStatusLabel(trade.status)} 
                            color={getStatusColor(trade.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getTradeTypeLabel(trade.tradeType)}
                            variant="outlined"
                            size="small"
                          />
                          {trade.botName && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {trade.botName}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getEnvironmentLabel(trade.environment)}
                            color={getEnvironmentColor(trade.environment) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {trade.notes || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {filteredTrades.length > 0 && (
                <Box mt={3} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredTrades.length)} de {filteredTrades.length} trades
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Página {currentPage} de {totalPages}
                    </Typography>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={(_, page) => setCurrentPage(page)}
                      color="primary"
                      size="small"
                      showFirstButton
                      showLastButton
                    />
                  </Stack>
                </Box>
              )}
            </>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Análise de Performance
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance por Símbolo
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Símbolo</TableCell>
                          <TableCell>Trades</TableCell>
                          <TableCell>Lucro</TableCell>
                          <TableCell>Taxa de Acerto</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {symbols.map(symbol => {
                          const symbolTrades = trades.filter(t => t.symbol === symbol);
                          const closedTrades = symbolTrades.filter(t => t.status === 'closed');
                          const totalProfit = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
                          const winRate = closedTrades.length > 0 
                            ? (closedTrades.filter(t => (t.pnl || 0) > 0).length / closedTrades.length) * 100 
                            : 0;
                          
                          return (
                            <TableRow key={symbol}>
                              <TableCell>{symbol}</TableCell>
                              <TableCell>{symbolTrades.length}</TableCell>
                              <TableCell>
                                <Typography 
                                  color={totalProfit >= 0 ? 'success' : 'error'}
                                >
                                  {formatCurrency(totalProfit)}
                                </Typography>
                              </TableCell>
                              <TableCell>{winRate.toFixed(1)}%</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resumo por Tipo e Ambiente
                  </Typography>
                  {stats && (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Por Tipo de Operação
                        </Typography>
                        <Typography variant="body2">
                          Manual: {stats.byType.manual.count} trades - {formatCurrency(stats.byType.manual.pnl)}
                        </Typography>
                        <Typography variant="body2">
                          Automático: {stats.byType.automated.count} trades - {formatCurrency(stats.byType.automated.pnl)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Por Ambiente
                        </Typography>
                        <Typography variant="body2">
                          Real: {stats.byEnvironment.real.count} trades - {formatCurrency(stats.byEnvironment.real.pnl)}
                        </Typography>
                        <Typography variant="body2">
                          Simulado: {stats.byEnvironment.simulated.count} trades - {formatCurrency(stats.byEnvironment.simulated.pnl)}
                        </Typography>
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {activeTab === 2 && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Relatórios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Relatórios detalhados de performance serão implementados aqui.
          </Typography>
        </Box>
      )}

      {/* Dialog de Trade Manual */}
      <ManualTradeForm
        open={manualTradeOpen}
        onClose={() => {
          setManualTradeOpen(false);
          setSelectedTrade(null);
        }}
        onSave={handleSaveTrade}
        trade={selectedTrade}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default HistoricalPage;
