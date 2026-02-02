import React from 'react';
import { Box, TextField, Typography } from '@mui/material';

export interface IchimokuCloudConfig {
  tenkanPeriod: number;
  kijunPeriod: number;
  senkouSpanBPeriod: number;
  displacement: number;
  tenkanColor: string;
  kijunColor: string;
  senkouSpanAColor: string;
  senkouSpanBColor: string;
  chikouColor: string;
  cloudColor: string;
}

interface IchimokuCloudProps {
  config: IchimokuCloudConfig;
  onConfigChange: (config: IchimokuCloudConfig) => void;
}

const IchimokuCloud: React.FC<IchimokuCloudProps> = ({ config, onConfigChange }) => {
  const handleTenkanPeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const tenkanPeriod = parseInt(event.target.value);
    onConfigChange({ ...config, tenkanPeriod });
  };

  const handleKijunPeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const kijunPeriod = parseInt(event.target.value);
    onConfigChange({ ...config, kijunPeriod });
  };

  const handleSenkouSpanBPeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const senkouSpanBPeriod = parseInt(event.target.value);
    onConfigChange({ ...config, senkouSpanBPeriod });
  };

  const handleDisplacementChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const displacement = parseInt(event.target.value);
    onConfigChange({ ...config, displacement });
  };

  const handleTenkanColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const tenkanColor = event.target.value;
    onConfigChange({ ...config, tenkanColor });
  };

  const handleKijunColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const kijunColor = event.target.value;
    onConfigChange({ ...config, kijunColor });
  };

  const handleSenkouSpanAColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const senkouSpanAColor = event.target.value;
    onConfigChange({ ...config, senkouSpanAColor });
  };

  const handleSenkouSpanBColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const senkouSpanBColor = event.target.value;
    onConfigChange({ ...config, senkouSpanBColor });
  };

  const handleChikouColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const chikouColor = event.target.value;
    onConfigChange({ ...config, chikouColor });
  };

  const handleCloudColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const cloudColor = event.target.value;
    onConfigChange({ ...config, cloudColor });
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, mb: 2, backgroundColor: '#2c2c2c' }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
        Nuvem de Ichimoku
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Período Tenkan"
          type="number"
          value={config.tenkanPeriod}
          onChange={handleTenkanPeriodChange}
          size="small"
          sx={{ 
            minWidth: 120,
            '& .MuiInputBase-root': {
              backgroundColor: '#3c3c3c',
              color: '#fff',
            },
            '& .MuiInputLabel-root': {
              color: '#ccc',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#4caf50',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#555',
              },
              '&:hover fieldset': {
                borderColor: '#777',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4caf50',
              },
            },
          }}
          inputProps={{ min: 1, max: 50 }}
        />
        <TextField
          label="Período Kijun"
          type="number"
          value={config.kijunPeriod}
          onChange={handleKijunPeriodChange}
          size="small"
          sx={{ 
            minWidth: 120,
            '& .MuiInputBase-root': {
              backgroundColor: '#3c3c3c',
              color: '#fff',
            },
            '& .MuiInputLabel-root': {
              color: '#ccc',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#4caf50',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#555',
              },
              '&:hover fieldset': {
                borderColor: '#777',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4caf50',
              },
            },
          }}
          inputProps={{ min: 1, max: 100 }}
        />
        <TextField
          label="Período Senkou B"
          type="number"
          value={config.senkouSpanBPeriod}
          onChange={handleSenkouSpanBPeriodChange}
          size="small"
          sx={{ 
            minWidth: 120,
            '& .MuiInputBase-root': {
              backgroundColor: '#3c3c3c',
              color: '#fff',
            },
            '& .MuiInputLabel-root': {
              color: '#ccc',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#4caf50',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#555',
              },
              '&:hover fieldset': {
                borderColor: '#777',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4caf50',
              },
            },
          }}
          inputProps={{ min: 1, max: 100 }}
        />
        <TextField
          label="Deslocamento"
          type="number"
          value={config.displacement}
          onChange={handleDisplacementChange}
          size="small"
          sx={{ 
            minWidth: 100,
            '& .MuiInputBase-root': {
              backgroundColor: '#3c3c3c',
              color: '#fff',
            },
            '& .MuiInputLabel-root': {
              color: '#ccc',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#4caf50',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#555',
              },
              '&:hover fieldset': {
                borderColor: '#777',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4caf50',
              },
            },
          }}
          inputProps={{ min: 1, max: 100 }}
        />
        <TextField
          label="Cor Tenkan"
          type="color"
          value={config.tenkanColor}
          onChange={handleTenkanColorChange}
          size="small"
          sx={{ 
            minWidth: 100,
            '& .MuiInputBase-root': {
              backgroundColor: '#3c3c3c',
              color: '#fff',
            },
            '& .MuiInputLabel-root': {
              color: '#ccc',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#4caf50',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#555',
              },
              '&:hover fieldset': {
                borderColor: '#777',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4caf50',
              },
            },
          }}
        />
        <TextField
          label="Cor Kijun"
          type="color"
          value={config.kijunColor}
          onChange={handleKijunColorChange}
          size="small"
          sx={{ 
            minWidth: 100,
            '& .MuiInputBase-root': {
              backgroundColor: '#3c3c3c',
              color: '#fff',
            },
            '& .MuiInputLabel-root': {
              color: '#ccc',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#4caf50',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#555',
              },
              '&:hover fieldset': {
                borderColor: '#777',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4caf50',
              },
            },
          }}
        />
        <TextField
          label="Cor Senkou A"
          type="color"
          value={config.senkouSpanAColor}
          onChange={handleSenkouSpanAColorChange}
          size="small"
          sx={{ 
            minWidth: 100,
            '& .MuiInputBase-root': {
              backgroundColor: '#3c3c3c',
              color: '#fff',
            },
            '& .MuiInputLabel-root': {
              color: '#ccc',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#4caf50',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#555',
              },
              '&:hover fieldset': {
                borderColor: '#777',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4caf50',
              },
            },
          }}
        />
        <TextField
          label="Cor Senkou B"
          type="color"
          value={config.senkouSpanBColor}
          onChange={handleSenkouSpanBColorChange}
          size="small"
          sx={{ 
            minWidth: 100,
            '& .MuiInputBase-root': {
              backgroundColor: '#3c3c3c',
              color: '#fff',
            },
            '& .MuiInputLabel-root': {
              color: '#ccc',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#4caf50',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#555',
              },
              '&:hover fieldset': {
                borderColor: '#777',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4caf50',
              },
            },
          }}
        />
        <TextField
          label="Cor Chikou"
          type="color"
          value={config.chikouColor}
          onChange={handleChikouColorChange}
          size="small"
          sx={{ 
            minWidth: 100,
            '& .MuiInputBase-root': {
              backgroundColor: '#3c3c3c',
              color: '#fff',
            },
            '& .MuiInputLabel-root': {
              color: '#ccc',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#4caf50',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#555',
              },
              '&:hover fieldset': {
                borderColor: '#777',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4caf50',
              },
            },
          }}
        />
        <TextField
          label="Cor Nuvem"
          type="color"
          value={config.cloudColor}
          onChange={handleCloudColorChange}
          size="small"
          sx={{ 
            minWidth: 100,
            '& .MuiInputBase-root': {
              backgroundColor: '#3c3c3c',
              color: '#fff',
            },
            '& .MuiInputLabel-root': {
              color: '#ccc',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#4caf50',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#555',
              },
              '&:hover fieldset': {
                borderColor: '#777',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4caf50',
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default IchimokuCloud; 