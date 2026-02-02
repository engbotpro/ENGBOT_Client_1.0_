import React from 'react';
import { Box, List, ListItemButton, ListItemText, Typography } from '@mui/material';

const pairs = [
  '1000CAT/USDT', '1000CHEEMS/USDT', '1000SATS/USDT',
  '1INCH/USDT', '1MBABYDOGE/USDT', 'AAVE/USDT',
  // …e por aí vai
];

const TokenPairList: React.FC = () => (
  <Box sx={{ bgcolor: 'background.paper', height: '100%', p: 1, borderRadius: 1, overflowY: 'auto' }}>
    <Typography variant="subtitle1" gutterBottom>USDT Market</Typography>
    <List dense>
      {pairs.map(pair => (
        <ListItemButton key={pair}>
          <ListItemText primary={pair} />
        </ListItemButton>
      ))}
    </List>
  </Box>
);

export default TokenPairList;
