import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { EmojiEvents, TrendingUp } from '@mui/icons-material';

interface LeaderboardUser {
  position: number;
  id: string;
  name: string;
  avatar: string;
  tokens: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  totalProfit: number;
  rank: number;
  bestWinStreak: number;
  currentStreak: number;
  averageReturn: number;
}

const LeaderboardCard: React.FC = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('🎯 LeaderboardCard renderizado!');

  useEffect(() => {
    console.log('🔄 useEffect executado no LeaderboardCard');
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Iniciando busca do leaderboard...');
      
      const token = localStorage.getItem('authToken');
      console.log('🔑 Token encontrado:', !!token);
      
      const apiUrl = import.meta.env.VITE_API_URL ?? '';
      const response = await fetch(`${apiUrl}/api/challenges/leaderboard?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error('Erro ao carregar ranking');
      }

      const data = await response.json();
      console.log('📊 Dados recebidos:', data);
      
      // Garantir que os dados tenham todos os campos necessários
      const formattedData = data.map((user: any, index: number) => ({
        ...user,
        position: index + 1, // Adicionar posição baseada no índice
        bestWinStreak: user.bestWinStreak || 0,
        currentStreak: user.currentStreak || 0,
        averageReturn: user.averageReturn || 0
      }));
      
      console.log('✨ Dados formatados:', formattedData);
      setLeaderboard(formattedData);
    } catch (err) {
      console.error('❌ Erro ao buscar leaderboard:', err);
      setError('Erro ao carregar ranking dos usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleViewFullRanking = () => {
    navigate('/home/challenge/ranking');
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <EmojiEvents sx={{ color: '#FFD700', fontSize: 24 }} />;
      case 2:
        return <EmojiEvents sx={{ color: '#C0C0C0', fontSize: 20 }} />;
      case 3:
        return <EmojiEvents sx={{ color: '#CD7F32', fontSize: 18 }} />;
      default:
        return <TrendingUp sx={{ color: 'text.secondary', fontSize: 16 }} />;
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
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={3}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold" color="primary">
            🏆 Top 10
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleViewFullRanking}
            size="small"
          >
            Classificação Completa
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {leaderboard.length === 0 ? (
          <Alert severity="info">
            Nenhum usuário encontrado no ranking.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {leaderboard.map((user) => (
              <Grid item xs={12} key={user.id}>
                <Box
                  display="flex"
                  alignItems="center"
                  py={0.75}
                  px={1}
                  sx={{
                    backgroundColor: user.position <= 3 ? 'rgba(255, 215, 0, 0.05)' : 'transparent',
                    borderRadius: 1.5,
                    border: user.position <= 3 ? `2px solid ${getPositionColor(user.position)}` : '1px solid #e0e0e0',
                    transition: 'all 0.2s ease-in-out',
                    overflow: 'hidden',
                    minHeight: 48,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      transform: 'translateY(-1px)',
                      boxShadow: 1
                    }
                  }}
                >
                  {/* Posição */}
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    minWidth={28}
                    mr={1}
                    flexShrink={0}
                  >
                    {getPositionIcon(user.position)}
                  </Box>

                  {/* Avatar */}
                  <Avatar
                    src={user.avatar}
                    alt={user.name}
                    sx={{ width: 32, height: 32, mr: 1.25, flexShrink: 0 }}
                  />

                  {/* Nome */}
                  <Box flex={1} minWidth={0} sx={{ overflow: 'hidden', mr: 1.25 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: { xs: '180px', sm: '250px', md: '300px' },
                        fontSize: '0.875rem'
                      }}
                      title={user.name}
                    >
                      {user.name}
                    </Typography>
                  </Box>

                  {/* Tokens */}
                  <Box flexShrink={0}>
                    <Chip
                      label={`${user.tokens.toFixed(0)} tokens`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ height: 24, fontSize: '0.7rem' }}
                    />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaderboardCard;
