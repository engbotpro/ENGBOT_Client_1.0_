import React, { useState } from 'react';
import { Box, TextField, Typography, Button, Alert } from '@mui/material';

export interface ElliottConfig {
  wave1?: { price: number; index: number };
  wave2?: { price: number; index: number };
  wave3?: { price: number; index: number };
  wave4?: { price: number; index: number };
  wave5?: { price: number; index: number };
  waveA?: { price: number; index: number };
  waveB?: { price: number; index: number };
  waveC?: { price: number; index: number };
  color: string;
  lineWidth: number;
  showLabels: boolean;
}

interface ElliottProps {
  config: ElliottConfig;
  onConfigChange: (config: ElliottConfig) => void;
  onSelectPoints?: (mode: 'selecting' | null) => void;
}

const Elliott: React.FC<ElliottProps> = ({ config, onConfigChange, onSelectPoints }) => {
  const [isSelecting, setIsSelecting] = useState(false);

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...config, color: event.target.value });
  };

  const handleLineWidthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const lineWidth = parseInt(event.target.value);
    onConfigChange({ ...config, lineWidth });
  };

  const handleShowLabelsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...config, showLabels: event.target.checked });
  };

  const handleSelectPoints = () => {
    setIsSelecting(true);
    onSelectPoints?.('selecting');
  };

  const handleCancelSelection = () => {
    setIsSelecting(false);
    onSelectPoints?.(null);
  };

  const getCompletedWaves = () => {
    let count = 0;
    if (config.wave1) count++;
    if (config.wave2) count++;
    if (config.wave3) count++;
    if (config.wave4) count++;
    if (config.wave5) count++;
    return count;
  };

  const totalWaves = 5;
  const completedWaves = getCompletedWaves();

  return (
    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, mb: 2, backgroundColor: '#2c2c2c' }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
        Ondas de Elliott
      </Typography>
      
      {completedWaves < totalWaves ? (
        <Alert severity="info" sx={{ mb: 2, backgroundColor: '#3c3c3c', color: '#fff' }}>
          Selecione {totalWaves - completedWaves} ponto(s) no gráfico para completar as 5 ondas impulsivas.
          <br />
          Progresso: {completedWaves}/{totalWaves} ondas
        </Alert>
      ) : (
        <Box sx={{ mb: 2, p: 1, backgroundColor: '#3c3c3c', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
            Ondas Impulsivas (1-5) completas
          </Typography>
          {(config.waveA || config.waveB || config.waveC) && (
            <Typography variant="body2" sx={{ color: '#fff' }}>
              Ondas Corretivas (A-B-C) opcionais
            </Typography>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Button
          variant={isSelecting ? 'contained' : 'outlined'}
          color={isSelecting ? 'error' : 'primary'}
          onClick={isSelecting ? handleCancelSelection : handleSelectPoints}
          size="small"
        >
          {isSelecting ? 'Cancelar Seleção' : 'Reiniciar Seleção'}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Cor das Linhas"
          type="color"
          value={config.color}
          onChange={handleColorChange}
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
          label="Espessura"
          type="number"
          value={config.lineWidth}
          onChange={handleLineWidthChange}
          size="small"
          inputProps={{ min: 1, max: 5 }}
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

export default Elliott;
