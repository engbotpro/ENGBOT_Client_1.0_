import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Avatar,
  Box,
  Chip,
  LinearProgress
} from '@mui/material';
import { TrendingUp, TrendingDown, EmojiEvents, AccountBalance } from '@mui/icons-material';
import type { UserStats } from '../../types/challenge';

interface UserStatsCardProps {
  userStats: UserStats;
}

const UserStatsCard: React.FC<UserStatsCardProps> = ({ userStats }) => {
  const totalGames = userStats.totalWins + userStats.totalLosses;
  const winRatePercentage = totalGames > 0 ? (userStats.totalWins / totalGames) * 100 : 0;

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        <Grid container spacing={3} alignItems="center">
          {/* Avatar e informações básicas */}
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar 
                src={userStats.avatar} 
                sx={{ width: 60, height: 60, flexShrink: 0 }}
              >
                {userStats.name.charAt(0)}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="h6" fontWeight="bold" noWrap>
                  {userStats.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {userStats.email}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Tokens */}
          <Grid item xs={12} md={2}>
            <Box textAlign="center">
              <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                <AccountBalance color="primary" />
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {userStats.tokens}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Tokens
              </Typography>
            </Box>
          </Grid>

          {/* Estatísticas de vitórias */}
          <Grid item xs={12} md={2}>
            <Box textAlign="center">
              <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                <EmojiEvents color="success" />
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  {userStats.totalWins}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Vitórias
              </Typography>
            </Box>
          </Grid>

          {/* Taxa de vitória */}
          <Grid item xs={12} md={2}>
            <Box textAlign="center">
              <Typography variant="h6" fontWeight="bold" mb={1}>
                {userStats.winRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Taxa de Vitória
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={winRatePercentage} 
                sx={{ height: 8, borderRadius: 4 }}
                color={winRatePercentage >= 60 ? "success" : winRatePercentage >= 40 ? "warning" : "error"}
              />
            </Box>
          </Grid>

          {/* Lucro total */}
          <Grid item xs={12} md={2}>
            <Box textAlign="center">
              <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                {userStats.totalProfit >= 0 ? (
                  <TrendingUp color="success" />
                ) : (
                  <TrendingDown color="error" />
                )}
                <Typography 
                  variant="h6" 
                  fontWeight="bold"
                  color={userStats.totalProfit >= 0 ? "success.main" : "error.main"}
                >
                  ${userStats.totalProfit.toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Lucro Total
              </Typography>
              <Chip 
                label={`${totalGames} jogos`}
                size="small"
                variant="outlined"
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default UserStatsCard; 