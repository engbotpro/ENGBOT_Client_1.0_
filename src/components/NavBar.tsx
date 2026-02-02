import { IconButton, Toolbar, Typography, Button, Box } from "@mui/material";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import { styled } from "@mui/material/styles";
import { RootState } from "../store";
import { useSelector} from "react-redux";
import MenuIcon from "@mui/icons-material/Menu";
import Notification from "./Notification";
import { Brightness4, Brightness7, Star } from "@mui/icons-material";
import { useTheme } from '../themeContext';
import logo from '../assets/saete-nobg.ico';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
  setOpen?: () => void;
}

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

export default function NavBar({ open, setOpen }: AppBarProps) {
  const { darkMode, toggleTheme } = useTheme(); 
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [userTokens, setUserTokens] = useState<number>(0);
  const [superCredits, setSuperCredits] = useState<number>(0);
  const [testerStatus, setTesterStatus] = useState<'pending' | 'approved' | null>(null);
  const navigate = useNavigate();

  // Função para buscar tokens do usuário
  const fetchUserTokens = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/challenges/stats/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserTokens(data.tokens || 0);
      }
    } catch (error) {
      console.error('Erro ao buscar tokens:', error);
    }
  };

  // Função para buscar Super Créditos e status de testador do usuário
  const fetchSuperCredits = () => {
    if (!user?.id) return;
    
    // Buscar Super Créditos de localStorage
    const stored = localStorage.getItem(`superCredits_${user.id}`);
    if (stored) {
      setSuperCredits(parseInt(stored) || 0);
    } else {
      setSuperCredits(0);
    }
    
    // Buscar status de testador
    const testerStatusStored = localStorage.getItem(`testerStatus_${user.id}`);
    if (testerStatusStored === 'pending' || testerStatusStored === 'approved') {
      setTesterStatus(testerStatusStored as 'pending' | 'approved');
    } else {
      setTesterStatus(null);
    }
  };

  // Carregar tokens e Super Créditos quando o usuário mudar
  useEffect(() => {
    if (user?.id) {
      fetchUserTokens();
      fetchSuperCredits();
    }
  }, [user?.id]);

  // Listener para atualizar Super Créditos quando adquiridos
  useEffect(() => {
    const handleStorageChange = () => {
      if (user?.id) {
        fetchSuperCredits();
      }
    };

    const handleSuperCreditsUpdate = () => {
      if (user?.id) {
        fetchSuperCredits();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('superCreditsUpdated', handleSuperCreditsUpdate);
    // Também verificar quando a página recebe foco (para atualizar em outras abas)
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('superCreditsUpdated', handleSuperCreditsUpdate);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, [user?.id]);

  return (
    <>
      <Notification />
      <AppBar position="fixed" open={open} color="primary">
        <Toolbar sx={{ justifyContent: "space-between" }}>
          {isAuthenticated && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{
                marginRight: 5,
                ...(open && { display: "none" }),
              }}
              onClick={setOpen}
            >
              <MenuIcon sx={{ color: "white" }} />
            </IconButton>
          )}

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ENGBOT
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography
              variant="h6"
              component="div"
              noWrap
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              
              Operações automatizadas
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2 }}>
            {isAuthenticated && (
              <>
                {/* Super Créditos ou Status de Testador */}
                {(superCredits > 0 || testerStatus) && (
                  <Box 
                    sx={{ 
                      bgcolor: testerStatus === 'pending' 
                        ? 'rgba(255, 152, 0, 0.2)' 
                        : 'rgba(255, 193, 7, 0.2)', 
                      border: `1px solid ${testerStatus === 'pending' ? 'rgba(255, 152, 0, 0.5)' : 'rgba(255, 193, 7, 0.5)'}`,
                      borderRadius: 2, 
                      px: 2, 
                      py: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      cursor: testerStatus ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: testerStatus === 'pending' 
                          ? 'rgba(255, 152, 0, 0.3)' 
                          : 'rgba(255, 193, 7, 0.3)',
                        transform: testerStatus ? 'none' : 'scale(1.05)'
                      }
                    }}
                    title={testerStatus === 'pending' ? 'Solicitação de testador pendente de aprovação' : undefined}
                  >
                    <Star sx={{ color: testerStatus === 'pending' ? '#FF9800' : '#FFC107', fontSize: '1.1rem' }} />
                    <Typography variant="body2" color="white" fontWeight="bold">
                      {testerStatus ? 'Testador' : superCredits.toLocaleString()}
                    </Typography>
                  </Box>
                )}
                {/* Tokens ENGBOT */}
              <Box 
                onClick={() => navigate('/home/token-history')}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  borderRadius: 2, 
                  px: 2, 
                  py: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.2)',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <Typography variant="body2" color="white" fontWeight="bold">
                  🪙 {userTokens.toLocaleString()}
                </Typography>
              </Box>
              </>
            )}
            {!isAuthenticated ? (
              <Typography>
                <Button color="inherit">Login</Button>
              </Typography>
            ) : (
              <IconButton onClick={toggleTheme}>
                {darkMode ? (
                  <Brightness7 />
                ) : (
                  <Brightness4 sx={{ color: "white" }} />
                )}
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
}
