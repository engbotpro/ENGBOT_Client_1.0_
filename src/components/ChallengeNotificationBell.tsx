import React, { useState, useEffect, useCallback } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Divider,
  CircularProgress,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SportsEsports from '@mui/icons-material/SportsEsports';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import challengeAPI from '../services/challengeAPI';
import type { Challenge } from '../types/challenge';
import { sendInfo, sendSuccess } from '../features/notificationSlice';

const CHALLENGE_STATUS_STORAGE_KEY = 'engbot_challenge_status';

function getStoredStatuses(userId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(`${CHALLENGE_STATUS_STORAGE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStoredStatuses(userId: string, statuses: Record<string, string>) {
  try {
    localStorage.setItem(`${CHALLENGE_STATUS_STORAGE_KEY}_${userId}`, JSON.stringify(statuses));
  } catch {
    // ignore
  }
}

export default function ChallengeNotificationBell() {
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChallenges = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const list = await challengeAPI.getUserChallenges(userId);
      setChallenges(list);

      // Notificar o desafiante quando alguém aceitar ou rejeitar
      const stored = getStoredStatuses(userId);
      const updated: Record<string, string> = {};
      for (const c of list) {
        updated[c.id] = c.status;
        if (c.challenger?.id !== userId) continue; // só notificar quem criou o desafio
        const prev = stored[c.id];
        if (prev === 'pending' && c.status === 'active') {
          dispatch(
            sendSuccess(
              `${c.challenged?.name || 'Alguém'} aceitou seu desafio "${c.title}".`
            )
          );
        } else if (prev === 'pending' && c.status === 'cancelled') {
          dispatch(
            sendInfo(
              `${c.challenged?.name || 'Alguém'} rejeitou seu desafio "${c.title}".`
            )
          );
        }
      }
      setStoredStatuses(userId, updated);
    } catch (err) {
      console.error('Erro ao carregar notificações de desafios:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, dispatch]);

  useEffect(() => {
    if (!userId) return;
    fetchChallenges();
    const interval = setInterval(fetchChallenges, 60 * 1000); // a cada 1 min
    return () => clearInterval(interval);
  }, [userId, fetchChallenges]);

  const pendingReceived = challenges.filter(
    (c) => c.status === 'pending' && c.challenged?.id === userId
  );
  const count = pendingReceived.length;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    fetchChallenges();
  };

  const handleClose = () => setAnchorEl(null);

  const goToChallenge = (challengeId: string) => {
    handleClose();
    navigate(`/home/challenge/${challengeId}/details`);
  };

  const open = Boolean(anchorEl);

  if (!userId) return null;

  return (
    <>
      <IconButton
        color="inherit"
        aria-label="Notificações de desafios"
        onClick={handleOpen}
        sx={{ color: 'white' }}
      >
        <Badge badgeContent={count} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { minWidth: 320, maxWidth: 400 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Desafios
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : pendingReceived.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nenhum desafio pendente para você.
            </Typography>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Você tem {pendingReceived.length} desafio(s) para responder:
              </Typography>
              <List dense disablePadding>
                {pendingReceived.map((c) => (
                  <ListItem
                    key={c.id}
                    button
                    onClick={() => goToChallenge(c.id)}
                    sx={{ borderRadius: 1 }}
                  >
                    <SportsEsports sx={{ mr: 1, color: 'primary.main' }} />
                    <ListItemText
                      primary={c.title}
                      secondary={`${c.challenger?.name || 'Desafiante'} te desafiou`}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 1 }} />
              <ListItem
                button
                onClick={() => {
                  handleClose();
                  navigate('/home/challenge');
                }}
              >
                <ListItemText primary="Ver todos os desafios" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>
            </>
          )}
        </Box>
      </Popover>
    </>
  );
}
