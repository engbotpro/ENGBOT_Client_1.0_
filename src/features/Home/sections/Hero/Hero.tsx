import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  styled,
  Paper,
  Divider,
  keyframes,
} from "@mui/material";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SpeedIcon from "@mui/icons-material/Speed";
import StyledButton from "../../../../components/StyledButton/StyledButton";
import { useNavigate } from "react-router-dom";

// ** Importe suas imagens **
import PortfolioDesktop from "../../../../assets/images/op.jpg";
//import PortfolioMobile from "../../../../assets/images/portfolio-mobile.png";

const NEON = "#39FF14";

const glowAnimation = keyframes`
  0%, 100% {
    text-shadow: 0 0 10px ${NEON}, 0 0 20px ${NEON}, 0 0 30px ${NEON};
  }
  50% {
    text-shadow: 0 0 20px ${NEON}, 0 0 30px ${NEON}, 0 0 40px ${NEON};
  }
`;

const floatAnimation = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
`;

const StyledHero = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, #0a1419 0%, #1a3a4a 50%, #0f2027 100%)`,
  color: theme.palette.common.white,
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(8),
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(circle at 20% 50%, rgba(57, 255, 20, 0.1) 0%, transparent 50%),
                 radial-gradient(circle at 80% 80%, rgba(57, 255, 20, 0.1) 0%, transparent 50%)`,
    pointerEvents: "none",
  },
  [theme.breakpoints.up("sm")]: {
    paddingTop: theme.spacing(10),
    paddingBottom: theme.spacing(10),
  },
  [theme.breakpoints.up("md")]: {
    paddingTop: theme.spacing(12),
    paddingBottom: theme.spacing(12),
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
  },
}));

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <StyledHero>
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        {/* ---- Painel de operações + título ---- */}
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6} order={{ xs: 2, md: 1 }}>
            <Box position="relative" textAlign="center">
              <Box
                component="img"
                src={PortfolioDesktop}
                alt="Painel Desktop"
                sx={{
                  width: "100%",
                  maxWidth: "600px",
                  borderRadius: 3,
                  boxShadow: `0 0 40px ${NEON}66, 0 0 80px ${NEON}44`,
                  border: `2px solid ${NEON}33`,
                  transition: "transform 0.3s ease",
                  "&:hover": {
                    transform: "scale(1.02)",
                    boxShadow: `0 0 60px ${NEON}88, 0 0 100px ${NEON}66`,
                  },
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6} order={{ xs: 1, md: 2 }}>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontSize: { xs: 32, sm: 42, md: 52 },
                fontWeight: 800,
                color: NEON,
                mb: 3,
                lineHeight: 1.2,
                animation: `${glowAnimation} 3s ease-in-out infinite`,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              OPERAÇÕES DE CRIPTOMOEDAS AUTOMATIZADA
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "rgba(255,255,255,0.9)",
                mb: 4,
                lineHeight: 1.8,
                fontSize: { xs: 16, md: 18 },
              }}
            >
              Personalize seus próprios robôs-traders ou utilize estratégias
              automatizadas pré-configuradas, de forma simples e intuitiva.
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              
             
            </Box>
          </Grid>
        </Grid>

        {/* ---- Cards inferiores ---- */}
        <Grid container spacing={4} mt={8}>
          {/* Card esquerdo */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 4,
                background: `linear-gradient(135deg, rgba(57, 255, 20, 0.05) 0%, rgba(0,0,0,0.8) 100%)`,
                borderRadius: 3,
                height: "100%",
                border: `1px solid ${NEON}33`,
                boxShadow: `0 4px 20px ${NEON}22`,
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: `linear-gradient(90deg, transparent, ${NEON}, transparent)`,
                },
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: `0 8px 30px ${NEON}44`,
                  borderColor: `${NEON}66`,
                },
              }}
              elevation={0}
            >
              {/* Ícone em neon */}
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${NEON}33, ${NEON}11)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 3,
                  boxShadow: `0 0 20px ${NEON}44`,
                }}
              >
                <WorkspacePremiumIcon
                  sx={{
                    fontSize: 32,
                    color: NEON,
                  }}
                />
              </Box>

              {/* Título em neon */}
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  color: NEON,
                  fontWeight: 700,
                  mb: 2,
                  textShadow: `0 0 10px ${NEON}44`,
                }}
              >
                A oportunidade de operações automáticas chegou!
              </Typography>

              {/* Texto secundário */}
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.8 }}>
                Com a EngBot você terá uma plataforma gerenciada por engenheiros
                que utilizam técnicas de IA e estatísticas para te proporcionar
                uma ferramenta única e prática.
              </Typography>
            </Paper>
          </Grid>

          {/* Card direito */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 4,
                background: `linear-gradient(135deg, rgba(57, 255, 20, 0.05) 0%, rgba(0,0,0,0.8) 100%)`,
                borderRadius: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: `1px solid ${NEON}33`,
                boxShadow: `0 4px 20px ${NEON}22`,
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: `linear-gradient(90deg, transparent, ${NEON}, transparent)`,
                },
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: `0 8px 30px ${NEON}44`,
                  borderColor: `${NEON}66`,
                },
              }}
              elevation={0}
            >
              <Box>
                <Box display="flex" alignItems="center" justifyContent="space-around" mb={4}>
                  <Box textAlign="center" flex={1}>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${NEON}33, ${NEON}11)`,
                        mb: 1.5,
                        boxShadow: `0 0 15px ${NEON}44`,
                      }}
                    >
                      <TrendingUpIcon sx={{ color: NEON, fontSize: 28 }} />
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontSize: 36,
                        fontWeight: 800,
                        color: NEON,
                        mb: 1,
                        textShadow: `0 0 10px ${NEON}44`,
                      }}
                    >
                      Crypto
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                      Centenas de negociações em criptomoedas
                    </Typography>
                  </Box>

                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ bgcolor: `${NEON}33`, mx: 2, height: 80 }}
                  />

                  <Box textAlign="center" flex={1}>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${NEON}33, ${NEON}11)`,
                        mb: 1.5,
                        boxShadow: `0 0 15px ${NEON}44`,
                      }}
                    >
                      <SpeedIcon sx={{ color: NEON, fontSize: 28 }} />
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontSize: 36,
                        fontWeight: 800,
                        color: NEON,
                        mb: 1,
                        textShadow: `0 0 10px ${NEON}44`,
                      }}
                    >
                      Performance
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                      Funções de backteste usando estratégias personalizadas com IA
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <StyledButton
                onClick={() => navigate("/login")}
                sx={{
                  width: "100%",
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 700,
                }}
              >
                COMECE AGORA
              </StyledButton>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </StyledHero>
  );
};

export default HeroSection;
