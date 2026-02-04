import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Button,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { Search, EmojiEvents, TrendingUp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface LeaderboardUser {
  position: number;
  id: string;
  name: string;
  avatar: string;
  tokens: number;
  virtualMoney?: number; // Dinheiro virtual total
  totalWins: number;
  totalLosses: number;
  winRate: number;
  totalProfit: number;
  rank: number;
  bestWinStreak: number;
  currentStreak: number;
  averageReturn: number;
}

type RankingType = 'tokens' | 'virtualMoney' | 'winrate';

const FullRankingPage: React.FC = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [rankingType, setRankingType] = useState<RankingType>('tokens');

  console.log('🎯 FullRankingPage renderizado!'); // Debug log

  useEffect(() => {
    console.log('🔄 useEffect executado no FullRankingPage'); // Debug log
    fetchFullLeaderboard();
  }, []);

  useEffect(() => {
    console.log('🔄 Reordenando por tipo de ranking:', rankingType);
    if (leaderboard.length > 0) {
      reorderLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankingType]);

  useEffect(() => {
    console.log('🔍 Filtrando leaderboard...'); // Debug log
    filterLeaderboard();
  }, [searchTerm, leaderboard]);

  const fetchFullLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Iniciando busca do leaderboard completo...'); // Debug log
      
      const token = localStorage.getItem('authToken');
      console.log('🔑 Token encontrado:', !!token); // Debug log
      
      const apiUrl = import.meta.env.VITE_API_URL ?? '';
      const response = await fetch(`${apiUrl}/api/challenges/all-users-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status); // Debug log

      if (!response.ok) {
        throw new Error('Erro ao carregar ranking completo');
      }

      const data = await response.json();
      console.log('📊 Dados recebidos:', data); // Debug log
      
      // Adicionar posições e garantir que todos os campos estejam presentes
      const formattedData = data.map((user: any) => ({
        ...user,
        bestWinStreak: user.bestWinStreak || 0,
        currentStreak: user.currentStreak || 0,
        averageReturn: user.averageReturn || 0
      }));
      
      // Ordenar baseado no tipo de ranking selecionado
      const sortedData = sortLeaderboardByType(formattedData, rankingType);
      
      // Adicionar posições após ordenação
      const dataWithPositions = sortedData.map((user, index) => ({
        ...user,
        position: index + 1
      }));
      
      console.log('✨ Dados formatados:', dataWithPositions); // Debug log
      setLeaderboard(dataWithPositions);
    } catch (err) {
      console.error('❌ Erro ao buscar leaderboard completo:', err); // Debug log
      setError('Erro ao carregar ranking completo dos usuários');
    } finally {
      setLoading(false);
    }
  };

  const filterLeaderboard = () => {
    if (!searchTerm.trim()) {
      setFilteredLeaderboard(leaderboard);
      return;
    }

    const filtered = leaderboard.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLeaderboard(filtered);
    setPage(0); // Reset para primeira página ao filtrar
  };

  const sortLeaderboardByType = (data: any[], type: RankingType): LeaderboardUser[] => {
    if (type === 'tokens') {
      return [...data].sort((a, b) => {
        if (b.tokens !== a.tokens) return b.tokens - a.tokens;
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.totalWins - a.totalWins;
      });
    } else if (type === 'virtualMoney') {
      return [...data].sort((a, b) => {
        const aVirtualMoney = a.virtualMoney || 0;
        const bVirtualMoney = b.virtualMoney || 0;
        if (bVirtualMoney !== aVirtualMoney) return bVirtualMoney - aVirtualMoney;
        if (b.tokens !== a.tokens) return b.tokens - a.tokens;
        return b.winRate - a.winRate;
      });
    } else {
      // winrate
      return [...data].sort((a, b) => {
        // Filtrar usuários sem desafios (winRate = 0 e totalWins = 0)
        const aHasChallenges = (a.totalWins + a.totalLosses) > 0;
        const bHasChallenges = (b.totalWins + b.totalLosses) > 0;
        
        if (aHasChallenges && !bHasChallenges) return -1;
        if (!aHasChallenges && bHasChallenges) return 1;
        
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
        return b.tokens - a.tokens;
      });
    }
  };

  const reorderLeaderboard = () => {
    // Remover posições atuais e reordenar
    const dataWithoutPositions = leaderboard.map(({ position, ...rest }) => rest);
    const sortedData = sortLeaderboardByType(dataWithoutPositions, rankingType);
    const dataWithPositions = sortedData.map((user, index) => ({
      ...user,
      position: index + 1
    }));
    setLeaderboard(dataWithPositions);
  };

  const handleRankingTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newRankingType: RankingType | null
  ) => {
    if (newRankingType !== null) {
      setRankingType(newRankingType);
      setPage(0); // Reset para primeira página ao mudar tipo de ranking
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <EmojiEvents sx={{ color: '#FFD700', fontSize: 28 }} />;
      case 2:
        return <EmojiEvents sx={{ color: '#C0C0C0', fontSize: 24 }} />;
      case 3:
        return <EmojiEvents sx={{ color: '#CD7F32', fontSize: 20 }} />;
      default:
        return <TrendingUp sx={{ color: 'text.secondary', fontSize: 18 }} />;
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return '#FFD700';
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return 'text.secondary';
    }
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h3" fontWeight="bold" color="primary" gutterBottom>
              🏆 Classificação Completa
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {rankingType === 'tokens' 
                ? 'Ranking baseado em quem tem mais tokens (apostas)'
                : rankingType === 'virtualMoney'
                ? 'Ranking baseado em quem tem mais dinheiro virtual (carteira)'
                : 'Ranking baseado na maior taxa de vitórias (win rate)'}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => navigate('/home/challenge')}
          >
            ← Voltar aos Desafios
          </Button>
        </Box>

        {/* Seletor de tipo de ranking */}
        <Box mb={3}>
          <ToggleButtonGroup
            value={rankingType}
            exclusive
            onChange={handleRankingTypeChange}
            aria-label="tipo de ranking"
            size="large"
            fullWidth
            sx={{ maxWidth: 700 }}
          >
            <ToggleButton value="tokens" aria-label="ranking por tokens">
              🪙 Mais Tokens
            </ToggleButton>
            <ToggleButton value="virtualMoney" aria-label="ranking por dinheiro virtual">
              💰 Mais Dinheiro Virtual
            </ToggleButton>
            <ToggleButton value="winrate" aria-label="ranking por win rate">
              🏆 Maior Taxa de Vitórias
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Top 3 em destaque */}
      {leaderboard.length >= 3 && (
        <Grid container spacing={3} mb={4}>
          {leaderboard.slice(0, 3).map((user, index) => (
            <Grid item xs={12} md={4} key={user.id}>
              <Card
                elevation={4}
                sx={{
                  border: `3px solid ${getPositionColor(user.position)}`,
                  backgroundColor: 'rgba(255, 215, 0, 0.05)',
                  textAlign: 'center',
                  p: 3
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="center" mb={2}>
                    {getPositionIcon(user.position)}
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                    #{user.position}
                  </Typography>
                  <Avatar
                    src={user.avatar}
                    alt={user.name}
                    sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
                  />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {user.name}
                  </Typography>
                  <Chip
                    label={
                      rankingType === 'tokens' 
                        ? `${user.tokens.toFixed(0)} tokens`
                        : rankingType === 'virtualMoney'
                        ? `$${(user.virtualMoney || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `${user.tokens.toFixed(0)} tokens`
                    }
                    color={rankingType === 'virtualMoney' ? 'secondary' : 'primary'}
                    size="medium"
                    sx={{ mb: 1 }}
                  />
                  <Box mt={2}>
                    {rankingType !== 'virtualMoney' && (
                      <Typography variant="body2" color="text.secondary">
                        Dinheiro Virtual: ${(user.virtualMoney || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    )}
                    {rankingType !== 'tokens' && (
                      <Typography variant="body2" color="text.secondary">
                        Tokens: {user.tokens.toFixed(0)}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Win Rate: {user.winRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Vitórias: {user.totalWins} | Derrotas: {user.totalLosses}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Barra de pesquisa */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Pesquisar usuário por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Tabela de ranking */}
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Posição</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Usuário</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Tokens</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Dinheiro Virtual</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Win Rate</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Vitórias</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Derrotas</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Streak Atual</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Melhor Streak</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLeaderboard
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow
                    key={user.id}
                    sx={{
                      backgroundColor: user.position <= 3 ? 'rgba(255, 215, 0, 0.05)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      }
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getPositionIcon(user.position)}
                        <Typography variant="body2" ml={1} fontWeight="bold">
                          #{user.position}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar
                          src={user.avatar}
                          alt={user.name}
                          sx={{ width: 40, height: 40, mr: 2 }}
                        />
                        <Typography variant="body2" fontWeight="medium">
                          {user.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={user.tokens.toFixed(0)}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`$${(user.virtualMoney || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        color="secondary"
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${user.winRate.toFixed(1)}%`}
                        color={user.winRate >= 60 ? 'success' : user.winRate >= 40 ? 'warning' : 'error'}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        {user.totalWins}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="error.main" fontWeight="bold">
                        {user.totalLosses}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="info.main" fontWeight="bold">
                        {user.currentStreak}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="secondary.main" fontWeight="bold">
                        {user.bestWinStreak}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredLeaderboard.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>
    </Container>
  );
};

export default FullRankingPage;
