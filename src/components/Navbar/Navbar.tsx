import * as React from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Menu from '@mui/material/Menu'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material'

const NEON = '#39FF14'
const MUTED = '#A8B8B9'

export const StyledAppBar = styled(AppBar)(() => ({
  background: 'rgba(6, 18, 22, 0.82)',
  backdropFilter: 'blur(18px)',
  borderBottom: '1px solid rgba(57, 255, 20, 0.12)',
  boxShadow: 'none',
}))

export const StyledNavLink = styled('span')(() => ({
  color: MUTED,
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  transition: 'color 0.2s ease',
  '&:hover': {
    color: NEON,
  },
}))

export const StyledLoginButton = styled(Button)(() => ({
  textTransform: 'none',
  color: NEON,
  fontWeight: 900,
  borderRadius: 999,
  border: '1px solid rgba(57, 255, 20, 0.35)',
  backgroundColor: 'rgba(57, 255, 20, 0.12)',
  '&:hover': {
    backgroundColor: 'rgba(57, 255, 20, 0.18)',
  },
}))

const navItems = [
  { id: 'recursos', label: 'Recursos' },
  { id: 'operacoes', label: 'Operações' },
  { id: 'app', label: 'Telas' },
]

interface NavbarProps {
  onScrollTo: (id: string) => void
  onLogin: () => void
}

export default function Navbar({ onScrollTo, onLogin }: NavbarProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleItemClick = (id: string) => {
    handleClose()
    onScrollTo(id)
  }

  const handleLoginClick = () => {
    handleClose()
    onLogin()
  }

  const brand = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 'auto' }}>
      <Box
        component="img"
        src="/landing/logoatual.png"
        alt="EB Finance"
        sx={{ width: { xs: 44, md: 52 }, height: { xs: 44, md: 52 } }}
      />
      <Typography
        sx={{
          color: NEON,
          fontWeight: 900,
          fontSize: { xs: '1.1rem', md: '1.25rem' },
          letterSpacing: '-0.02em',
        }}
      >
        EB Finance
      </Typography>
    </Box>
  )

  return (
    <Box sx={{ flexGrow: 1 }}>
      <StyledAppBar position="fixed">
        <Toolbar sx={{ maxWidth: 1120, width: '100%', mx: 'auto', px: { xs: 2, md: 3 } }}>
          {brand}

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2.5 }}>
            {navItems.map((item) => (
              <StyledNavLink key={item.id} onClick={() => onScrollTo(item.id)}>
                {item.label}
              </StyledNavLink>
            ))}
            <StyledLoginButton onClick={onLogin}>Entrar</StyledLoginButton>
          </Box>

          <IconButton
            sx={{ display: { xs: 'inline-flex', md: 'none' }, ml: 'auto' }}
            size="large"
            aria-label="menu mobile"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <MenuIcon sx={{ color: NEON }} />
          </IconButton>

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                bgcolor: '#0d252d',
                border: '1px solid rgba(57, 255, 20, 0.22)',
                mt: 1,
              },
            }}
          >
            {navItems.map((item) => (
              <MenuItem key={item.id} onClick={() => handleItemClick(item.id)}>
                <StyledNavLink>{item.label}</StyledNavLink>
              </MenuItem>
            ))}
            <MenuItem onClick={handleLoginClick}>
              <StyledLoginButton variant="text" fullWidth>
                Entrar
              </StyledLoginButton>
            </MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>
    </Box>
  )
}
