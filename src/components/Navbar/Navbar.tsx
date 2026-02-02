import * as React from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Menu from '@mui/material/Menu'
import Button from '@mui/material/Button'
import { styled } from '@mui/material'

const NEON = '#39FF14'

export const StyledAppBar = styled(AppBar)(() => ({
  background: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
  boxShadow: 'none',
}))

export const StyledNavLink = styled('a')(() => ({
  textDecoration: 'none',
  color: NEON,
  fontWeight: 600,
  textShadow: `0 0 8px ${NEON}`,
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}))

export const StyledLoginButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  color: NEON,
  border: `1px solid ${NEON}`,
  boxShadow: `0 0 8px ${NEON}`,
  transition: theme.transitions.create(['background-color', 'transform'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    backgroundColor: 'rgba(57,255,20,0.1)',
    transform: 'scale(1.05)',
  },
}))

export const StyledMobileToolbar = styled(Toolbar)(({ theme }) => ({
  [theme.breakpoints.up('xs')]: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}))

export const StyledDesktopToolbar = styled(Toolbar)(({ theme }) => ({
  [theme.breakpoints.up('xs')]: {
    display: 'none',
  },
  [theme.breakpoints.up('md')]: {
    display: 'flex',
    justifyContent: 'space-evenly',
  },
}))

// 1) Defina a interface de props:
interface NavbarProps {
  onScrollTo: (id: string) => void
  onLogin: () => void
}

// 2) Use-a no componente:
export default function Navbar({ onScrollTo, onLogin }: NavbarProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  // 3) Funções internas apenas chamam props + fecham o menu
  const handleItemClick = (id: string) => {
    handleClose()
    onScrollTo(id)
  }

  const handleLoginClick = () => {
    handleClose()
    onLogin()
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <StyledAppBar position="absolute">
        {/* Mobile */}
        <StyledMobileToolbar>
          <IconButton
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
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={() => handleItemClick('about')}>
              <StyledNavLink>A Plataforma</StyledNavLink>
            </MenuItem>
            <MenuItem onClick={() => handleItemClick('strategy')}>
              <StyledNavLink>Estratégias</StyledNavLink>
            </MenuItem>
            <MenuItem onClick={() => handleItemClick('plans')}>
              <StyledNavLink>Planos</StyledNavLink>
            </MenuItem>
            <MenuItem onClick={() => handleItemClick('operations')}>
              <StyledNavLink>Operações</StyledNavLink>
            </MenuItem>
            <MenuItem onClick={handleLoginClick}>
              <StyledLoginButton variant="text">LOGIN</StyledLoginButton>
            </MenuItem>
          </Menu>
        </StyledMobileToolbar>

        {/* Desktop */}
        <StyledDesktopToolbar variant="regular">
          <MenuItem onClick={() => handleItemClick('about')}>
            <StyledNavLink>A Plataforma</StyledNavLink>
          </MenuItem>
          <MenuItem onClick={() => handleItemClick('strategy')}>
            <StyledNavLink>Estratégias</StyledNavLink>
          </MenuItem>
          <MenuItem onClick={() => handleItemClick('plans')}>
            <StyledNavLink>Planos</StyledNavLink>
          </MenuItem>
          <MenuItem onClick={() => handleItemClick('operations')}>
            <StyledNavLink>Operações</StyledNavLink>
          </MenuItem>
          <StyledLoginButton onClick={handleLoginClick}>
            LOGIN
          </StyledLoginButton>
        </StyledDesktopToolbar>
      </StyledAppBar>
    </Box>
  )
}
