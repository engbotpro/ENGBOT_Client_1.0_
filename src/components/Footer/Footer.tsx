import { Box, Container, IconButton, Typography, styled } from "@mui/material"
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';

const NEON = '#39FF14';

const StyledFooter = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, #0a1419 0%, #1a3a4a 50%, #0f2027 100%)`,
  borderTop: `1px solid ${NEON}33`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: `linear-gradient(90deg, transparent, ${NEON}, transparent)`,
  },
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: 'rgba(255,255,255,0.7)',
  border: `1px solid ${NEON}33`,
  transition: 'all 0.3s ease',
  '&:hover': {
    color: NEON,
    borderColor: NEON,
    backgroundColor: `${NEON}11`,
    transform: 'translateY(-3px) scale(1.1)',
    boxShadow: `0 4px 15px ${NEON}66`,
  },
}));

const Footer: React.FC = () => {

    return (
        <StyledFooter pt={4} pb={4}>
            <Container maxWidth="lg">
                <Box 
                    display="flex" 
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    alignItems="center" 
                    justifyContent="space-between"
                    gap={3}
                >
                    <Typography 
                        textAlign="center"
                        sx={{
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '0.95rem',
                            fontWeight: 300,
                        }}
                    >
                        © 2025 ENG BOT - All rights reserved
                    </Typography>
                    <Box 
                        display="flex" 
                        alignItems="center" 
                        gap={2}
                    >
                        <StyledIconButton 
                            onClick={() => window.open("https://github.com/AdrianaSaty")}
                            size="large"
                        >
                            <GitHubIcon />
                        </StyledIconButton>
                        <StyledIconButton 
                            onClick={() => window.open("https://www.linkedin.com/in/adriana-saty/")}
                            size="large"
                        >
                            <LinkedInIcon />
                        </StyledIconButton>
                        <StyledIconButton 
                            href="mailto:example@example.com" 
                            target="_blank"
                            size="large"
                        >
                            <EmailIcon />
                        </StyledIconButton>
                    </Box>
                </Box>
            </Container>
        </StyledFooter>
    )
}

export default Footer