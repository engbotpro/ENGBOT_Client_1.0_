import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { Settings as SettingsIcon, Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { type IndicatorType, type IndicatorConfig } from './indicators';
import IndicatorModal from './IndicatorModal';
import {
  getUserIndicators,
  createIndicator,
  updateIndicator,
  deleteIndicator,
  convertDbIndicatorsToFrontend,
  convertFrontendIndicatorsToDb,
} from '../../services/technicalIndicatorAPI';

interface MultiIndicatorSelectorProps {
  indicators: IndicatorConfig[];
  onIndicatorsChange: (indicators: IndicatorConfig[]) => void;
  onFibonacciSelectMode?: (indicatorIndex: number, mode: 'selecting' | null) => void;
}

const MultiIndicatorSelector: React.FC<MultiIndicatorSelectorProps> = ({
  indicators,
  onIndicatorsChange,
  onFibonacciSelectMode,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndicatorForModal, setSelectedIndicatorForModal] = useState<IndicatorConfig | null>(null);
  const [addIndicatorModalOpen, setAddIndicatorModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbIndicators, setDbIndicators] = useState<any[]>([]);

  // Carregar indicadores do banco de dados
  useEffect(() => {
    const loadIndicators = async () => {
      try {
        setLoading(true);
        
        // Aguardar um pouco para o token estar disponível
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const dbIndicators = await getUserIndicators();
        setDbIndicators(dbIndicators);
        const frontendIndicators = convertDbIndicatorsToFrontend(dbIndicators);
        // Só atualizar se não houver indicadores já carregados
        if (indicators.length === 0) {
          onIndicatorsChange(frontendIndicators);
        }
      } catch (error) {
        console.log('Erro ao carregar indicadores do banco, usando modo local:', error instanceof Error ? error.message : String(error));
        // Se não conseguir carregar do banco, usar modo local
        setDbIndicators([]);
        // Não alterar os indicadores locais se já existirem
      } finally {
        setLoading(false);
      }
    };

    loadIndicators();
  }, []); // Remover onIndicatorsChange da dependência para evitar loop

  const getDefaultConfig = (type: IndicatorType): IndicatorConfig => {
    switch (type) {
      case 'moving_average':
        return {
          type,
          movingAverage: {
            period: 20,
            type: 'simple' as const,
            color: '#ff6b6b',
          },
        };
      case 'bollinger_bands':
        return {
          type,
          bollingerBands: {
            period: 20,
            standardDeviation: 2,
            upperColor: '#ff6b6b',
            lowerColor: '#4ecdc4',
            middleColor: '#45b7d1',
          },
        };
      case 'macd':
        return {
          type,
          macd: {
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            macdColor: '#ff6b6b',
            signalColor: '#4ecdc4',
            histogramColor: '#45b7d1',
          },
        };
      case 'ichimoku_cloud':
        return {
          type,
          ichimokuCloud: {
            tenkanPeriod: 9,
            kijunPeriod: 26,
            senkouSpanBPeriod: 52,
            displacement: 26,
            tenkanColor: '#ff6b6b',
            kijunColor: '#4ecdc4',
            senkouSpanAColor: '#45b7d1',
            senkouSpanBColor: '#96ceb4',
            chikouColor: '#feca57',
            cloudColor: '#ff9ff3',
          },
        };
      case 'stochastic_oscillator':
        return {
          type,
          stochasticOscillator: {
            kPeriod: 14,
            dPeriod: 3,
            slowing: 3,
            overbought: 80,
            oversold: 20,
            kColor: '#ff6b6b',
            dColor: '#4ecdc4',
            overboughtColor: '#ff9ff3',
            oversoldColor: '#54a0ff',
          },
        };
      case 'rsi':
        return {
          type,
          rsi: {
            period: 14,
            overbought: 70,
            oversold: 30,
            color: '#ff6b6b',
            overboughtColor: '#ff9ff3',
            oversoldColor: '#54a0ff',
          },
        };
      case 'hilo':
        return {
          type,
          hilo: {
            period: 20,
            multiplier: 2,
          },
        };
      case 'williamsr':
        return {
          type,
          williamsr: {
            period: 14,
            overbought: -20,
            oversold: -80,
          },
        };
      case 'cci':
        return {
          type,
          cci: {
            period: 20,
            overbought: 100,
            oversold: -100,
          },
        };
      case 'adx':
        return {
          type,
          adx: {
            period: 14,
            threshold: 25,
          },
        };
      case 'atr':
        return {
          type,
          atr: {
            period: 14,
          },
        };
      case 'parabolic_sar':
        return {
          type,
          parabolicSAR: {
            acceleration: 0.02,
            maximum: 0.2,
          },
        };
      case 'obv':
        return {
          type,
          obv: {
            period: 14,
          },
        };
      case 'volume':
        return {
          type,
          volume: {
            period: 20,
          },
        };
      case 'wma':
        return {
          type,
          wma: {
            period: 20,
          },
        };
      case 'hma':
        return {
          type,
          hma: {
            period: 20,
          },
        };
      case 'fibonacci':
        return {
          type,
          fibonacci: {
            color: '#9c27b0',
            lineWidth: 1,
            showLabels: true,
            levels: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0],
          },
        };
      case 'elliott':
        return {
          type,
          elliott: {
            color: '#ff9800',
            lineWidth: 2,
            showLabels: true,
          },
        };
      default:
        return { type: 'moving_average' };
    }
  };

  const handleAddIndicator = async (newType: IndicatorType) => {
    if (newType) {
      try {
        setLoading(true);
        const newConfig = getDefaultConfig(newType);
        
        // Adicionar ao array local primeiro
        const updatedIndicators = [...indicators, newConfig];
        onIndicatorsChange(updatedIndicators);
        
        // Tentar salvar no banco
        try {
          const dbConfig = convertFrontendIndicatorsToDb([newConfig])[0];
          const createdIndicator = await createIndicator(newType, dbConfig.config);
          setDbIndicators(prev => [...prev, createdIndicator]);
        } catch (dbError) {
          console.log('Erro ao salvar no banco, mantendo apenas local:', dbError);
          // Criar um ID temporário para indicadores locais
          const tempIndicator = {
            id: `temp-${Date.now()}`,
            type: newType,
            config: newConfig,
            order: dbIndicators.length,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setDbIndicators(prev => [...prev, tempIndicator]);
        }
        
        // Fechar o modal após adicionar
        setAddIndicatorModalOpen(false);
      } catch (error) {
        console.error('Erro ao criar indicador:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemoveIndicator = async (index: number) => {
    try {
      console.log('Removendo indicador no índice:', index);
      console.log('DB indicators:', dbIndicators);
      console.log('Frontend indicators:', indicators);
      
      const indicatorToRemove = dbIndicators[index];
      console.log('Indicador a remover:', indicatorToRemove);
      
      if (indicatorToRemove) {
        // Tentar deletar do banco se não for um indicador temporário
        if (!indicatorToRemove.id.startsWith('temp-')) {
          try {
            await deleteIndicator(indicatorToRemove.id);
          } catch (dbError) {
            console.warn('Erro ao deletar do banco, removendo apenas local:', dbError);
          }
        }
        
        const newDbIndicators = dbIndicators.filter((_, i) => i !== index);
        setDbIndicators(newDbIndicators);
        
        const newIndicators = indicators.filter((_, i) => i !== index);
        onIndicatorsChange(newIndicators);
        
        console.log('Indicador removido com sucesso');
      } else {
        console.error('Indicador não encontrado no índice:', index);
        // Remover apenas do frontend se não encontrar no banco
        const newIndicators = indicators.filter((_, i) => i !== index);
        onIndicatorsChange(newIndicators);
      }
    } catch (error) {
      console.error('Erro ao remover indicador:', error);
      // Remover apenas do frontend em caso de erro
      const newIndicators = indicators.filter((_, i) => i !== index);
      onIndicatorsChange(newIndicators);
    }
  };

  const handleOpenModal = (indicator: IndicatorConfig) => {
    console.log('=== handleOpenModal chamado ===');
    console.log('Indicator:', indicator);
    console.log('Indicators atuais:', indicators);
    
    // Encontrar o indicador atual no array
    const currentIndex = indicators.findIndex(ind => 
      ind.type === indicator.type && 
      JSON.stringify(ind) === JSON.stringify(indicator)
    );
    
    if (currentIndex !== -1) {
      console.log('Indicador encontrado no índice:', currentIndex);
      setSelectedIndicatorForModal(indicators[currentIndex]);
    } else {
      console.log('Indicador não encontrado, usando o fornecido');
      setSelectedIndicatorForModal(indicator);
    }
    
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedIndicatorForModal(null);
  };

  const handleConfigChange = async (updatedConfig: IndicatorConfig) => {
    try {
      console.log('=== handleConfigChange chamado ===');
      console.log('selectedIndicatorForModal:', selectedIndicatorForModal);
      console.log('indicators:', indicators);
      
      // Encontrar o índice do indicador selecionado
      let index = -1;
      
      if (selectedIndicatorForModal) {
        // Primeiro tentar encontrar por comparação exata
        index = indicators.findIndex(ind => 
          ind.type === selectedIndicatorForModal.type && 
          JSON.stringify(ind) === JSON.stringify(selectedIndicatorForModal)
        );
        
        console.log('Índice por comparação exata:', index);
        
        // Se não encontrar, tentar encontrar pelo tipo
        if (index === -1) {
          index = indicators.findIndex(ind => ind.type === selectedIndicatorForModal.type);
          console.log('Índice por tipo:', index);
        }
        
        // Se ainda não encontrar, usar o primeiro indicador do mesmo tipo
        if (index === -1) {
          const sameTypeIndicators = indicators.filter(ind => ind.type === selectedIndicatorForModal.type);
          if (sameTypeIndicators.length > 0) {
            index = indicators.indexOf(sameTypeIndicators[0]);
            console.log('Usando primeiro indicador do mesmo tipo, índice:', index);
          }
        }
      }
      
      console.log('Índice final:', index);
      console.log('Updated config:', updatedConfig);
      
      if (index !== -1) {
        console.log('Atualizando indicador no índice:', index);
        
        // Atualizar o indicador específico no array
        const newIndicators = [...indicators];
        newIndicators[index] = updatedConfig;
        console.log('Novos indicadores:', newIndicators);
        
        // Atualizar também o selectedIndicatorForModal para que o modal reflita as mudanças
        setSelectedIndicatorForModal(updatedConfig);
        
        // Atualizar os indicadores imediatamente
        onIndicatorsChange(newIndicators);
        console.log('onIndicatorsChange chamado');
        
        // Tentar atualizar no banco se houver indicador no banco
        const dbIndicator = dbIndicators[index];
        if (dbIndicator && !dbIndicator.id.startsWith('temp-')) {
          try {
            let configToUpdate: any;
            
            switch (updatedConfig.type) {
              case 'moving_average':
                configToUpdate = updatedConfig.movingAverage;
                break;
              case 'bollinger_bands':
                configToUpdate = updatedConfig.bollingerBands;
                break;
              case 'macd':
                configToUpdate = updatedConfig.macd;
                break;
              case 'ichimoku_cloud':
                configToUpdate = updatedConfig.ichimokuCloud;
                break;
              case 'stochastic_oscillator':
                configToUpdate = updatedConfig.stochasticOscillator;
                break;
              case 'rsi':
                configToUpdate = updatedConfig.rsi;
                break;
              case 'hilo':
                configToUpdate = updatedConfig.hilo;
                break;
              case 'williamsr':
                configToUpdate = updatedConfig.williamsr;
                break;
              case 'cci':
                configToUpdate = updatedConfig.cci;
                break;
              case 'adx':
                configToUpdate = updatedConfig.adx;
                break;
              case 'atr':
                configToUpdate = updatedConfig.atr;
                break;
              case 'parabolic_sar':
                configToUpdate = updatedConfig.parabolicSAR;
                break;
              case 'obv':
                configToUpdate = updatedConfig.obv;
                break;
              case 'volume':
                configToUpdate = updatedConfig.volume;
                break;
              case 'wma':
                configToUpdate = updatedConfig.wma;
                break;
              case 'hma':
                configToUpdate = updatedConfig.hma;
                break;
              default:
                configToUpdate = updatedConfig.movingAverage || updatedConfig.wma || updatedConfig.hma;
            }
            
            console.log('Config to update:', configToUpdate);
            await updateIndicator(dbIndicator.id, configToUpdate);
          } catch (dbError) {
            console.warn('Erro ao atualizar no banco, mantendo apenas local:', dbError);
          }
        } else {
          console.log('Indicador não encontrado no banco ou é temporário');
        }
      } else {
        console.error('Indicador não encontrado para atualização');
        // Como fallback, adicionar o novo indicador
        const newIndicators = [...indicators, updatedConfig];
        onIndicatorsChange(newIndicators);
      }
    } catch (error) {
      console.error('Erro ao atualizar indicador:', error);
    }
  };

  const handleDeleteIndicator = async () => {
    if (selectedIndicatorForModal) {
      try {
        // Encontrar o índice do indicador selecionado usando o tipo
        let index = indicators.findIndex(ind => 
          ind.type === selectedIndicatorForModal?.type && 
          JSON.stringify(ind) === JSON.stringify(selectedIndicatorForModal)
        );
        
        // Se não encontrar por comparação exata, tentar encontrar pelo tipo
        if (index === -1) {
          index = indicators.findIndex(ind => ind.type === selectedIndicatorForModal?.type);
        }
        
        if (index !== -1) {
          const dbIndicator = dbIndicators[index];
          if (dbIndicator) {
            await deleteIndicator(dbIndicator.id);
            
            const newDbIndicators = dbIndicators.filter((_, i) => i !== index);
            setDbIndicators(newDbIndicators);
            
            const newIndicators = indicators.filter((_, i) => i !== index);
            onIndicatorsChange(newIndicators);
          }
        }
        handleCloseModal();
      } catch (error) {
        console.error('Erro ao deletar indicador:', error);
      }
    }
  };

  const getIndicatorName = (type: IndicatorType): string => {
    switch (type) {
      case 'moving_average':
        return 'Média Móvel';
      case 'bollinger_bands':
        return 'Bandas de Bollinger';
      case 'macd':
        return 'MACD';
      case 'ichimoku_cloud':
        return 'Nuvem de Ichimoku';
      case 'stochastic_oscillator':
        return 'Oscilador Estocástico';
      case 'rsi':
        return 'RSI';
      case 'hilo':
        return 'HILO';
      case 'williamsr':
        return 'Williams %R';
      case 'cci':
        return 'CCI';
      case 'adx':
        return 'ADX';
      case 'atr':
        return 'ATR';
      case 'parabolic_sar':
        return 'Parabolic SAR';
      case 'obv':
        return 'OBV';
      case 'volume':
        return 'Volume';
      case 'wma':
        return 'WMA';
      case 'hma':
        return 'HMA';
      case 'fibonacci':
        return 'Fibonacci Retracement';
      case 'elliott':
        return 'Ondas de Elliott';
      default:
        return 'Indicador';
    }
  };

  const getAllIndicators = (): IndicatorType[] => {
    return [
      'moving_average',
      'wma',
      'hma',
      'bollinger_bands',
      'macd',
      'ichimoku_cloud',
      'stochastic_oscillator',
      'rsi',
      'hilo',
      'williamsr',
      'cci',
      'adx',
      'atr',
      'parabolic_sar',
      'obv',
      'volume',
      'fibonacci',
      'elliott',
    ];
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {loading && (
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          right: 0, 
          zIndex: 1,
          display: 'flex',
          alignItems: 'center'
        }}>
          <CircularProgress size={20} />
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setAddIndicatorModalOpen(true)}
            disabled={loading}
          sx={{
            minWidth: 180,
            textTransform: 'none',
          }}
        >
          Adicionar Indicador
        </Button>
        {indicators.map((indicator, index) => (
          <Chip
            key={`${indicator.type}-${index}`}
            label={getIndicatorName(indicator.type)}
            onDelete={() => {}} // Remover o onDelete padrão do Chip
            deleteIcon={
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Configurar">
                  <span>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleOpenModal(indicator);
                      }}
                      disabled={loading}
                      sx={{ color: '#fff' }}
                    >
                      <SettingsIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Remover">
                  <span>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleRemoveIndicator(index);
                      }}
                      disabled={loading}
                      sx={{ color: '#ff4444' }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            }
            disabled={loading}
            sx={{
              backgroundColor: '#2c3e50',
              color: '#fff',
              '& .MuiChip-deleteIcon': {
                color: '#fff',
              },
              '&:hover': {
                backgroundColor: '#34495e',
              },
            }}
          />
        ))}
      </Box>

      <IndicatorModal
        open={modalOpen}
        onClose={handleCloseModal}
        indicatorConfig={selectedIndicatorForModal}
        onConfigChange={handleConfigChange}
        onFibonacciSelectMode={(mode) => {
          if (selectedIndicatorForModal) {
            const index = indicators.findIndex(ind => 
              ind.type === selectedIndicatorForModal.type && 
              JSON.stringify(ind) === JSON.stringify(selectedIndicatorForModal)
            );
            if (index !== -1) {
              onFibonacciSelectMode?.(index, mode);
            }
          }
        }}
      />

      {/* Modal para adicionar indicador */}
      <Dialog
        open={addIndicatorModalOpen}
        onClose={() => setAddIndicatorModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon />
            <Typography variant="h6">Adicionar Indicador</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {getAllIndicators().map((type: IndicatorType) => {
              // Verificar se o indicador já foi adicionado
              const isAlreadyAdded = indicators.some(ind => ind.type === type);
              
              return (
                <ListItem key={type} disablePadding>
                  <ListItemButton
                    onClick={() => handleAddIndicator(type)}
                    disabled={loading || isAlreadyAdded}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      opacity: isAlreadyAdded ? 0.6 : 1,
                    }}
                  >
                    <ListItemText
                      primary={getIndicatorName(type)}
                      secondary={isAlreadyAdded ? 'Já adicionado' : 'Clique para adicionar'}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddIndicatorModalOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MultiIndicatorSelector; 