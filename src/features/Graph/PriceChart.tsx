// src/components/PriceChart.tsx
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  MouseEvent,
} from 'react';
import {
  Box,
  Paper,
  Select,
  MenuItem,
  IconButton,
  useTheme,
  Typography,
} from '@mui/material';
import GridOnIcon from '@mui/icons-material/GridOn';
import GridOffIcon from '@mui/icons-material/GridOff';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { fetchKlines, Candle } from '../../services/binanceAPI';
import MultiIndicatorSelector from './MultiIndicatorSelector';
import { type IndicatorConfig } from './indicators';
import {
  calculateMovingAverage,
  calculateBollingerBands,
  calculateMACD,
  calculateIchimokuCloud,
  calculateStochasticOscillator,
  calculateRSI,
  calculateHILO,
  calculateWilliamsR,
  calculateCCI,
  calculateADX,
  calculateATR,
  calculateParabolicSAR,
  calculateOBV,
  calculateVolume,
  calculateWMA,
  calculateHMA,
} from './indicators/calculations';
import { tradingAPI, type Position } from '../../services/tradingAPI';
import PositionsPanel from './PositionsPanel';
import { useLocalStorage } from '../../hooks/usePersistence';

interface PriceChartProps {
  symbol?: string;
  onPriceUpdate?: (price: number) => void;
  positions?: Position[];
  onPositionUpdated?: (positions: Position[]) => void;
  isLoadingPositions?: boolean;
}

const PriceChart: React.FC<PriceChartProps> = ({ 
  symbol = 'BTCUSDT', 
  onPriceUpdate,
  positions: externalPositions,
  onPositionUpdated,
  isLoadingPositions = false
}): JSX.Element => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  const Y_AXIS_WIDTH = 80;
  const margin = { top: 10, right: 10, bottom: 30, left: Y_AXIS_WIDTH };

  // raw data
  const [data, setData] = useState<Candle[]>([]);
  // loading ref to prevent multiple simultaneous calls
  const isLoadingRef = useRef(false);
  // ref to track last price to avoid unnecessary updates
  const lastPriceRef = useRef<number | null>(null);
  // ref to track last candle data to detect changes in high/low
  const lastCandleDataRef = useRef<{ high: number; low: number; close: number; time: number } | null>(null);
  // how many candles to show at once
  const [displayCount, setDisplayCount] = useState(100);
  // current left‐hand index into `data`
  const [xOffset, setXOffset] = useState(0);
  // for wheel‐drag panning
  const [isPanning, setIsPanning] = useState(false);
  const panStartX = useRef(0);
  const panStartOffset = useRef(0);
  
  // Vertical zoom state
  const [yZoom, setYZoom] = useState(1);
  
  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  // Loading state for zoom processing
  const [isZoomProcessing, setIsZoomProcessing] = useState(false);
  const zoomLoadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDrawingRef = useRef(false);
  // Debounce zoom updates
  const zoomAnimationFrameRef = useRef<number | null>(null);
  const pendingZoomUpdateRef = useRef<{
    zoomLevel: number;
    displayCount: number;
    xOffset: number;
  } | null>(null);
  const zoomStartTimeRef = useRef<number | null>(null);

  const [interval, setIntervalState] = useLocalStorage<'1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M'>(
    'priceChart_interval',
    '15m'
  );
  const [showGrid, setShowGrid] = useState(true);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(
    null
  );
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [showPositions, setShowPositions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Estado para seleção de pontos Fibonacci
  const [fibonacciSelectingMode, setFibonacciSelectingMode] = useState<{
    indicatorIndex: number;
    step: 'first' | 'second';
    firstPoint: { x: number; y: number; price: number; index: number } | null;
  } | null>(null);

  // Estado para seleção de pontos Elliott Wave
  const [elliottSelectingMode, setElliottSelectingMode] = useState<{
    indicatorIndex: number;
    currentWave: 1 | 2 | 3 | 4 | 5 | 'A' | 'B' | 'C';
  } | null>(null);

  // Auto-ativar modo de seleção quando um Fibonacci sem pontos for adicionado
  useEffect(() => {
    // Não interferir se já estiver em modo de seleção
    if (fibonacciSelectingMode || elliottSelectingMode) {
      return;
    }
    
    const fibIndex = indicators.findIndex((ind) => 
      ind.type === 'fibonacci' && 
      (!ind.fibonacci || ind.fibonacci.startPrice === undefined || ind.fibonacci.endPrice === undefined)
    );
    
    if (fibIndex !== -1) {
      // Encontrar um Fibonacci sem pontos definidos e ativar modo de seleção
      setFibonacciSelectingMode({
        indicatorIndex: fibIndex,
        step: 'first',
        firstPoint: null
      });
      return;
    }
    
    // Auto-ativar modo de seleção para Elliott Wave
    const elliottIndex = indicators.findIndex((ind) => 
      ind.type === 'elliott' && 
      (!ind.elliott || !ind.elliott.wave1 || !ind.elliott.wave2 || !ind.elliott.wave3 || !ind.elliott.wave4 || !ind.elliott.wave5)
    );
    
    if (elliottIndex !== -1) {
      const elliottConfig = indicators[elliottIndex].elliott;
      let nextWave: 1 | 2 | 3 | 4 | 5 = 1;
      
      if (elliottConfig?.wave1) nextWave = 2;
      if (elliottConfig?.wave2) nextWave = 3;
      if (elliottConfig?.wave3) nextWave = 4;
      if (elliottConfig?.wave4) nextWave = 5;
      
      setElliottSelectingMode({
        indicatorIndex: elliottIndex,
        currentWave: nextWave
      });
    }
  }, [indicators.length]); // Apenas quando o número de indicadores muda, não quando o conteúdo muda

  // Use external positions if provided, otherwise use internal state
  const positions = externalPositions || [];

  // Apply pending zoom update with requestAnimationFrame for smooth performance
  const applyPendingZoom = useCallback(() => {
    if (pendingZoomUpdateRef.current) {
      const update = pendingZoomUpdateRef.current;
      setZoomLevel(update.zoomLevel);
      setDisplayCount(update.displayCount);
      setXOffset(update.xOffset);
      pendingZoomUpdateRef.current = null;
      
      // Mark zoom start time
      zoomStartTimeRef.current = Date.now();
      setIsZoomProcessing(true);
      
      // Clear loading after drawing completes (handled in useEffect)
    }
    zoomAnimationFrameRef.current = null;
  }, []);

  // Zoom function with debounce/throttle using requestAnimationFrame
  const handleWheelZoom = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Check if mouse is over Y axis (left margin)
    const isOverYAxis = mouseX < margin.left;
    
    if (isOverYAxis) {
      // Vertical zoom when mouse is over Y axis - apply immediately
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newYZoom = Math.max(0.1, Math.min(5, yZoom * zoomFactor));
      setYZoom(newYZoom);
    } else {
      // Horizontal zoom - use debounced updates
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoomLevel = Math.max(0.1, Math.min(10, (pendingZoomUpdateRef.current?.zoomLevel || zoomLevel) * zoomFactor));
      
      // Calculate zoom center point
      const div = containerRef.current!;
      if (!div) return;
      
      const cw = div.clientWidth - margin.left - margin.right;
      
      // Convert mouse position to data index using current or pending values
      const currentDisplayCount = pendingZoomUpdateRef.current?.displayCount || displayCount;
      const currentXOffset = pendingZoomUpdateRef.current?.xOffset || xOffset;
      const relativeX = Math.max(0, Math.min(1, (mouseX - margin.left) / cw));
      const dataIndex = Math.round(relativeX * currentDisplayCount);
      
      // Calculate new display count and offset
      const newDisplayCount = Math.max(10, Math.min(500, Math.round(100 / newZoomLevel)));
      const zoomCenterIndex = currentXOffset + dataIndex;
      const newOffset = Math.max(0, Math.min(data.length - newDisplayCount, zoomCenterIndex - Math.round(dataIndex * newDisplayCount / currentDisplayCount)));
      
      // Store pending update instead of applying immediately
      pendingZoomUpdateRef.current = {
        zoomLevel: newZoomLevel,
        displayCount: newDisplayCount,
        xOffset: newOffset,
      };
      
      // Cancel previous animation frame if exists
      if (zoomAnimationFrameRef.current !== null) {
        cancelAnimationFrame(zoomAnimationFrameRef.current);
      }
      
      // Schedule update for next animation frame (debounces rapid zoom)
      zoomAnimationFrameRef.current = requestAnimationFrame(applyPendingZoom);
    }
  }, [zoomLevel, xOffset, displayCount, data.length, yZoom, applyPendingZoom, margin.left]);

  // Reset zoom function
  const resetZoom = useCallback(() => {
    setZoomLevel(1);
    setDisplayCount(100);
    setXOffset(Math.max(0, data.length - 100));
    setYZoom(1);
  }, [data.length]);

  // Carregar dados quando symbol ou interval mudarem
  useEffect(() => {
    
    const abortController = new AbortController();
    let isMounted = true; // Flag para verificar se o componente ainda está montado
    
    // Usar uma função local para evitar dependência de load
    const loadData = async (forceReload: boolean = false) => {
      if (abortController.signal.aborted) {
        return;
      }
      
      if (isLoadingRef.current) {
        return;
      }
      
      isLoadingRef.current = true;
      
      // Limpar dados anteriores apenas quando forçar recarregamento completo
      if (forceReload && isMounted && !abortController.signal.aborted) {
        setData([]);
        setXOffset(0);
      }
      
      try {
        // Carregar 1000 candles (máximo da API) para garantir histórico suficiente para indicadores
        const kl = await fetchKlines(symbol, interval, 1000);
        
        if (!isMounted || abortController.signal.aborted) {
          return;
        }
        
        if (kl.length > 0) {
          setData((prevData) => {
            // Se não há dados anteriores ou forçar recarregamento, atualizar tudo
            if (prevData.length === 0 || forceReload) {
              const newOffset = Math.max(0, kl.length - displayCount);
              setXOffset(newOffset);
              return kl;
            }
            
            // Comparar o último candle para detectar se um novo candle foi formado
            const lastPreviousCandle = prevData[prevData.length - 1];
            const lastNewCandle = kl[kl.length - 1];
            
            // Se o timestamp do último candle mudou, significa que um novo candle foi formado
            if (lastNewCandle.time > lastPreviousCandle.time) {
              const newOffset = Math.max(0, kl.length - displayCount);
              setXOffset(newOffset);
              return kl;
            }
            
            // Se o timestamp é o mesmo mas os dados mudaram (candle em formação), atualizar apenas o último
            if (lastNewCandle.time === lastPreviousCandle.time) {
              // Atualizar apenas o último candle se houver mudanças
              const updatedData = [...prevData];
              updatedData[updatedData.length - 1] = lastNewCandle;
              return updatedData;
            }
            
            // Se nada mudou, retornar dados anteriores
            return prevData;
          });
        }
      } catch (error) {
        console.error('[PriceChart] Erro ao carregar dados do gráfico:', error);
        if (isMounted && !abortController.signal.aborted && forceReload) {
          setData([]); // Limpar dados apenas em caso de erro durante recarregamento completo
        }
      } finally {
        isLoadingRef.current = false;
      }
    };
    
    // Aguardar um pouco antes de fazer a primeira requisição para evitar sobrecarga
    const initialTimeout = setTimeout(() => {
      if (isMounted && !abortController.signal.aborted && !isLoadingRef.current) {
        loadData(true); // Primeira carga: forçar recarregamento completo
      }
    }, 400);
    
    // Atualizar a cada 2 segundos para detectar novos candles em tempo real
    const id = window.setInterval(() => {
      if (isMounted && !isLoadingRef.current && !abortController.signal.aborted) {
        loadData(false); // Atualizações periódicas: apenas verificar mudanças
      }
    }, 2000); // 2 segundos para detectar novos candles rapidamente
    
    return () => {
      abortController.abort();
      isMounted = false;
      clearTimeout(initialTimeout);
      window.clearInterval(id);
      isLoadingRef.current = false;
    };
  }, [symbol, interval, displayCount]); // Removido 'load' das dependências

  // Reagir às mudanças nas posições
  useEffect(() => {
    // Log removido para evitar loop infinito
    // Forçar re-render do gráfico quando as posições mudarem
  }, [positions]);

  // Atualizar preço atual na API de trading
  useEffect(() => {
    if (data.length > 0) {
      const lastCandle = data[data.length - 1];
      const currentPrice = lastCandle.close;
      const currentCandleData = {
        high: lastCandle.high,
        low: lastCandle.low,
        close: lastCandle.close,
        time: lastCandle.time
      };
      
      // Verificar se o candle mudou (timestamp diferente) ou se high/low mudaram (candle em formação)
      const candleChanged = !lastCandleDataRef.current || 
        lastCandleDataRef.current.time !== currentCandleData.time ||
        lastCandleDataRef.current.high !== currentCandleData.high ||
        lastCandleDataRef.current.low !== currentCandleData.low ||
        lastPriceRef.current !== currentPrice;
      
      if (!candleChanged) {
        return;
      }
      
      lastPriceRef.current = currentPrice;
      lastCandleDataRef.current = currentCandleData;
      
      // Passar dados completos do candle (high, low, close) para verificação correta de stop loss
      tradingAPI.updateCurrentPrice(currentPrice, {
        high: lastCandle.high,
        low: lastCandle.low,
        close: lastCandle.close
      }).then(() => {
        // Atualizar posições após o preço ser processado
        const updatedPositions = tradingAPI.getPositions();
        onPositionUpdated?.(updatedPositions);
      });
      const updatedPendingOrders = tradingAPI.getPendingOrders();
      setPendingOrders(updatedPendingOrders);
      onPriceUpdate?.(currentPrice);
    }
  }, [data, onPriceUpdate, onPositionUpdated]); // Usar 'data' para detectar mudanças nos candles

  // ... calculateIndicators same as before ...

  const calculateIndicators = useCallback(() => {
    if (!data.length || !indicators.length) {
      return [];
    }
    
    try {
      const result = indicators
        .map((indicator) => {
          switch (indicator.type) {
            case 'moving_average':
              if (!indicator.movingAverage) {
                return null;
              }
              return {
                type: indicator.type,
                data: calculateMovingAverage(data, indicator.movingAverage),
                config: indicator,
              };
            case 'bollinger_bands':
              if (!indicator.bollingerBands) {
                return null;
              }
              return {
                type: indicator.type,
                data: calculateBollingerBands(data, indicator.bollingerBands),
                config: indicator,
              };
            case 'macd':
              if (!indicator.macd) {
                return null;
              }
              return {
                type: indicator.type,
                data: calculateMACD(data, indicator.macd),
                config: indicator,
              };
            case 'ichimoku_cloud':
              if (!indicator.ichimokuCloud) {
                return null;
              }
              return {
                type: indicator.type,
                data: calculateIchimokuCloud(data, indicator.ichimokuCloud),
                config: indicator,
              };
            case 'stochastic_oscillator':
              if (!indicator.stochasticOscillator) {
                return null;
              }
              return {
                type: indicator.type,
                data: calculateStochasticOscillator(
                  data,
                  indicator.stochasticOscillator
                ),
                config: indicator,
              };
            case 'rsi':
              if (!indicator.rsi) {
                return null;
              }
              return {
                type: indicator.type,
                data: calculateRSI(data, indicator.rsi),
                config: indicator,
              };
            case 'hilo':
              if (!indicator.hilo) {
                return null;
              }
              return {
                type: indicator.type,
                data: calculateHILO(data, indicator.hilo),
                config: indicator,
              };
            case 'williamsr':
              if (!indicator.williamsr) {
                return null;
              }
              return {
                type: indicator.type,
                data: calculateWilliamsR(data, indicator.williamsr),
                config: indicator,
              };
            case 'cci':
              if (!indicator.cci) {
                return null;
              }
              return {
                type: indicator.type,
                data: calculateCCI(data, indicator.cci),
                config: indicator,
              };
            case 'adx':
              if (!indicator.adx) {
                return null;
              }
              return {
                type: indicator.type,
                data: calculateADX(data, indicator.adx),
                config: indicator,
              };
            case 'atr':
              if (!indicator.atr) {
                return null;
              }
              return {
                type: indicator.type,
                data: calculateATR(data, indicator.atr),
                config: indicator,
              };
            case 'parabolic_sar':
              if (!indicator.parabolicSAR) {
                return null;
              }
              return {
                type: indicator.type,
                data: calculateParabolicSAR(data, indicator.parabolicSAR),
                config: indicator,
              };
            case 'obv':
              if (!indicator.obv) {
                return null;
              }
              return {
                type: indicator.type,
                data: calculateOBV(data, indicator.obv),
                config: indicator,
              };
            case 'volume':
              if (!indicator.volume) {
                return null;
              }
              return {
                type: indicator.type,
                data: calculateVolume(data, indicator.volume),
                config: indicator,
              };
            case 'wma':
              if (!indicator.wma) {
                return null;
              }
              return {
                type: indicator.type,
                data: calculateWMA(data, indicator.wma),
                config: indicator,
              };
            case 'hma':
              if (!indicator.hma) {
                return null;
              }
              return {
                type: indicator.type,
                data: calculateHMA(data, indicator.hma),
                config: indicator,
              };
            case 'fibonacci':
              // Fibonacci não precisa de cálculo, apenas retorna a config
              if (!indicator.fibonacci) {
                return null;
              }
              return {
                type: indicator.type,
                data: indicator.fibonacci, // Usar a config como dados
                config: indicator,
              };
            case 'elliott':
              // Elliott não precisa de cálculo, apenas retorna a config
              if (!indicator.elliott) {
                return null;
              }
              return {
                type: indicator.type,
                data: indicator.elliott, // Usar a config como dados
                config: indicator,
              };
            default:
              return null;
          }
        })
        .filter(Boolean);
        
      return result || []; // Garantir que sempre retorna um array
    } catch (error) {
      return []; // Retornar array vazio em caso de erro
    }
  }, [data, indicators]);

  // draw
  const drawChart = useCallback(() => {
    // Verificação inicial antes de qualquer processamento
    if (data.length === 0) {
      return;
    }
    
    const div = containerRef.current;
    const cvs = canvasRef.current;
    if (!div || !cvs || data.length === 0) {
      return;
    }
    
    // Mark that drawing is in progress
    isDrawingRef.current = true;
    
    // Clear zoom loading timeout if drawing started before timeout
    if (zoomLoadingTimeoutRef.current) {
      clearTimeout(zoomLoadingTimeoutRef.current);
      zoomLoadingTimeoutRef.current = null;
    }

    // slice out the window of candles we want to display
    const windowData = data.slice(xOffset, xOffset + displayCount);

    const inds = calculateIndicators() || []; // Garantir que sempre seja um array

    // Determinar se precisamos de subplots
    const hasVolume = Array.isArray(inds) && inds.length > 0 && inds.some(ind => ind?.type === 'volume');
    const hasOBV = Array.isArray(inds) && inds.length > 0 && inds.some(ind => ind?.type === 'obv');
    const hasATR = Array.isArray(inds) && inds.length > 0 && inds.some(ind => ind?.type === 'atr');
    const needsSubplot = Array.isArray(inds) && inds.length > 0 && inds.some(ind => 
      ind?.type === 'rsi' || ind?.type === 'macd' || ind?.type === 'stochastic_oscillator' || ind?.type === 'cci' || ind?.type === 'adx' || ind?.type === 'atr' || ind?.type === 'volume' || ind?.type === 'obv' || ind?.type === 'williamsr'
    );

    const w  = div.clientWidth;
    const h  = div.clientHeight;
    const cw = w - margin.left - margin.right;
    
    
    // Ajustar altura baseado na necessidade de subplots
    // Se houver volume, OBV ou ATR, garantir mais espaço para o subplot
    const hasVolumeOrOBVOrATR = hasVolume || hasOBV || hasATR;
    const mainChartHeight = needsSubplot ? (hasVolumeOrOBVOrATR ? h * 0.65 : h * 0.7) : h - margin.top - margin.bottom;
    const subplotHeight = needsSubplot ? (hasVolumeOrOBVOrATR ? h * 0.3 : h * 0.25) : 0;
    const ch = mainChartHeight;

    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);

    // chart area origin
    ctx.save();
    ctx.translate(margin.left, margin.top);

    // grid
    if (showGrid) {
      ctx.strokeStyle = theme.palette.divider;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = (ch * i) / 5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
      }
      for (let i = 0; i <= 10; i++) {
        const x = (cw * i) / 10;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ch);
        ctx.stroke();
      }
    }

    // Y scale with vertical zoom
    const highs = windowData.map((d) => d.high);
    const lows = windowData.map((d) => d.low);
    let yMax = Math.max(...highs);
    let yMin = Math.min(...lows);
    
    // Incluir valores do HILO no cálculo do range se o indicador estiver ativo
    const hiloIndicator = inds.find(ind => ind?.type === 'hilo');
    if (hiloIndicator && hiloIndicator.data && hiloIndicator.data.hilo) {
      const hiloData = hiloIndicator.data.hilo;
      const visibleHiloValues: number[] = [];
      windowData.forEach((candle, i) => {
        const idx = xOffset + i;
        if (idx >= 0 && idx < hiloData.length && !isNaN(hiloData[idx]) && isFinite(hiloData[idx])) {
          visibleHiloValues.push(hiloData[idx]);
        }
      });
      if (visibleHiloValues.length > 0) {
        const hiloMin = Math.min(...visibleHiloValues);
        const hiloMax = Math.max(...visibleHiloValues);
        yMin = Math.min(yMin, hiloMin);
        yMax = Math.max(yMax, hiloMax);
      }
    }
    
    const yRange = yMax - yMin || 1;
    
    // Apply vertical zoom
    const zoomedYRange = yRange / yZoom;
    const zoomedYMin = yMin + (yRange - zoomedYRange) / 2;
    const zoomedYMax = zoomedYMin + zoomedYRange;
    ctx.fillStyle = theme.palette.text.secondary;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 5; i++) {
      const y = (ch * i) / 5;
      const price = zoomedYMax - (zoomedYRange * i) / 5;
      ctx.fillText(`$${price.toFixed(2)}`, -6, y);
    }

    // candles
    const candleW = (cw / displayCount) * 0.8;
    windowData.forEach((d, i) => {
      const x0 =
        (cw / displayCount) * i + ((cw / displayCount) - candleW) / 2;
      const yH = ch - ((d.high - zoomedYMin) / zoomedYRange) * ch;
      const yL = ch - ((d.low - zoomedYMin) / zoomedYRange) * ch;
      ctx.strokeStyle = '#888';
      ctx.beginPath();
      ctx.moveTo(x0 + candleW / 2, yH);
      ctx.lineTo(x0 + candleW / 2, yL);
      ctx.stroke();
      const yO = ch - ((d.open - zoomedYMin) / zoomedYRange) * ch;
      const yC = ch - ((d.close - zoomedYMin) / zoomedYRange) * ch;
      const yTop = Math.min(yO, yC);
      const yBot = Math.max(yO, yC);
      ctx.fillStyle = d.close >= d.open ? '#4caf50' : '#f44336';
      ctx.fillRect(x0, yTop, candleW, yBot - yTop);
    });

    // Draw trading lines (entry, TP, SL)
    positions.forEach(position => {
      if (position.symbol === symbol) {
        // Draw entry line
        ctx.strokeStyle = position.side === 'long' ? '#4caf50' : '#f44336';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        const entryY = ch - ((position.entryPrice - zoomedYMin) / zoomedYRange) * ch;
        ctx.beginPath();
        ctx.moveTo(0, entryY);
        ctx.lineTo(cw, entryY);
        ctx.stroke();

        // Draw TP line
        if (position.takeProfit) {
          ctx.strokeStyle = '#4caf50';
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 5]);
          const tpY = ch - ((position.takeProfit - zoomedYMin) / zoomedYRange) * ch;
          ctx.beginPath();
          ctx.moveTo(0, tpY);
          ctx.lineTo(cw, tpY);
          ctx.stroke();
          
          // Draw TP label
          ctx.fillStyle = '#4caf50';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`TP: $${position.takeProfit.toFixed(2)}`, 5, tpY - 5);
        }

        // Draw SL line
        if (position.stopLoss) {
          ctx.strokeStyle = '#f44336';
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 5]);
          const slY = ch - ((position.stopLoss - zoomedYMin) / zoomedYRange) * ch;
          ctx.beginPath();
          ctx.moveTo(0, slY);
          ctx.lineTo(cw, slY);
          ctx.stroke();
          
          // Draw SL label
          ctx.fillStyle = '#f44336';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`SL: $${position.stopLoss.toFixed(2)}`, 5, slY + 15);
        }

        ctx.setLineDash([]);
      }
    });

    // Draw pending orders
    pendingOrders.forEach(order => {
      if (order.symbol === symbol) {
        // Draw order line
        ctx.strokeStyle = order.side === 'buy' ? '#4caf50' : '#f44336';
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 5]);
        const orderY = ch - ((order.price - zoomedYMin) / zoomedYRange) * ch;
        ctx.beginPath();
        ctx.moveTo(0, orderY);
        ctx.lineTo(cw, orderY);
        ctx.stroke();
        
        // Draw order label
        ctx.fillStyle = order.side === 'buy' ? '#4caf50' : '#f44336';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${order.side.toUpperCase()}: $${order.price.toFixed(2)}`, 5, orderY - 5);

        // Draw TP line for pending order
        if (order.takeProfit) {
          ctx.strokeStyle = '#4caf50';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          const tpY = ch - ((order.takeProfit - zoomedYMin) / zoomedYRange) * ch;
          ctx.beginPath();
          ctx.moveTo(0, tpY);
          ctx.lineTo(cw, tpY);
          ctx.stroke();
          
          // Draw TP label
          ctx.fillStyle = '#4caf50';
          ctx.font = '8px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`TP: $${order.takeProfit.toFixed(2)}`, 5, tpY - 5);
        }

        // Draw SL line for pending order
        if (order.stopLoss) {
          ctx.strokeStyle = '#f44336';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          const slY = ch - ((order.stopLoss - zoomedYMin) / zoomedYRange) * ch;
          ctx.beginPath();
          ctx.moveTo(0, slY);
          ctx.lineTo(cw, slY);
          ctx.stroke();
          
          // Draw SL label
          ctx.fillStyle = '#f44336';
          ctx.font = '8px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`SL: $${order.stopLoss.toFixed(2)}`, 5, slY + 15);
        }

        ctx.setLineDash([]);
      }
    });

    // Draw indicators on main chart
    if (inds.length > 0) {
      inds.forEach((indicator) => {
        if (!indicator || !indicator.data) {
          return;
        }

        // Note: ctx.translate is already applied at line 529 for the entire chart area
        // No need to apply it again here

        switch (indicator.type) {
          case 'moving_average':
            if (indicator.data && Array.isArray(indicator.data)) {
              const period = indicator.config.movingAverage?.period || 20;
              
              ctx.strokeStyle = indicator.config.movingAverage?.color || '#ff6b6b';
              ctx.lineWidth = 2;
              ctx.beginPath();
              let firstPoint = true;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < indicator.data.length && !isNaN(indicator.data[idx])) {
                  const x = (cw / displayCount) * i + (cw / displayCount) / 2;
                  const y = ch - ((indicator.data[idx] - zoomedYMin) / zoomedYRange) * ch;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();
            }
            break;

          case 'wma':
            if (indicator.data && Array.isArray(indicator.data)) {
              ctx.strokeStyle = '#9c27b0';
              ctx.lineWidth = 2;
              ctx.beginPath();
              let firstPoint = true;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < indicator.data.length && !isNaN(indicator.data[idx])) {
                  const x = (cw / displayCount) * i + (cw / displayCount) / 2;
                  const y = ch - ((indicator.data[idx] - zoomedYMin) / zoomedYRange) * ch;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();
            }
            break;

          case 'hma':
            if (indicator.data && Array.isArray(indicator.data)) {
              ctx.strokeStyle = '#ff9800';
              ctx.lineWidth = 2;
              ctx.beginPath();
              let firstPoint = true;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < indicator.data.length && !isNaN(indicator.data[idx])) {
                  const x = (cw / displayCount) * i + (cw / displayCount) / 2;
                  const y = ch - ((indicator.data[idx] - zoomedYMin) / zoomedYRange) * ch;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();
            }
            break;

          case 'fibonacci':
            if (indicator.data && indicator.config.fibonacci) {
              const fibConfig = indicator.config.fibonacci;
              
              // Verificar se os pontos foram definidos
              if (fibConfig.startPrice !== undefined && fibConfig.endPrice !== undefined &&
                  fibConfig.startIndex !== undefined && fibConfig.endIndex !== undefined) {
                
                // Determinar qual é o ponto mais alto e qual é o mais baixo
                // O Fibonacci sempre vai do ponto mais baixo (0%) ao mais alto (100%)
                const lowPrice = Math.min(fibConfig.startPrice, fibConfig.endPrice);
                const highPrice = Math.max(fibConfig.startPrice, fibConfig.endPrice);
                const lowIndex = fibConfig.startPrice < fibConfig.endPrice ? fibConfig.startIndex : fibConfig.endIndex;
                const highIndex = fibConfig.startPrice > fibConfig.endPrice ? fibConfig.startIndex : fibConfig.endIndex;
                
                // Calcular a diferença de preço
                const priceRange = highPrice - lowPrice;
                
                // Níveis padrão de Fibonacci Retracement (sem incluir 0% e 100% que são os pontos extremos)
                const retracementLevels = [0.236, 0.382, 0.5, 0.618, 0.786];
                
                ctx.strokeStyle = fibConfig.color || '#9c27b0';
                ctx.lineWidth = fibConfig.lineWidth || 1;
                ctx.setLineDash([5, 5]);
                
                // Desenhar linhas de retracement (entre 0% e 100%)
                retracementLevels.forEach((level) => {
                  // Calcular preço do nível de retracement (do mais alto para o mais baixo)
                  const retracementPrice = highPrice - (priceRange * level);
                  
                  // Verificar se o preço está dentro do range visível
                  if (retracementPrice >= zoomedYMin && retracementPrice <= zoomedYMax) {
                    const y = ch - ((retracementPrice - zoomedYMin) / zoomedYRange) * ch;
                    
                    // Desenhar linha horizontal em toda a largura do gráfico
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(cw, y);
                    ctx.stroke();
                    
                    // Desenhar label se habilitado
                    if (fibConfig.showLabels) {
                      ctx.fillStyle = fibConfig.color || '#9c27b0';
                      ctx.font = '10px sans-serif';
                      ctx.textAlign = 'left';
                      ctx.textBaseline = 'middle';
                      
                      const labelText = `${(level * 100).toFixed(1)}% ($${retracementPrice.toFixed(2)})`;
                      const textWidth = ctx.measureText(labelText).width;
                      ctx.fillRect(0, y - 8, textWidth + 6, 16);
                      ctx.fillStyle = '#fff';
                      ctx.fillText(labelText, 3, y);
                    }
                  }
                });
                
                ctx.setLineDash([]);
                
                // Desenhar linha base conectando os dois pontos (0% a 100%)
                const startIdx = Math.max(0, Math.min(windowData.length - 1, lowIndex - xOffset));
                const endIdx = Math.max(0, Math.min(windowData.length - 1, highIndex - xOffset));
                
                if (startIdx >= 0 && endIdx >= 0 && startIdx < windowData.length && endIdx < windowData.length) {
                  const startX = (cw / displayCount) * startIdx + (cw / displayCount) / 2;
                  const endX = (cw / displayCount) * endIdx + (cw / displayCount) / 2;
                  const startY = ch - ((lowPrice - zoomedYMin) / zoomedYRange) * ch;
                  const endY = ch - ((highPrice - zoomedYMin) / zoomedYRange) * ch;
                  
                  // Desenhar linha diagonal conectando os pontos
                  ctx.strokeStyle = fibConfig.color || '#9c27b0';
                  ctx.lineWidth = 2;
                  ctx.setLineDash([10, 5]); // Linha tracejada mais espaçada
                  ctx.beginPath();
                  ctx.moveTo(startX, startY);
                  ctx.lineTo(endX, endY);
                  ctx.stroke();
                  ctx.setLineDash([]);
                  
                  // Desenhar pontos nos extremos (0% e 100%)
                  ctx.fillStyle = fibConfig.color || '#9c27b0';
                  // Ponto inferior (0%)
                  ctx.beginPath();
                  ctx.arc(startX, startY, 5, 0, 2 * Math.PI);
                  ctx.fill();
                  // Label para 0%
                  if (fibConfig.showLabels) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '9px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillText('0%', startX, startY + 8);
                  }
                  
                  // Ponto superior (100%)
                  ctx.fillStyle = fibConfig.color || '#9c27b0';
                  ctx.beginPath();
                  ctx.arc(endX, endY, 5, 0, 2 * Math.PI);
                  ctx.fill();
                  // Label para 100%
                  if (fibConfig.showLabels) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '9px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    ctx.fillText('100%', endX, endY - 8);
                  }
                }
              }
            }
            break;

          case 'elliott':
            if (indicator.data && indicator.config.elliott) {
              const elliottConfig = indicator.config.elliott;
              
              ctx.strokeStyle = elliottConfig.color || '#ff9800';
              ctx.lineWidth = elliottConfig.lineWidth || 2;
              ctx.setLineDash([]);
              
              // Desenhar ondas impulsivas (1-5)
              const waves = [
                { wave: elliottConfig.wave1, label: '1' },
                { wave: elliottConfig.wave2, label: '2' },
                { wave: elliottConfig.wave3, label: '3' },
                { wave: elliottConfig.wave4, label: '4' },
                { wave: elliottConfig.wave5, label: '5' },
              ];
              
              let prevPoint: { price: number; index: number } | null = null;
              
              waves.forEach((waveData, i) => {
                if (waveData.wave) {
                  const waveIndex = Math.max(0, Math.min(windowData.length - 1, waveData.wave.index - xOffset));
                  
                  if (waveIndex >= 0 && waveIndex < windowData.length) {
                    const x = (cw / displayCount) * waveIndex + (cw / displayCount) / 2;
                    const y = ch - ((waveData.wave.price - zoomedYMin) / zoomedYRange) * ch;
                    
                    // Desenhar linha conectando com o ponto anterior
                    if (prevPoint) {
                      const prevWaveIndex = Math.max(0, Math.min(windowData.length - 1, prevPoint.index - xOffset));
                      if (prevWaveIndex >= 0 && prevWaveIndex < windowData.length) {
                        const prevX = (cw / displayCount) * prevWaveIndex + (cw / displayCount) / 2;
                        const prevY = ch - ((prevPoint.price - zoomedYMin) / zoomedYRange) * ch;
                        
                        ctx.beginPath();
                        ctx.moveTo(prevX, prevY);
                        ctx.lineTo(x, y);
                        ctx.stroke();
                      }
                    }
                    
                    // Desenhar ponto da onda
                    ctx.fillStyle = elliottConfig.color || '#ff9800';
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, 2 * Math.PI);
                    ctx.fill();
                    
                    // Desenhar label
                    if (elliottConfig.showLabels) {
                      ctx.fillStyle = elliottConfig.color || '#ff9800';
                      ctx.font = '10px sans-serif';
                      ctx.textAlign = 'center';
                      ctx.textBaseline = i % 2 === 0 ? 'bottom' : 'top';
                      ctx.fillText(waveData.label, x, i % 2 === 0 ? y - 6 : y + 6);
                    }
                    
                    prevPoint = waveData.wave;
                  }
                }
              });
              
              // Desenhar ondas corretivas (A-B-C) se existirem
              const correctiveWaves = [
                { wave: elliottConfig.waveA, label: 'A' },
                { wave: elliottConfig.waveB, label: 'B' },
                { wave: elliottConfig.waveC, label: 'C' },
              ];
              
              let prevCorrective: { price: number; index: number } | null = prevPoint;
              
              correctiveWaves.forEach((waveData, i) => {
                if (waveData.wave && prevCorrective) {
                  const waveIndex = Math.max(0, Math.min(windowData.length - 1, waveData.wave.index - xOffset));
                  
                  if (waveIndex >= 0 && waveIndex < windowData.length) {
                    const x = (cw / displayCount) * waveIndex + (cw / displayCount) / 2;
                    const y = ch - ((waveData.wave.price - zoomedYMin) / zoomedYRange) * ch;
                    
                    const prevWaveIndex = Math.max(0, Math.min(windowData.length - 1, prevCorrective.index - xOffset));
                    if (prevWaveIndex >= 0 && prevWaveIndex < windowData.length) {
                      const prevX = (cw / displayCount) * prevWaveIndex + (cw / displayCount) / 2;
                      const prevY = ch - ((prevCorrective.price - zoomedYMin) / zoomedYRange) * ch;
                      
                      // Linha tracejada para ondas corretivas
                      ctx.setLineDash([5, 5]);
                      ctx.beginPath();
                      ctx.moveTo(prevX, prevY);
                      ctx.lineTo(x, y);
                      ctx.stroke();
                      ctx.setLineDash([]);
                    }
                    
                    // Desenhar ponto da onda corretiva
                    ctx.fillStyle = elliottConfig.color || '#ff9800';
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, 2 * Math.PI);
                    ctx.fill();
                    
                    // Desenhar label
                    if (elliottConfig.showLabels) {
                      ctx.fillStyle = elliottConfig.color || '#ff9800';
                      ctx.font = '10px sans-serif';
                      ctx.textAlign = 'center';
                      ctx.textBaseline = i % 2 === 0 ? 'top' : 'bottom';
                      ctx.fillText(waveData.label, x, i % 2 === 0 ? y + 6 : y - 6);
                    }
                    
                    prevCorrective = waveData.wave;
                  }
                }
              });
            }
            break;

          case 'bollinger_bands':
            if (indicator.data && indicator.data.upper && indicator.data.lower && indicator.data.middle) {
              const upper = indicator.data.upper;
              const lower = indicator.data.lower;
              const middle = indicator.data.middle;

              // Draw fill between bands
              // Use a semi-transparent color (10% opacity)
              ctx.fillStyle = 'rgba(255, 107, 107, 0.1)';
              ctx.beginPath();
              // Draw upper band path
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < upper.length && !isNaN(upper[idx]) && !isNaN(lower[idx])) {
                  const x = (cw / displayCount) * i + (cw / displayCount) / 2;
                  const y = ch - ((upper[idx] - zoomedYMin) / zoomedYRange) * ch;
                  if (i === 0) {
                    ctx.moveTo(x, y);
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              // Draw lower band path in reverse
              for (let i = windowData.length - 1; i >= 0; i--) {
                const idx = xOffset + i;
                if (idx < lower.length && !isNaN(lower[idx])) {
                  const x = (cw / displayCount) * i + (cw / displayCount) / 2;
                  const y = ch - ((lower[idx] - zoomedYMin) / zoomedYRange) * ch;
                  ctx.lineTo(x, y);
                }
              }
              ctx.closePath();
              ctx.fill();

              // Draw upper band
              ctx.strokeStyle = indicator.config.bollingerBands?.upperColor || '#ff6b6b';
              ctx.lineWidth = 1;
              ctx.beginPath();
              let firstPoint = true;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < upper.length && !isNaN(upper[idx])) {
                  const x = (cw / displayCount) * i + (cw / displayCount) / 2;
                  const y = ch - ((upper[idx] - zoomedYMin) / zoomedYRange) * ch;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();

              // Draw lower band
              ctx.strokeStyle = indicator.config.bollingerBands?.lowerColor || '#4ecdc4';
              ctx.beginPath();
              firstPoint = true;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < lower.length && !isNaN(lower[idx])) {
                  const x = (cw / displayCount) * i + (cw / displayCount) / 2;
                  const y = ch - ((lower[idx] - zoomedYMin) / zoomedYRange) * ch;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();

              // Draw middle line
              ctx.strokeStyle = indicator.config.bollingerBands?.middleColor || '#45b7d1';
              ctx.lineWidth = 1;
              ctx.setLineDash([5, 5]);
              ctx.beginPath();
              firstPoint = true;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < middle.length && !isNaN(middle[idx])) {
                  const x = (cw / displayCount) * i + (cw / displayCount) / 2;
                  const y = ch - ((middle[idx] - zoomedYMin) / zoomedYRange) * ch;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();
              ctx.setLineDash([]);
            }
            break;

          case 'hilo':
            if (indicator.data && indicator.data.hilo && indicator.data.trend) {
              const hiloData = indicator.data.hilo;
              const trendData = indicator.data.trend;
              
             

              // Coletar valores válidos para verificação
              const validValues: number[] = [];
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx >= 0 && idx < hiloData.length && !isNaN(hiloData[idx])) {
                  validValues.push(hiloData[idx]);
                }
              });
              
            

              // HiLo Activator: linha contínua em degraus que mantém valor até reversão
              // Em alta (bull): linha verde abaixo dos candles (lowMA)
              // Em baixa (bear): linha vermelha acima dos candles (highMA)
              ctx.lineWidth = 3;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              
              // Verificar se todos os valores são iguais (linha horizontal única)
              const uniqueValues = [...new Set(validValues)];
              const allSame = uniqueValues.length === 1;
              
              const computedYValues = validValues.map(v => {
                let y = ch - ((v - zoomedYMin) / zoomedYRange) * ch;
                if (y < 0) y = 0;
                if (y > ch) y = ch;
                return y;
              });
              
             
              
              // Desenhar linha em degraus (step line) - HILO mantém valor até reversão
              // Coletar todos os pontos primeiro para facilitar renderização
              // Incluir o ponto anterior à janela visível se existir, para mostrar degraus corretamente
              const hiloPoints: Array<{ x: number; y: number; trend: 'bull' | 'bear'; value: number; idx: number }> = [];
              
              // Adicionar ponto anterior se existir (para mostrar degrau no início)
              if (xOffset > 0 && xOffset - 1 >= 0 && xOffset - 1 < hiloData.length) {
                const prevIdx = xOffset - 1;
                const prevHiloValue = hiloData[prevIdx];
                const prevTrend = trendData[prevIdx];
                
                if (!isNaN(prevHiloValue) && prevTrend && isFinite(prevHiloValue)) {
                  // Calcular X negativo (fora da área visível, mas necessário para o degrau)
                  const x = -((cw / displayCount) / 2);
                  let y = ch - ((prevHiloValue - zoomedYMin) / zoomedYRange) * ch;
                  if (y < 0) y = 0;
                  if (y > ch) y = ch;
                  if (isFinite(y)) {
                    hiloPoints.push({ x, y, trend: prevTrend, value: prevHiloValue, idx: prevIdx });
                  }
                }
              }
              
              // Adicionar pontos da janela visível
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < 0 || idx >= hiloData.length || idx >= trendData.length) return;
                
                const hiloValue = hiloData[idx];
                const trend = trendData[idx];
                
                if (isNaN(hiloValue) || !trend || !isFinite(hiloValue)) return;
                
                const x = (cw / displayCount) * i + (cw / displayCount) / 2;
                // Clamp Y para garantir que está dentro dos limites do canvas
                let y = ch - ((hiloValue - zoomedYMin) / zoomedYRange) * ch;
                
                // Se o HILO está fora do range visível, ajustar para ficar visível
                if (y < 0) y = 0;
                if (y > ch) y = ch;
                
               
                
                hiloPoints.push({ x, y, trend, value: hiloValue, idx });
              });
              
             
              
              const uniqueTrends = [...new Set(hiloPoints.map(p => p.trend))];
              const uniqueYValues = [...new Set(hiloPoints.map(p => p.y.toFixed(2)))];
              
              
              // Desenhar linha em degraus (step line)
              // A linha HILO mantém o valor até haver reversão, então sempre desenhamos como step line
              if (hiloPoints.length > 0) {
                // Filtrar pontos que estão dentro da área visível (x >= 0) ou logo antes (para degrau)
                const visiblePoints = hiloPoints.filter(p => p.x >= -10 || (p.x < 0 && p.idx === xOffset - 1));
                
               
                
                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                let currentTrend = visiblePoints[0].trend;
                let segmentStartY = visiblePoints[0].y;
                let trendChanges = 0;
                
                const firstColor = currentTrend === 'bull' 
                  ? (indicator.config.hilo?.bullColor || '#4caf50')
                  : (indicator.config.hilo?.bearColor || '#f44336');
                ctx.strokeStyle = firstColor;
                
                // Começar do primeiro ponto visível (ou do início se o primeiro ponto está antes da área visível)
                const startX = Math.max(0, visiblePoints[0].x);
                ctx.moveTo(startX, visiblePoints[0].y);
                
                // Desenhar step line: para cada ponto, verificar se há mudança de tendência ou valor
                // O HILO agora segue as médias móveis, então pode mudar de valor mesmo sem mudança de tendência
                for (let i = 1; i < visiblePoints.length; i++) {
                  const point = visiblePoints[i];
                  const prevPoint = visiblePoints[i - 1];
                  
                  // Verificar se a tendência mudou ou se o valor mudou significativamente
                  const valueChanged = Math.abs(point.value - prevPoint.value) > 0.01;
                  
                  if (point.trend !== currentTrend) {
                    // Mudança de tendência: desenhar degrau vertical e mudar cor
                    const prevX = Math.max(0, prevPoint.x);
                    ctx.lineTo(prevX, segmentStartY);
                    ctx.stroke();
                    
                    // Iniciar novo path com nova cor
                    ctx.beginPath();
                    ctx.lineWidth = 3;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    const newColor = point.trend === 'bull' 
                      ? (indicator.config.hilo?.bullColor || '#4caf50')
                      : (indicator.config.hilo?.bearColor || '#f44336');
                    ctx.strokeStyle = newColor;
                    
                    // Desenhar degrau vertical no X anterior
                    ctx.moveTo(prevX, segmentStartY);
                    ctx.lineTo(prevX, point.y);
                    
                    // Iniciar novo segmento horizontal no novo valor
                    const pointX = Math.max(0, point.x);
                    ctx.moveTo(prevX, point.y);
                    ctx.lineTo(pointX, point.y);
                    
                    currentTrend = point.trend;
                    segmentStartY = point.y;
                    trendChanges++;
                  } else if (valueChanged) {
                    // Mesma tendência mas valor mudou: desenhar degrau (escadinha)
                    const prevX = Math.max(0, prevPoint.x);
                    ctx.lineTo(prevX, segmentStartY); // Horizontal até o ponto anterior
                    ctx.lineTo(prevX, point.y); // Degrau vertical
                    const pointX = Math.max(0, point.x);
                    ctx.moveTo(prevX, point.y);
                    ctx.lineTo(pointX, point.y); // Nova horizontal no novo valor
                    segmentStartY = point.y;
                  } else {
                    // Mesma tendência e mesmo valor: linha horizontal mantendo o Y
                    const pointX = Math.max(0, point.x);
                    ctx.lineTo(pointX, segmentStartY);
                  }
                }
                
                // Finalizar último segmento
                ctx.stroke();
                
               
              }
            } else if (indicator.data && indicator.data.upper && indicator.data.lower) {
              // Fallback para formato antigo (caso ainda tenha dados no formato anterior)
              const upper = indicator.data.upper;
              const lower = indicator.data.lower;

              ctx.lineWidth = 2;
              ctx.beginPath();
              let firstPoint = true;
              
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx >= upper.length || idx >= lower.length) return;
                
                const upperVal = upper[idx];
                const lowerVal = lower[idx];
                const value = !isNaN(upperVal) ? upperVal : (!isNaN(lowerVal) ? lowerVal : NaN);
                
                if (!isNaN(value)) {
                  const x = (cw / displayCount) * i + (cw / displayCount) / 2;
                  const y = ch - ((value - zoomedYMin) / zoomedYRange) * ch;
                  
                  ctx.strokeStyle = !isNaN(upperVal) ? '#f44336' : '#4caf50';
                  
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();
            }
            break;

          case 'ichimoku_cloud':
            if (indicator.data && indicator.data.tenkan && indicator.data.kijun && 
                indicator.data.senkouSpanA && indicator.data.senkouSpanB) {
              const tenkan = indicator.data.tenkan;
              const kijun = indicator.data.kijun;
              const senkouSpanA = indicator.data.senkouSpanA;
              const senkouSpanB = indicator.data.senkouSpanB;

              // Draw Tenkan-sen
              ctx.strokeStyle = indicator.config.ichimokuCloud?.tenkanColor || '#ff6b6b';
              ctx.lineWidth = 2;
              ctx.beginPath();
              let firstPoint = true;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < tenkan.length && !isNaN(tenkan[idx])) {
                  const x = (cw / displayCount) * i + (cw / displayCount) / 2;
                  const y = ch - ((tenkan[idx] - zoomedYMin) / zoomedYRange) * ch;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();

              // Draw Kijun-sen
              ctx.strokeStyle = indicator.config.ichimokuCloud?.kijunColor || '#4ecdc4';
              ctx.lineWidth = 2;
              ctx.beginPath();
              firstPoint = true;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < kijun.length && !isNaN(kijun[idx])) {
                  const x = (cw / displayCount) * i + (cw / displayCount) / 2;
                  const y = ch - ((kijun[idx] - zoomedYMin) / zoomedYRange) * ch;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();

              // Draw Senkou Span A
              ctx.strokeStyle = indicator.config.ichimokuCloud?.senkouSpanAColor || '#45b7d1';
              ctx.lineWidth = 1;
              ctx.setLineDash([5, 5]);
              ctx.beginPath();
              firstPoint = true;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < senkouSpanA.length && !isNaN(senkouSpanA[idx])) {
                  const x = (cw / displayCount) * i + (cw / displayCount) / 2;
                  const y = ch - ((senkouSpanA[idx] - zoomedYMin) / zoomedYRange) * ch;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();

              // Draw Senkou Span B
              ctx.strokeStyle = indicator.config.ichimokuCloud?.senkouSpanBColor || '#96ceb4';
              ctx.lineWidth = 1;
              ctx.beginPath();
              firstPoint = true;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < senkouSpanB.length && !isNaN(senkouSpanB[idx])) {
                  const x = (cw / displayCount) * i + (cw / displayCount) / 2;
                  const y = ch - ((senkouSpanB[idx] - zoomedYMin) / zoomedYRange) * ch;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();
              ctx.setLineDash([]);
            }
            break;

          case 'parabolic_sar':
            if (indicator.data && Array.isArray(indicator.data)) {
              const sarData = indicator.data;
              
              
              
              // Draw Parabolic SAR as dots/points
              // Points are green when SAR is below price (uptrend), red when above (downtrend)
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < sarData.length && idx >= 0 && !isNaN(sarData[idx])) {
                  const sarValue = sarData[idx];
                  const x = (cw / displayCount) * i + (cw / displayCount) / 2;
                  const y = ch - ((sarValue - zoomedYMin) / zoomedYRange) * ch;
                  
                  // Determine if SAR is above or below the candle close price
                  // If SAR < close, it's below (uptrend - green), if SAR > close, it's above (downtrend - red)
                  const isUptrend = sarValue < candle.close;
                  
                  // Draw point
                  ctx.fillStyle = isUptrend 
                    ? (indicator.config.parabolicSAR?.uptrendColor || '#4caf50') // Green for uptrend
                    : (indicator.config.parabolicSAR?.downtrendColor || '#f44336'); // Red for downtrend
                  
                  ctx.beginPath();
                  ctx.arc(x, y, 3, 0, 2 * Math.PI); // Small circle with radius 3
                  ctx.fill();
                }
              });
              
              // Optionally draw a line connecting the SAR points for better visibility
              ctx.strokeStyle = indicator.config.parabolicSAR?.lineColor || '#9e9e9e';
              ctx.lineWidth = 1;
              ctx.beginPath();
              let firstPoint = true;
              let pointsDrawn = 0;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < sarData.length && idx >= 0 && !isNaN(sarData[idx])) {
                  const x = (cw / displayCount) * i + (cw / displayCount) / 2;
                  const y = ch - ((sarData[idx] - zoomedYMin) / zoomedYRange) * ch;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                  pointsDrawn++;
                }
              });
              ctx.stroke();
              console.log('[PriceChart] Parabolic SAR: Drawn', pointsDrawn, 'points');
            } else {
              console.warn('[PriceChart] Parabolic SAR: Invalid data -', indicator.data);
            }
            break;
        }
        // Note: No ctx.restore() needed here since we didn't do ctx.save()
      });
    }

    ctx.restore();

    // Draw subplots for indicators that need them
    if (needsSubplot && subplotHeight > 0) {
      const subplotY = h - subplotHeight - 10;
      const subplotMargin = { top: 5, right: 10, bottom: 20, left: 60 };
      const subplotW = w - subplotMargin.left - subplotMargin.right;
      const subplotH = subplotHeight - subplotMargin.top - subplotMargin.bottom;

      ctx.save();
      ctx.translate(subplotMargin.left, subplotY + subplotMargin.top);

      // Draw subplot background
      ctx.fillStyle = theme.palette.background.paper;
      ctx.fillRect(-subplotMargin.left, -subplotMargin.top, w, subplotHeight);

      // Draw subplot border
      ctx.strokeStyle = theme.palette.divider;
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, subplotW, subplotH);

      // Draw subplot indicators - volume, obv, atr e williamsr primeiro para garantir visibilidade
      const sortedInds = [...inds].sort((a, b) => {
        if (a?.type === 'volume') return -1;
        if (b?.type === 'volume') return 1;
        if (a?.type === 'obv') return -1;
        if (b?.type === 'obv') return 1;
        if (a?.type === 'atr') return -1;
        if (b?.type === 'atr') return 1;
        if (a?.type === 'williamsr') return -1;
        if (b?.type === 'williamsr') return 1;
        return 0;
      });
      
      sortedInds.forEach((indicator) => {
        if (!indicator || !indicator.data) return;

        switch (indicator.type) {
          case 'rsi':
            if (indicator.data && Array.isArray(indicator.data)) {
              const rsiData = indicator.data;
              const rsiMax = 100;
              const rsiMin = 0;
              const rsiRange = rsiMax - rsiMin;

              // Draw overbought/oversold lines
              const overbought = indicator.config.rsi?.overbought || 70;
              const oversold = indicator.config.rsi?.oversold || 30;
              
              ctx.strokeStyle = indicator.config.rsi?.overboughtColor || '#ff9ff3';
              ctx.lineWidth = 1;
              ctx.setLineDash([5, 5]);
              const overboughtY = subplotH - ((overbought - rsiMin) / rsiRange) * subplotH;
              ctx.beginPath();
              ctx.moveTo(0, overboughtY);
              ctx.lineTo(subplotW, overboughtY);
              ctx.stroke();

              ctx.strokeStyle = indicator.config.rsi?.oversoldColor || '#54a0ff';
              const oversoldY = subplotH - ((oversold - rsiMin) / rsiRange) * subplotH;
              ctx.beginPath();
              ctx.moveTo(0, oversoldY);
              ctx.lineTo(subplotW, oversoldY);
              ctx.stroke();
              ctx.setLineDash([]);

              // Draw RSI line
              ctx.strokeStyle = indicator.config.rsi?.color || '#ff6b6b';
              ctx.lineWidth = 2;
              ctx.beginPath();
              let firstPoint = true;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < rsiData.length && !isNaN(rsiData[idx])) {
                  const x = (subplotW / displayCount) * i + (subplotW / displayCount) / 2;
                  const y = subplotH - ((rsiData[idx] - rsiMin) / rsiRange) * subplotH;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();
            }
            break;

          case 'macd':
            if (indicator.data && indicator.data.macd && indicator.data.signal) {
              const macd = indicator.data.macd.slice(xOffset, xOffset + displayCount);
              const signal = indicator.data.signal.slice(xOffset, xOffset + displayCount);
              const histogram = indicator.data.histogram?.slice(xOffset, xOffset + displayCount) || [];

              // Find min/max for scaling
              const allValues = [...macd, ...signal, ...histogram].filter(v => !isNaN(v));
              const macdMax = Math.max(...allValues);
              const macdMin = Math.min(...allValues);
              const macdRange = macdMax - macdMin || 1;

              // Draw histogram
              if (histogram.length > 0) {
                ctx.fillStyle = indicator.config.macd?.histogramColor || '#45b7d1';
                histogram.forEach((value, i) => {
                  if (!isNaN(value)) {
                    const x = (subplotW / displayCount) * i + (subplotW / displayCount) / 2 - (subplotW / displayCount * 0.8) / 2;
                    const barWidth = subplotW / displayCount * 0.8;
                    const y = subplotH - ((value - macdMin) / macdRange) * subplotH;
                    const barHeight = Math.abs(value - macdMin) / macdRange * subplotH;
                    ctx.fillRect(x, y, barWidth, barHeight);
                  }
                });
              }

              // Draw MACD line
              ctx.strokeStyle = indicator.config.macd?.macdColor || '#ff6b6b';
              ctx.lineWidth = 2;
              ctx.beginPath();
              let firstPoint = true;
              macd.forEach((value, i) => {
                if (!isNaN(value)) {
                  const x = (subplotW / displayCount) * i + (subplotW / displayCount) / 2;
                  const y = subplotH - ((value - macdMin) / macdRange) * subplotH;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();

              // Draw signal line
              ctx.strokeStyle = indicator.config.macd?.signalColor || '#4ecdc4';
              ctx.lineWidth = 2;
              ctx.beginPath();
              firstPoint = true;
              signal.forEach((value, i) => {
                if (!isNaN(value)) {
                  const x = (subplotW / displayCount) * i + (subplotW / displayCount) / 2;
                  const y = subplotH - ((value - macdMin) / macdRange) * subplotH;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();
            }
            break;

          case 'stochastic_oscillator':
            if (indicator.data && indicator.data.k && indicator.data.d) {
              const kData = indicator.data.k;
              const dData = indicator.data.d;
              const stochMax = 100;
              const stochMin = 0;
              const stochRange = stochMax - stochMin;

              // Draw overbought/oversold lines
              const overbought = indicator.config.stochasticOscillator?.overbought || 80;
              const oversold = indicator.config.stochasticOscillator?.oversold || 20;
              
              ctx.strokeStyle = indicator.config.stochasticOscillator?.overboughtColor || '#ff9ff3';
              ctx.lineWidth = 1;
              ctx.setLineDash([5, 5]);
              const overboughtY = subplotH - ((overbought - stochMin) / stochRange) * subplotH;
              ctx.beginPath();
              ctx.moveTo(0, overboughtY);
              ctx.lineTo(subplotW, overboughtY);
              ctx.stroke();

              ctx.strokeStyle = indicator.config.stochasticOscillator?.oversoldColor || '#54a0ff';
              const oversoldY = subplotH - ((oversold - stochMin) / stochRange) * subplotH;
              ctx.beginPath();
              ctx.moveTo(0, oversoldY);
              ctx.lineTo(subplotW, oversoldY);
              ctx.stroke();
              ctx.setLineDash([]);

              // Draw %K line
              ctx.strokeStyle = indicator.config.stochasticOscillator?.kColor || '#ff6b6b';
              ctx.lineWidth = 2;
              ctx.beginPath();
              let firstPoint = true;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < kData.length && !isNaN(kData[idx])) {
                  const x = (subplotW / displayCount) * i + (subplotW / displayCount) / 2;
                  const y = subplotH - ((kData[idx] - stochMin) / stochRange) * subplotH;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();

              // Draw %D line
              ctx.strokeStyle = indicator.config.stochasticOscillator?.dColor || '#4ecdc4';
              ctx.lineWidth = 2;
              ctx.beginPath();
              firstPoint = true;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < dData.length && !isNaN(dData[idx])) {
                  const x = (subplotW / displayCount) * i + (subplotW / displayCount) / 2;
                  const y = subplotH - ((dData[idx] - stochMin) / stochRange) * subplotH;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();
            }
            break;

          case 'williamsr':
            if (indicator.data && Array.isArray(indicator.data)) {
              const williamsRData = indicator.data;
              
              
              
              // Williams %R ranges from -100 to 0
              const williamsRMax = 0;
              const williamsRMin = -100;
              const williamsRRange = williamsRMax - williamsRMin;

              // Draw overbought/oversold lines (default: -20/-80)
              const overbought = indicator.config.williamsr?.overbought || -20;
              const oversold = indicator.config.williamsr?.oversold || -80;
              
              ctx.strokeStyle = indicator.config.williamsr?.overboughtColor || '#ff9ff3';
              ctx.lineWidth = 1;
              ctx.setLineDash([5, 5]);
              const overboughtY = subplotH - ((overbought - williamsRMin) / williamsRRange) * subplotH;
              ctx.beginPath();
              ctx.moveTo(0, overboughtY);
              ctx.lineTo(subplotW, overboughtY);
              ctx.stroke();

              ctx.strokeStyle = indicator.config.williamsr?.oversoldColor || '#54a0ff';
              const oversoldY = subplotH - ((oversold - williamsRMin) / williamsRRange) * subplotH;
              ctx.beginPath();
              ctx.moveTo(0, oversoldY);
              ctx.lineTo(subplotW, oversoldY);
              ctx.stroke();
              ctx.setLineDash([]);

              // Draw Williams %R line
              ctx.strokeStyle = indicator.config.williamsr?.color || '#ff6b6b';
              ctx.lineWidth = 2;
              ctx.beginPath();
              let firstPoint = true;
              let pointsDrawn = 0;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < williamsRData.length && idx >= 0 && !isNaN(williamsRData[idx])) {
                  const x = (subplotW / displayCount) * i + (subplotW / displayCount) / 2;
                  const y = subplotH - ((williamsRData[idx] - williamsRMin) / williamsRRange) * subplotH;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                  pointsDrawn++;
                }
              });
              if (pointsDrawn > 0) {
                ctx.stroke();
              }
              console.log('[PriceChart] Williams %R: Drawn', pointsDrawn, 'points');
            } else {
              console.warn('[PriceChart] Williams %R: Invalid data -', indicator.data);
            }
            break;

          case 'cci':
            if (indicator.data && Array.isArray(indicator.data)) {
              const cciData = indicator.data;
              
              // CCI typically ranges from -200 to +200, but we'll use the actual min/max of the data
              const validValues = cciData.filter(v => !isNaN(v));
              const cciMax = validValues.length > 0 ? Math.max(...validValues) : 200;
              const cciMin = validValues.length > 0 ? Math.min(...validValues) : -200;
              const cciRange = cciMax - cciMin || 400;

              // Draw overbought/oversold lines (default: +100/-100)
              const overbought = indicator.config.cci?.overbought || 100;
              const oversold = indicator.config.cci?.oversold || -100;
              
              ctx.strokeStyle = '#ff9ff3';
              ctx.lineWidth = 1;
              ctx.setLineDash([5, 5]);
              const overboughtY = subplotH - ((overbought - cciMin) / cciRange) * subplotH;
              ctx.beginPath();
              ctx.moveTo(0, overboughtY);
              ctx.lineTo(subplotW, overboughtY);
              ctx.stroke();

              ctx.strokeStyle = '#54a0ff';
              const oversoldY = subplotH - ((oversold - cciMin) / cciRange) * subplotH;
              ctx.beginPath();
              ctx.moveTo(0, oversoldY);
              ctx.lineTo(subplotW, oversoldY);
              ctx.stroke();
              
              // Draw zero line
              ctx.strokeStyle = '#888';
              ctx.lineWidth = 1;
              ctx.setLineDash([2, 2]);
              const zeroY = subplotH - ((0 - cciMin) / cciRange) * subplotH;
              ctx.beginPath();
              ctx.moveTo(0, zeroY);
              ctx.lineTo(subplotW, zeroY);
              ctx.stroke();
              ctx.setLineDash([]);

              // Draw CCI line
              ctx.strokeStyle = '#ff6b6b';
              ctx.lineWidth = 2;
              ctx.beginPath();
              let firstPoint = true;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < cciData.length && !isNaN(cciData[idx])) {
                  const x = (subplotW / displayCount) * i + (subplotW / displayCount) / 2;
                  const y = subplotH - ((cciData[idx] - cciMin) / cciRange) * subplotH;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();
            }
            break;

          case 'adx':
            if (indicator.data && indicator.data.adx && indicator.data.plusDI && indicator.data.minusDI) {
              const adxData = indicator.data.adx;
              const plusDI = indicator.data.plusDI;
              const minusDI = indicator.data.minusDI;
              
              // ADX ranges from 0 to 100
              const adxMax = 100;
              const adxMin = 0;
              const adxRange = adxMax - adxMin;

              // Draw threshold line (default: 25)
              const threshold = indicator.config.adx?.threshold || 25;
              ctx.strokeStyle = '#888';
              ctx.lineWidth = 1;
              ctx.setLineDash([5, 5]);
              const thresholdY = subplotH - ((threshold - adxMin) / adxRange) * subplotH;
              ctx.beginPath();
              ctx.moveTo(0, thresholdY);
              ctx.lineTo(subplotW, thresholdY);
              ctx.stroke();
              ctx.setLineDash([]);

              // Draw +DI line (green)
              ctx.strokeStyle = '#4caf50';
              ctx.lineWidth = 2;
              ctx.beginPath();
              let firstPoint = true;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < plusDI.length && !isNaN(plusDI[idx])) {
                  const x = (subplotW / displayCount) * i + (subplotW / displayCount) / 2;
                  const y = subplotH - ((plusDI[idx] - adxMin) / adxRange) * subplotH;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();

              // Draw -DI line (red)
              ctx.strokeStyle = '#f44336';
              ctx.lineWidth = 2;
              ctx.beginPath();
              firstPoint = true;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < minusDI.length && !isNaN(minusDI[idx])) {
                  const x = (subplotW / displayCount) * i + (subplotW / displayCount) / 2;
                  const y = subplotH - ((minusDI[idx] - adxMin) / adxRange) * subplotH;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();

              // Draw ADX line (blue, thicker)
              ctx.strokeStyle = '#2196f3';
              ctx.lineWidth = 3;
              ctx.beginPath();
              firstPoint = true;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < adxData.length && !isNaN(adxData[idx])) {
                  const x = (subplotW / displayCount) * i + (subplotW / displayCount) / 2;
                  const y = subplotH - ((adxData[idx] - adxMin) / adxRange) * subplotH;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
              });
              ctx.stroke();
            }
            break;

          case 'atr':
            if (indicator.data && Array.isArray(indicator.data)) {
              const atrData = indicator.data;
              
              
              
              // Find min/max for scaling (only from visible window)
              const visibleValues: number[] = [];
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < atrData.length && idx >= 0 && !isNaN(atrData[idx]) && atrData[idx] > 0) {
                  visibleValues.push(atrData[idx]);
                }
              });
              
              console.log('[PriceChart] ATR visible values count:', visibleValues.length, 'sample:', visibleValues.slice(0, 5));
              
              if (visibleValues.length === 0) {
                console.warn('[PriceChart] ATR: No valid values found');
                break;
              }
              
              const atrMax = Math.max(...visibleValues);
              const atrMin = Math.min(...visibleValues);
              const atrRange = atrMax - atrMin || 1;

              console.log('[PriceChart] ATR range - min:', atrMin, 'max:', atrMax, 'range:', atrRange);

              // Draw ATR line
              ctx.strokeStyle = indicator.config.atr?.color || '#9e9e9e';
              ctx.lineWidth = 2;
              ctx.beginPath();
              let firstPoint = true;
              let pointsDrawn = 0;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < atrData.length && idx >= 0 && !isNaN(atrData[idx]) && atrData[idx] > 0) {
                  const x = (subplotW / displayCount) * i + (subplotW / displayCount) / 2;
                  const y = subplotH - ((atrData[idx] - atrMin) / atrRange) * subplotH;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                  pointsDrawn++;
                }
              });
              if (pointsDrawn > 0) {
                ctx.stroke();
              }
              console.log('[PriceChart] ATR: Drawn', pointsDrawn, 'points');
            } else {
              console.warn('[PriceChart] ATR: Invalid data -', indicator.data);
            }
            break;

          case 'volume':
            if (indicator.data && indicator.data.volume) {
              const volumeData = indicator.data.volume;
              const avgVolumeData = indicator.data.avgVolume || [];
              
              
              
              // Find min/max for scaling (only from visible window)
              const visibleVolumes: number[] = [];
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < volumeData.length && idx >= 0 && !isNaN(volumeData[idx]) && volumeData[idx] > 0) {
                  visibleVolumes.push(volumeData[idx]);
                }
              });
              
              console.log('[PriceChart] Volume visible values count:', visibleVolumes.length, 'sample:', visibleVolumes.slice(0, 5));
              
              if (visibleVolumes.length === 0) {
                console.warn('[PriceChart] Volume: No valid values found');
                break;
              }
              
              const volumeMax = Math.max(...visibleVolumes);
              const volumeMin = 0; // Volume sempre começa em 0
              const volumeRange = volumeMax - volumeMin || 1;

              console.log('[PriceChart] Volume range - min:', volumeMin, 'max:', volumeMax, 'range:', volumeRange);

              // Draw volume bars
              let barsDrawn = 0;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < volumeData.length && idx >= 0 && !isNaN(volumeData[idx]) && volumeData[idx] > 0) {
                  const volume = volumeData[idx];
                  const barWidth = (subplotW / displayCount) * 0.8;
                  const x = (subplotW / displayCount) * i + (subplotW / displayCount) / 2 - barWidth / 2;
                  const barHeight = ((volume - volumeMin) / volumeRange) * subplotH;
                  const y = subplotH - barHeight;
                  
                  // Color based on candle direction (green if close >= open, red otherwise)
                  ctx.fillStyle = candle.close >= candle.open ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)';
                  ctx.fillRect(x, y, barWidth, barHeight);
                  barsDrawn++;
                }
              });
              console.log('[PriceChart] Volume: Drawn', barsDrawn, 'bars');

              // Draw average volume line (if available)
              if (avgVolumeData.length > 0) {
                ctx.strokeStyle = indicator.config.volume?.avgColor || '#2196f3';
                ctx.lineWidth = 2;
                ctx.beginPath();
                let firstPoint = true;
                windowData.forEach((candle, i) => {
                  const idx = xOffset + i;
                  if (idx < avgVolumeData.length && idx >= 0 && !isNaN(avgVolumeData[idx])) {
                    const x = (subplotW / displayCount) * i + (subplotW / displayCount) / 2;
                    const y = subplotH - ((avgVolumeData[idx] - volumeMin) / volumeRange) * subplotH;
                    if (firstPoint) {
                      ctx.moveTo(x, y);
                      firstPoint = false;
                    } else {
                      ctx.lineTo(x, y);
                    }
                  }
                });
                ctx.stroke();
              }
            } else {
              console.warn('[PriceChart] Volume: Invalid data -', indicator.data);
            }
            break;

          case 'obv':
            if (indicator.data && indicator.data.obv && indicator.data.smoothedOBV) {
              const obvData = indicator.data.obv;
              const smoothedOBVData = indicator.data.smoothedOBV;
              
              
              
              // Find min/max for scaling (only from visible window)
              const visibleOBV: number[] = [];
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < obvData.length && idx >= 0 && !isNaN(obvData[idx])) {
                  visibleOBV.push(obvData[idx]);
                }
              });
              
              console.log('[PriceChart] OBV visible values count:', visibleOBV.length, 'sample:', visibleOBV.slice(0, 5));
              
              if (visibleOBV.length === 0) {
                console.warn('[PriceChart] OBV: No valid values found');
                break;
              }
              
              const obvMax = Math.max(...visibleOBV);
              const obvMin = Math.min(...visibleOBV);
              const obvRange = obvMax - obvMin || 1;

              console.log('[PriceChart] OBV range - min:', obvMin, 'max:', obvMax, 'range:', obvRange);

              // Draw OBV line
              ctx.strokeStyle = indicator.config.obv?.color || '#ff6b6b';
              ctx.lineWidth = 2;
              ctx.beginPath();
              let firstPoint = true;
              let pointsDrawn = 0;
              windowData.forEach((candle, i) => {
                const idx = xOffset + i;
                if (idx < obvData.length && idx >= 0 && !isNaN(obvData[idx])) {
                  const x = (subplotW / displayCount) * i + (subplotW / displayCount) / 2;
                  const y = subplotH - ((obvData[idx] - obvMin) / obvRange) * subplotH;
                  if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                  } else {
                    ctx.lineTo(x, y);
                  }
                  pointsDrawn++;
                }
              });
              ctx.stroke();
              console.log('[PriceChart] OBV: Drawn', pointsDrawn, 'points');

              // Draw smoothed OBV line (if available and has valid data)
              const hasValidSmoothed = smoothedOBVData.some((val: number) => !isNaN(val));
              if (hasValidSmoothed) {
                ctx.strokeStyle = indicator.config.obv?.smoothedColor || '#2196f3';
                ctx.lineWidth = 2;
                ctx.beginPath();
                firstPoint = true;
                windowData.forEach((candle, i) => {
                  const idx = xOffset + i;
                  if (idx < smoothedOBVData.length && idx >= 0 && !isNaN(smoothedOBVData[idx])) {
                    const x = (subplotW / displayCount) * i + (subplotW / displayCount) / 2;
                    const y = subplotH - ((smoothedOBVData[idx] - obvMin) / obvRange) * subplotH;
                    if (firstPoint) {
                      ctx.moveTo(x, y);
                      firstPoint = false;
                    } else {
                      ctx.lineTo(x, y);
                    }
                  }
                });
                ctx.stroke();
              }
            } else {
              console.warn('[PriceChart] OBV: Invalid data -', indicator.data);
            }
            break;
        }
      });

      ctx.restore();
    }

    // bottom labels
    ctx.fillStyle = theme.palette.text.secondary;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const step = Math.max(1, Math.floor(displayCount / 5));
    windowData.forEach((d, idx) => {
      if (idx % step === 0) {
        const x = margin.left + (cw / displayCount) * idx + (cw / displayCount) / 2;
        const label = new Date(d.time).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        ctx.fillText(label, x, margin.top + ch + 4);
      }
    });

    // crosshair
    if (crosshair) {
      const cx = crosshair.x;
      const cy = crosshair.y;
      ctx.save();
      ctx.setLineDash([4, 2]);
      ctx.strokeStyle = theme.palette.text.secondary;
      ctx.beginPath();
      ctx.moveTo(margin.left, cy);
      ctx.lineTo(margin.left + cw, cy);
      ctx.moveTo(cx, margin.top);
      ctx.lineTo(cx, margin.top + ch);
      ctx.stroke();
      ctx.restore();

      // tooltip price & time
      const priceAtY =
        zoomedYMin + ((margin.top + ch - cy) / ch) * zoomedYRange;
      const relX = cx - margin.left;
      const i = Math.floor((relX / cw) * displayCount);
      const timed = windowData[Math.min(Math.max(i, 0), windowData.length - 1)].time;

      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(cx + 5, cy - 25, 80, 20);
      ctx.fillRect(cx - 40, margin.top + ch + 5, 80, 20);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`$${priceAtY.toFixed(2)}`, cx + 8, cy - 15);
      ctx.fillText(
        new Date(timed).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        cx - 38,
        margin.top + ch + 15
      );
    }
    
    // Mark that drawing is complete
    isDrawingRef.current = false;
    
    // Clear zoom loading state after drawing completes
    if (isZoomProcessing) {
      requestAnimationFrame(() => {
        setIsZoomProcessing(false);
      });
    }
  }, [
    data,
    xOffset,
    displayCount,
    crosshair,
    showGrid,
    theme,
    calculateIndicators,
    positions,
    pendingOrders,
    symbol,
    yZoom,
  ]);

  // Usar ref para armazenar a função drawChart mais recente
  const drawChartRef = useRef(drawChart);
  drawChartRef.current = drawChart;
  
  // Ref para requestAnimationFrame do crosshair
  const animationFrameRef = useRef<number | null>(null);
  
  // Effect para dados principais (sem crosshair para evitar loops)
  useEffect(() => {
    // Não fazer nada se não houver dados
    if (data.length === 0) {
      return;
    }
    
    // Chamar drawChart diretamente (como BotChart) para resposta imediata
    drawChartRef.current();
    
    // Clear zoom processing state after drawing completes
    // Use requestAnimationFrame to ensure drawing is complete
    const clearZoomFrame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsZoomProcessing(false);
        isDrawingRef.current = false;
        zoomStartTimeRef.current = null;
      });
    });
    
    return () => {
      cancelAnimationFrame(clearZoomFrame);
    };
  }, [data.length, xOffset, displayCount, symbol, indicators.length, yZoom, showGrid, calculateIndicators, positions, pendingOrders, theme]);
  
  // Effect separado para crosshair (com requestAnimationFrame para suavizar)
  useEffect(() => {
    if (!crosshair || data.length === 0) {
      return;
    }
    
    // Cancelar frame anterior se existir
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Usar requestAnimationFrame para suavizar atualizações do crosshair
    animationFrameRef.current = requestAnimationFrame(() => {
      drawChartRef.current();
    });
    
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [crosshair]);
  
  // Wheel zoom listener nativo (não-passivo) para permitir preventDefault
  const zoomDisplayCountRef = useRef(displayCount);
  const zoomXOffsetRef = useRef(xOffset);
  const zoomDataLengthRef = useRef(data.length);
  const zoomYZoomRef = useRef(yZoom);
  const zoomZoomLevelRef = useRef(zoomLevel);
  
  useEffect(() => {
    zoomDisplayCountRef.current = displayCount;
    zoomXOffsetRef.current = xOffset;
    zoomDataLengthRef.current = data.length;
    zoomYZoomRef.current = yZoom;
    zoomZoomLevelRef.current = zoomLevel;
  }, [displayCount, xOffset, data.length, yZoom, zoomLevel]);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handler = (e: WheelEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Verificar se está sobre a área do gráfico
      if (mouseX < margin.left || mouseX > rect.width - margin.right ||
          mouseY < margin.top || mouseY > rect.height - margin.bottom) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      const isOverYAxis = mouseX < margin.left;
      const currentDisplayCount = zoomDisplayCountRef.current;
      const currentXOffset = zoomXOffsetRef.current;
      const currentDataLength = zoomDataLengthRef.current;
      const currentYZoom = zoomYZoomRef.current;
      const currentZoomLevel = zoomZoomLevelRef.current;
      
      if (isOverYAxis) {
        // Vertical zoom - apply immediately
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newYZoom = Math.max(0.1, Math.min(5, currentYZoom * zoomFactor));
        setYZoom(newYZoom);
      } else {
        // Horizontal zoom - use debounced updates for smooth performance
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const plotWidth = rect.width - margin.left - margin.right;
        const relativeX = Math.max(0, Math.min(1, (mouseX - margin.left) / plotWidth));
        const dataIndex = Math.round(relativeX * (pendingZoomUpdateRef.current?.displayCount || currentDisplayCount));
        
        const effectiveDisplayCount = pendingZoomUpdateRef.current?.displayCount || currentDisplayCount;
        const effectiveXOffset = pendingZoomUpdateRef.current?.xOffset || currentXOffset;
        const effectiveZoomLevel = pendingZoomUpdateRef.current?.zoomLevel || currentZoomLevel;
        
        const newZoomLevel = Math.max(0.1, Math.min(10, effectiveZoomLevel * zoomFactor));
        const newDisplayCount = Math.max(10, Math.min(500, Math.round(100 / newZoomLevel)));
        const zoomCenterIndex = effectiveXOffset + dataIndex;
        const newOffset = Math.max(0, Math.min(
          currentDataLength - newDisplayCount,
          zoomCenterIndex - Math.round(dataIndex * newDisplayCount / effectiveDisplayCount)
        ));
        
        // Store pending update instead of applying immediately
        pendingZoomUpdateRef.current = {
          zoomLevel: newZoomLevel,
          displayCount: newDisplayCount,
          xOffset: newOffset,
        };
        
        // Cancel previous animation frame if exists
        if (zoomAnimationFrameRef.current !== null) {
          cancelAnimationFrame(zoomAnimationFrameRef.current);
        }
        
        // Schedule update for next animation frame (debounces rapid zoom)
        zoomAnimationFrameRef.current = requestAnimationFrame(applyPendingZoom);
      }
    };
    
    container.addEventListener('wheel', handler, { passive: false, capture: true });
    
    return () => {
      container.removeEventListener('wheel', handler, { capture: true } as any);
    };
  }, [margin, applyPendingZoom]);
  
  useEffect(() => {
    const handleResize = () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (data.length > 0) {
        animationFrameRef.current = requestAnimationFrame(() => {
          drawChartRef.current();
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [data.length]);

  // mouse handlers - direct state update like BotChart for immediate response
  const onMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (isPanning) {
      const delta = e.clientX - panStartX.current;
      // convert pixel delta into candle count delta
      const div = containerRef.current!;
      const cw = div.clientWidth - 60 - 10; // margin adjustments
      const candleWidth = cw / displayCount;
      const shift = Math.round(-delta / candleWidth);
      let newOffset = panStartOffset.current + shift;
      newOffset = Math.max(0, Math.min(data.length - displayCount, newOffset));
      setXOffset(newOffset);
    } else {
      // Direct state update for immediate response (like BotChart)
      setCrosshair({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, [isPanning, data.length, displayCount]);
  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    // Se estiver no modo de seleção Fibonacci, capturar pontos
    if (fibonacciSelectingMode && e.button === 0) {
      e.preventDefault();
      e.stopPropagation();
      
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Verificar se o clique foi dentro da área do gráfico
      if (mouseX >= margin.left && mouseX <= rect.width - margin.right &&
          mouseY >= margin.top && mouseY <= rect.height - margin.bottom) {
        
        const div = containerRef.current!;
        const cw = div.clientWidth - margin.left - margin.right;
        const h = div.clientHeight;
        
        // Calcular altura do gráfico principal
        const needsSubplot = indicators.some((ind: IndicatorConfig | undefined) => 
          ind?.type === 'rsi' || ind?.type === 'macd' || ind?.type === 'stochastic_oscillator' || 
          ind?.type === 'cci' || ind?.type === 'adx' || ind?.type === 'volume' || ind?.type === 'obv' || ind?.type === 'williamsr'
        );
        const mainChartHeight = needsSubplot ? h * 0.7 : h - margin.top - margin.bottom;
        
        // Calcular índice do candle
        const relativeX = (mouseX - margin.left) / cw;
        const candleIndex = Math.round(relativeX * displayCount) + xOffset;
        const candle = candleIndex >= 0 && candleIndex < data.length ? data[candleIndex] : null;
        
        if (!candle) return;
        
        // Calcular preço baseado na posição Y
        const windowData = data.slice(xOffset, xOffset + displayCount);
        const relativeY = (mouseY - margin.top) / mainChartHeight;
        const zoomedYMin = Math.min(...windowData.map((c: Candle) => c.low)) * (1 - yZoom * 0.1);
        const zoomedYMax = Math.max(...windowData.map((c: Candle) => c.high)) * (1 + yZoom * 0.1);
        const zoomedYRange = zoomedYMax - zoomedYMin;
        const price = zoomedYMax - (relativeY * zoomedYRange);
        
        if (fibonacciSelectingMode.step === 'first') {
          // Primeiro ponto selecionado - usar callback para garantir atualização correta
          const firstPoint = { x: mouseX, y: mouseY, price, index: candleIndex };
          setFibonacciSelectingMode((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              step: 'second',
              firstPoint
            };
          });
          console.log('✅ Primeiro ponto Fibonacci selecionado:', { price, index: candleIndex });
        } else if (fibonacciSelectingMode.step === 'second') {
          // Segundo ponto selecionado - usar callback para garantir que temos o primeiro ponto correto
          setFibonacciSelectingMode((prev) => {
            if (!prev || !prev.firstPoint) return null;
            
            // Atualizar config do Fibonacci
            const updatedIndicators = [...indicators];
            const fibIndicator = updatedIndicators[prev.indicatorIndex];
            
            if (fibIndicator) {
              if (!fibIndicator.fibonacci) {
                // Criar config fibonacci se não existir
                fibIndicator.fibonacci = {
                  color: '#9c27b0',
                  lineWidth: 1,
                  showLabels: true,
                  levels: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0],
                };
              }
              
              fibIndicator.fibonacci = {
                ...fibIndicator.fibonacci,
                startIndex: prev.firstPoint.index,
                endIndex: candleIndex,
                startPrice: prev.firstPoint.price,
                endPrice: price,
              };
              
              console.log('✅ Segundo ponto Fibonacci selecionado:', { 
                startPrice: prev.firstPoint.price, 
                endPrice: price,
                startIndex: prev.firstPoint.index,
                endIndex: candleIndex
              });
              
              setIndicators(updatedIndicators);
            }
            
            return null; // Desativar modo de seleção
          });
        }
      }
      return;
    }
    
    // Se estiver no modo de seleção Elliott Wave, capturar pontos
    if (elliottSelectingMode && e.button === 0) {
      e.preventDefault();
      e.stopPropagation();
      
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Verificar se o clique foi dentro da área do gráfico
      if (mouseX >= margin.left && mouseX <= rect.width - margin.right &&
          mouseY >= margin.top && mouseY <= rect.height - margin.bottom) {
        
        const div = containerRef.current!;
        const cw = div.clientWidth - margin.left - margin.right;
        const h = div.clientHeight;
        
        // Calcular altura do gráfico principal
        const needsSubplot = indicators.some((ind: IndicatorConfig | undefined) => 
          ind?.type === 'rsi' || ind?.type === 'macd' || ind?.type === 'stochastic_oscillator' || 
          ind?.type === 'cci' || ind?.type === 'adx' || ind?.type === 'volume' || ind?.type === 'obv' || ind?.type === 'williamsr'
        );
        const mainChartHeight = needsSubplot ? h * 0.7 : h - margin.top - margin.bottom;
        
        // Calcular índice do candle
        const relativeX = (mouseX - margin.left) / cw;
        const candleIndex = Math.round(relativeX * displayCount) + xOffset;
        const candle = candleIndex >= 0 && candleIndex < data.length ? data[candleIndex] : null;
        
        if (!candle) return;
        
        // Calcular preço baseado na posição Y
        const windowData = data.slice(xOffset, xOffset + displayCount);
        const relativeY = (mouseY - margin.top) / mainChartHeight;
        const zoomedYMin = Math.min(...windowData.map((c: Candle) => c.low)) * (1 - yZoom * 0.1);
        const zoomedYMax = Math.max(...windowData.map((c: Candle) => c.high)) * (1 + yZoom * 0.1);
        const zoomedYRange = zoomedYMax - zoomedYMin;
        const price = zoomedYMax - (relativeY * zoomedYRange);
        
        // Atualizar config do Elliott Wave
        setElliottSelectingMode((prev) => {
          if (!prev) return null;
          
          const updatedIndicators = [...indicators];
          const elliottIndicator = updatedIndicators[prev.indicatorIndex];
          
          if (elliottIndicator) {
            if (!elliottIndicator.elliott) {
              elliottIndicator.elliott = {
                color: '#ff9800',
                lineWidth: 2,
                showLabels: true,
              };
            }
            
            // Salvar o ponto da onda atual
            const wavePoint = { price, index: candleIndex };
            switch (prev.currentWave) {
              case 1:
                elliottIndicator.elliott.wave1 = wavePoint;
                break;
              case 2:
                elliottIndicator.elliott.wave2 = wavePoint;
                break;
              case 3:
                elliottIndicator.elliott.wave3 = wavePoint;
                break;
              case 4:
                elliottIndicator.elliott.wave4 = wavePoint;
                break;
              case 5:
                elliottIndicator.elliott.wave5 = wavePoint;
                break;
            }
            
            console.log(`✅ Onda ${prev.currentWave} de Elliott selecionada:`, { price, index: candleIndex });
            
            // Avançar para próxima onda ou desativar modo de seleção
            let nextWave: 1 | 2 | 3 | 4 | 5 | 'A' | 'B' | 'C' | null = null;
            if (prev.currentWave === 1) nextWave = 2;
            else if (prev.currentWave === 2) nextWave = 3;
            else if (prev.currentWave === 3) nextWave = 4;
            else if (prev.currentWave === 4) nextWave = 5;
            else if (prev.currentWave === 5) {
              // Todas as 5 ondas impulsivas completas - opcionalmente continuar com A-B-C
              nextWave = null; // Desativar ou continuar com 'A' se quiser permitir ondas corretivas
            }
            
            setIndicators(updatedIndicators);
            
            if (nextWave === null) {
              return null; // Desativar modo de seleção
            }
            
            return {
              ...prev,
              currentWave: nextWave as 1 | 2 | 3 | 4 | 5
            };
          }
          
          return prev;
        });
      }
      return;
    }
    
    // Se não estiver no modo de seleção mas houver um Elliott sem pontos, ativar automaticamente e processar o clique
    if (!fibonacciSelectingMode && !elliottSelectingMode && e.button === 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Verificar se o clique foi dentro da área do gráfico
      if (mouseX >= margin.left && mouseX <= rect.width - margin.right &&
          mouseY >= margin.top && mouseY <= rect.height - margin.bottom) {
        
        const elliottIndex = indicators.findIndex((ind) => 
          ind.type === 'elliott' && 
          (!ind.elliott || !ind.elliott.wave1 || !ind.elliott.wave2 || !ind.elliott.wave3 || !ind.elliott.wave4 || !ind.elliott.wave5)
        );
        
        if (elliottIndex !== -1) {
          e.preventDefault();
          e.stopPropagation();
          
          // Calcular dados do primeiro ponto
          const div = containerRef.current!;
          const cw = div.clientWidth - margin.left - margin.right;
          const h = div.clientHeight;
          
          const needsSubplot = indicators.some((ind: IndicatorConfig | undefined) => 
            ind?.type === 'rsi' || ind?.type === 'macd' || ind?.type === 'stochastic_oscillator' || 
            ind?.type === 'cci' || ind?.type === 'adx' || ind?.type === 'volume' || ind?.type === 'obv' || ind?.type === 'williamsr'
          );
          const mainChartHeight = needsSubplot ? h * 0.7 : h - margin.top - margin.bottom;
          
          const relativeX = (mouseX - margin.left) / cw;
          const candleIndex = Math.round(relativeX * displayCount) + xOffset;
          const candle = candleIndex >= 0 && candleIndex < data.length ? data[candleIndex] : null;
          
          if (candle) {
            const windowData = data.slice(xOffset, xOffset + displayCount);
            const relativeY = (mouseY - margin.top) / mainChartHeight;
            const zoomedYMin = Math.min(...windowData.map((c: Candle) => c.low)) * (1 - yZoom * 0.1);
            const zoomedYMax = Math.max(...windowData.map((c: Candle) => c.high)) * (1 + yZoom * 0.1);
            const zoomedYRange = zoomedYMax - zoomedYMin;
            const price = zoomedYMax - (relativeY * zoomedYRange);
            
            // Determinar qual onda precisa ser selecionada
            const elliottConfig = indicators[elliottIndex].elliott;
            let nextWave: 1 | 2 | 3 | 4 | 5 = 1;
            
            if (elliottConfig?.wave1) nextWave = 2;
            if (elliottConfig?.wave2) nextWave = 3;
            if (elliottConfig?.wave3) nextWave = 4;
            if (elliottConfig?.wave4) nextWave = 5;
            
            // Ativar modo de seleção e processar o primeiro ponto
            setElliottSelectingMode({
              indicatorIndex: elliottIndex,
              currentWave: nextWave
            });
            
            // Processar o clique como primeiro ponto da onda
            const updatedIndicators = [...indicators];
            const elliottIndicator = updatedIndicators[elliottIndex];
            
            if (elliottIndicator) {
              if (!elliottIndicator.elliott) {
                elliottIndicator.elliott = {
                  color: '#ff9800',
                  lineWidth: 2,
                  showLabels: true,
                };
              }
              
              const wavePoint = { price, index: candleIndex };
              switch (nextWave) {
                case 1:
                  elliottIndicator.elliott.wave1 = wavePoint;
                  break;
                case 2:
                  elliottIndicator.elliott.wave2 = wavePoint;
                  break;
                case 3:
                  elliottIndicator.elliott.wave3 = wavePoint;
                  break;
                case 4:
                  elliottIndicator.elliott.wave4 = wavePoint;
                  break;
                case 5:
                  elliottIndicator.elliott.wave5 = wavePoint;
                  break;
              }
              
              setIndicators(updatedIndicators);
              
              // Avançar para próxima onda se necessário
              if (nextWave < 5) {
                setElliottSelectingMode({
                  indicatorIndex: elliottIndex,
                  currentWave: (nextWave + 1) as 2 | 3 | 4 | 5
                });
              } else {
                setElliottSelectingMode(null);
              }
              
              console.log(`✅ Onda ${nextWave} de Elliott selecionada (auto):`, { price, index: candleIndex });
            }
          }
          return;
        }
      }
    }
    
    // Se não estiver no modo de seleção mas houver um Fibonacci sem pontos, ativar automaticamente e processar o clique
    if (!fibonacciSelectingMode && !elliottSelectingMode && e.button === 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Verificar se o clique foi dentro da área do gráfico
      if (mouseX >= margin.left && mouseX <= rect.width - margin.right &&
          mouseY >= margin.top && mouseY <= rect.height - margin.bottom) {
        
        const fibIndex = indicators.findIndex((ind) => 
          ind.type === 'fibonacci' && 
          (!ind.fibonacci || ind.fibonacci.startPrice === undefined || ind.fibonacci.endPrice === undefined)
        );
        
        if (fibIndex !== -1) {
          e.preventDefault();
          e.stopPropagation();
          
          // Calcular dados do primeiro ponto
          const div = containerRef.current!;
          const cw = div.clientWidth - margin.left - margin.right;
          const h = div.clientHeight;
          
          const needsSubplot = indicators.some((ind: IndicatorConfig | undefined) => 
            ind?.type === 'rsi' || ind?.type === 'macd' || ind?.type === 'stochastic_oscillator' || 
            ind?.type === 'cci' || ind?.type === 'adx' || ind?.type === 'volume' || ind?.type === 'obv' || ind?.type === 'williamsr'
          );
          const mainChartHeight = needsSubplot ? h * 0.7 : h - margin.top - margin.bottom;
          
          const relativeX = (mouseX - margin.left) / cw;
          const candleIndex = Math.round(relativeX * displayCount) + xOffset;
          const candle = candleIndex >= 0 && candleIndex < data.length ? data[candleIndex] : null;
          
          if (candle) {
            const windowData = data.slice(xOffset, xOffset + displayCount);
            const relativeY = (mouseY - margin.top) / mainChartHeight;
            const zoomedYMin = Math.min(...windowData.map((c: Candle) => c.low)) * (1 - yZoom * 0.1);
            const zoomedYMax = Math.max(...windowData.map((c: Candle) => c.high)) * (1 + yZoom * 0.1);
            const zoomedYRange = zoomedYMax - zoomedYMin;
            const price = zoomedYMax - (relativeY * zoomedYRange);
            
            // Ativar modo de seleção com primeiro ponto já definido
            setFibonacciSelectingMode({
              indicatorIndex: fibIndex,
              step: 'second',
              firstPoint: { x: mouseX, y: mouseY, price, index: candleIndex }
            });
            
            console.log('✅ Primeiro ponto Fibonacci selecionado:', { price, index: candleIndex });
          }
          return;
        }
      }
    }
    
    // wheel click is button 1
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      panStartX.current = e.clientX;
      panStartOffset.current = xOffset;
    }
  };
  const onMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    if (isPanning && e.button === 1) {
      setIsPanning(false);
    }
  };
  const onMouseLeave = () => {
    setCrosshair(null);
    setIsPanning(false);
  };

  const handleOrderCreated = (order: any) => {
    // Atualizar posições após ordem criada
    const updatedPositions = tradingAPI.getPositions();
    onPositionUpdated?.(updatedPositions);
  };

  const handlePositionUpdated = (updatedPositions: Position[]) => {
    onPositionUpdated?.(updatedPositions);
  };

  const handleClosePosition = (symbol: string) => {
    // Implementar fechamento de posição
    console.log('Fechar posição:', symbol);
  };

  const currentPrice = data.length > 0 ? data[data.length - 1].close : 0;

  // Fullscreen handler
  const handleFullscreen = async () => {
    if (!paperRef.current) return;
    
    try {
      if (!isFullscreen) {
        if (paperRef.current.requestFullscreen) {
          await paperRef.current.requestFullscreen();
        } else if ((paperRef.current as any).webkitRequestFullscreen) {
          await (paperRef.current as any).webkitRequestFullscreen();
        } else if ((paperRef.current as any).msRequestFullscreen) {
          await (paperRef.current as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Erro ao alternar fullscreen:', error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement || !!(document as any).webkitFullscreenElement || !!(document as any).msFullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <Paper
      ref={paperRef}
      elevation={3}
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxHeight: '100%',
        userSelect: isPanning ? 'none' : undefined,
        cursor: isPanning ? 'grabbing' : 'default',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          flexShrink: 0,
        }}
      >
        {/* Primeira linha: Adicionar Indicador à esquerda, controles à direita */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 2,
          }}
        >
          {/* Canto superior esquerdo: Adicionar Indicador */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <MultiIndicatorSelector
              indicators={indicators}
              onIndicatorsChange={setIndicators}
              onFibonacciSelectMode={(indicatorIndex, mode) => {
                if (mode === 'selecting') {
                  // Verificar se é Fibonacci ou Elliott
                  const indicator = indicators[indicatorIndex];
                  if (indicator.type === 'fibonacci') {
                    setFibonacciSelectingMode({
                      indicatorIndex,
                      step: 'first',
                      firstPoint: null
                    });
                  } else if (indicator.type === 'elliott') {
                    const elliottConfig = indicator.elliott;
                    let nextWave: 1 | 2 | 3 | 4 | 5 = 1;
                    
                    if (elliottConfig?.wave1) nextWave = 2;
                    if (elliottConfig?.wave2) nextWave = 3;
                    if (elliottConfig?.wave3) nextWave = 4;
                    if (elliottConfig?.wave4) nextWave = 5;
                    if (elliottConfig?.wave5) {
                      // Todas as ondas completas, não ativar
                      return;
                    }
                    
                    setElliottSelectingMode({
                      indicatorIndex,
                      currentWave: nextWave
                    });
                  }
                } else {
                  setFibonacciSelectingMode(null);
                  setElliottSelectingMode(null);
                }
              }}
            />
          </Box>

          {/* Canto superior direito: Controles */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Select
              value={interval}
              size="small"
              onChange={(e) =>
                setIntervalState(e.target.value as any)
              }
            >
              {[
                { value: '1m', label: '1 minuto' },
                { value: '5m', label: '5 minutos' },
                { value: '15m', label: '15 minutos' },
                { value: '1h', label: '1 hora' },
                { value: '4h', label: '4 horas' },
                { value: '1d', label: '1 dia' },
                { value: '1w', label: '1 semana' },
                { value: '1M', label: '1 mês' },
              ].map((iv) => (
                <MenuItem key={iv.value} value={iv.value}>
                  {iv.label}
                </MenuItem>
              ))}
            </Select>

            <IconButton
              size="small"
              onClick={() => setShowGrid((g) => !g)}
              color={showGrid ? 'primary' : 'default'}
              title="Mostrar/Ocultar Grade"
            >
              {showGrid ? <GridOnIcon /> : <GridOffIcon />}
            </IconButton>

            <IconButton
              size="small"
              onClick={resetZoom}
              disabled={zoomLevel === 1}
              title="Reset Zoom"
            >
              <RestartAltIcon />
            </IconButton>

            <IconButton
              size="small"
              onClick={handleFullscreen}
              title={isFullscreen ? "Sair do Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>

            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              Zoom: {Math.round(zoomLevel * 100)}%
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        ref={containerRef}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        sx={{
          flex: 1,
          position: 'relative',
          backgroundColor: theme.palette.background.paper,
          minHeight: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: isPanning ? 'grabbing' : 'crosshair',
          }}
        />
        
        {/* Overlay de carregamento */}
        {(isLoadingPositions || isZoomProcessing) && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <Box
              sx={{
                backgroundColor: 'background.paper',
                borderRadius: 2,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {isZoomProcessing ? 'Processando zoom...' : 'Carregando posições...'}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

    </Paper>
  );
};

export default PriceChart;
