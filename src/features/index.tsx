import NavBar from "../components/NavBar";
import * as React from "react";
import { useEffect, useState } from "react";
import { styled, Theme, CSSObject } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { Info, Logout, PeopleAlt, Lock, BugReport } from "@mui/icons-material";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Avatar, Tooltip, Typography, CircularProgress } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { logout } from "./auth/authSlice";
import usePersistence from "../hooks/usePersistence";
import CalculateIcon from '@mui/icons-material/Calculate';
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart';
import SupportIcon from '@mui/icons-material/Support';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import HistoryIcon from '@mui/icons-material/History';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ChatIcon from '@mui/icons-material/Chat';
import TermsModal from "../components/TermsModal/TermsModal";
import { useCheckTermsAcceptedQuery } from "./users/userAPI";


const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

export default function PersistentDrawerLeft() {

  const { user } = useSelector((state: RootState) => state.auth); 
  
  const [classyear, setClassyear] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const [open, setOpen] = React.useState(false);
  const [dark, setDark] = usePersistence<boolean>('darkState', false);
  const navigate = useNavigate();
  const location = useLocation();
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Verificar aceite de termos via API
  const { data: termsData, isLoading: isLoadingTerms } = useCheckTermsAcceptedQuery(undefined, {
    skip: !user?.id,
  });

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // Verificar se é o primeiro acesso e se os termos foram aceitos
  // Só mostrar o modal se não estivermos na página About (que tem seu próprio modal)
  useEffect(() => {
    if (user && user.id && !isLoadingTerms && termsData) {
      // Não mostrar modal se estiver na página About (que tem seu próprio botão de termos)
      if (!termsData.termsAccepted && !location.pathname.includes('/about')) {
        setShowTermsModal(true);
      } else {
        setShowTermsModal(false);
      }
    }
  }, [user, termsData, isLoadingTerms, location.pathname]);

  // Função para lidar com a navegação com carregamento
  const handleNavigation = (link: string) => {
    setLoading(true); // Ativa o símbolo de carregamento

    // Aguarda um pequeno atraso antes de navegar
    setTimeout(() => {
      navigate(link);
      setLoading(false); // Desativa o carregamento após a navegação
    }, 300); // Atraso de 300ms para garantir transição suave
  };

  const linksInfo = [


    ...(
      (user?.perfil === 'Admin' || user?.perfil === 'usuario')
        ? [{
            title: 'Gráfico',
            icon: <CandlestickChartIcon />,
            link: 'tradingPage',
          }]
        : []
    ),

    ...(user?.perfil === 'Admin' || user?.perfil === 'usuario'
      ? [{
          title: 'Carteira',
          icon: <AccountBalanceWalletIcon />,
          link: 'wallet',
        }]
      : []),

    ...(user?.perfil === 'Admin' || user?.perfil === 'usuario'
      ? [{
          title: 'Robôs',
          icon: <SmartToyIcon />,
          link: 'bots',
        }]
      : []),
    
    // Desafio
    ...(user?.perfil === 'Admin' || user?.perfil === 'usuario'
      ? [{
          title: 'Desafio',
          icon: <EmojiEventsIcon />,
          link: 'challenge',
        }]
      : []),
    
    // Histórico
    ...(user?.perfil === 'Admin' || user?.perfil === 'usuario'
      ? [{
          title: 'Histórico',
          icon: <HistoryIcon />,
          link: 'historical',
        }]
      : []),
    
    // BackTest
    ...(user?.perfil === 'Admin' || user?.perfil === 'usuario'
      ? [{
          title: 'BackTest',
          icon: <QueryStatsIcon />,
          link: 'backTest',
        }]
      : []),
    
   
    
    // Planos
    ...(user?.perfil === 'Admin' || user?.perfil === 'usuario'
      ? [{
          title: 'Planos',
          icon: <AttachMoneyIcon />,
          link: 'payment',
        }]
      : []),
    
    // Calculadora
    ...(user?.perfil === 'Admin' || user?.perfil === 'usuario'
      ? [{
          title: 'Calculadora',
          icon: <CalculateIcon />,
          link: 'calculate',
        }]
      : []),

    // Chat
    ...(user?.perfil === 'Admin' || user?.perfil === 'usuario'
      ? [{
          title: 'Chat',
          icon: <ChatIcon />,
          link: 'chat',
        }]
      : []),

       // Usuários
    ...(user?.perfil === 'Admin' 
      ? [{
          title: 'Usuários',
          icon: <PeopleAlt />,
          link: 'users',
        }]
      : []),

    // Dashboard de Usuários
    ...(user?.perfil === 'Admin' 
      ? [{
          title: 'Dashboard',
          icon: <DashboardIcon />,
          link: 'usersDashboard',
        }]
      : []),

    // Aprovação de Testadores
    ...(user?.perfil === 'Admin' 
      ? [{
          title: 'Aprovar Testadores',
          icon: <BugReport />,
          link: 'admin/tester-approval',
        }]
      : []),
   
    

    {
      title: "Alterar Senha",
      icon: <Lock />,
      link: "ChangePasswordAlt",
    }, 
    {
      title: "Sobre",
      icon: <Info />,
      link: "about",
    },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <NavBar open={open} setOpen={handleDrawerOpen} />
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {linksInfo.map((info) => (
            <ListItem key={info.link} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                onClick={() => handleNavigation("/home/" + info.link)} // Usa handleNavigation para navegar
                sx={{
                  minHeight: 48,
                  justifyContent: open ? "initial" : "center",
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : "auto",
                    justifyContent: "center",
                  }}
                >
                  {info.icon}
                </ListItemIcon>
                <ListItemText
                  primary={info.title}
                  sx={{ opacity: open ? 1 : 0 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <Box sx={{ mx: "auto", mt: 3, mb: 1 }}>
          <Tooltip title={user?.name || ""}>
            <Avatar
              src={user?.foto}
              {...(open && { sx: { width: 100, height: 100 } })}
            />
          </Tooltip>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body2">
            {user?.perfil}
          </Typography>
          {open && (
            <>
              <Typography>{user?.name}</Typography>
            </>
          )}
          <Tooltip title="Logout" sx={{ mt: 1 }}>
            <IconButton onClick={handleLogout}>
              <Logout />
            </IconButton>
          </Tooltip>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1 }}>
        <DrawerHeader />
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
            <CircularProgress />
          </Box>
        ) : (
          <Outlet />
        )}
      </Box>
      
      {/* Modal de Termos de Uso - Primeiro Acesso */}
      <TermsModal
        open={showTermsModal}
        onAccept={() => {
          setShowTermsModal(false);
        }}
        readOnly={true}
      />
    </Box>
  );
}
