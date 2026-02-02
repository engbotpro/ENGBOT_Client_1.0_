import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Paper, CircularProgress, Alert, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { fetchKlines, fetchHistoricalKlines, Candle } from '../../services/binanceAPI';
import { Bot } from '../../types/bot';
import {
  calculateMovingAverage,
  calculateBollingerBands,
  calculateMACD,
  calculateRSI,
  calculateStochasticOscillator,
  calculateIchimokuCloud,
  calculateWMA,
  calculateHMA
} from '../Graph/indicators/calculations';

interface BotChartProps {
  bot: Bot;
  trades: Array<{
    id: string;
    side: 'buy' | 'sell';
    entryTime: string;
    exitTime?: string | null;
    price: number;
    exitPrice?: number | null;
    pnl?: number | null;
  }>;
  candles?: Candle[]; // Candles opcionais (para backtest)
  startDate?: string; // Data inicial para backtest
  endDate?: string; // Data final para backtest
}

// Mapear timeframe do bot para intervalo Binance
const mapTimeframeToInterval = (timeframe: string): string => {
  const mapping: { [key: string]: string } = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
  };
  return mapping[timeframe] || '1h';
};

// Mapear timeframe para milissegundos
const mapTimeframeToIntervalMs = (timeframe: string): number => {
  const mapping: { [key: string]: number } = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };
  return mapping[timeframe] || 60 * 60 * 1000;
};

const BotChart: React.FC<BotChartProps> = ({ bot, trades, candles: providedCandles, startDate, endDate }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(100);
  const [xOffset, setXOffset] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const panStartX = useRef(0);
  const panStartOffset = useRef(0);
  const [showGrid, setShowGrid] = useState(true);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  
  // Refs para manter valores atualizados no handler
  const displayCountRef = useRef(displayCount);
  const xOffsetRef = useRef(xOffset);
  const candlesRef = useRef(candles);
  
  // Atualizar refs quando valores mudarem
  useEffect(() => {
    displayCountRef.current = displayCount;
    xOffsetRef.current = xOffset;
    candlesRef.current = candles;
  }, [displayCount, xOffset, candles]);

  const Y_AXIS_WIDTH = 80;
  const margin = { top: 10, right: 10, bottom: 30, left: Y_AXIS_WIDTH };

  // Carregar candles
  useEffect(() => {
    // Se candles foram fornecidos (backtest), usar diretamente
    if (providedCandles && providedCandles.length > 0) {
      console.log('📊 Usando candles fornecidos (backtest):', providedCandles.length);
      setCandles(providedCandles);
      if (providedCandles.length > displayCount) {
        setXOffset(providedCandles.length - displayCount);
      }
      setLoading(false);
      return;
    }

    const loadCandles = async () => {
      try {
        setLoading(true);
        setError(null);
        const interval = mapTimeframeToInterval(bot.config.timeframe);
        
        // Se temos datas de início e fim (backtest), usar fetchHistoricalKlines
        if (startDate && endDate) {
          console.log('📊 Carregando candles históricos para backtest:', { startDate, endDate });
          const startTime = new Date(startDate).getTime();
          const endTime = new Date(endDate).getTime();
          const data = await fetchHistoricalKlines(bot.config.symbol, interval, startTime, endTime);
          setCandles(data);
          
          if (data.length > displayCount) {
            setXOffset(data.length - displayCount);
          }
        } else {
          // Carregar mais candles para ter histórico suficiente (modo normal)
          const limit = 500;
          const data = await fetchKlines(bot.config.symbol, interval, limit);
          setCandles(data);
          
          // Ajustar offset inicial para mostrar os últimos candles
          if (data.length > displayCount) {
            setXOffset(data.length - displayCount);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar candles:', err);
        setError('Erro ao carregar dados do gráfico');
      } finally {
        setLoading(false);
      }
    };

    if (bot.config.symbol && bot.config.timeframe) {
      loadCandles();
    }
  }, [bot.config.symbol, bot.config.timeframe, providedCandles, startDate, endDate]);

  // Calcular indicadores baseados na configuração do bot
  const calculateIndicators = useCallback(() => {
    if (!candles.length) {
      return [];
    }

    // Se não há indicadores no array, retornar vazio
    const indicatorsToProcess = bot.config.indicators || [];
    if (indicatorsToProcess.length === 0) {
      console.log('BotChart: Nenhum indicador encontrado na configuração do bot');
      return [];
    }

    console.log('BotChart: Processando indicadores:', indicatorsToProcess);

    const indicators: any[] = [];

    indicatorsToProcess.forEach((indicator) => {
      const indicatorName = (indicator.name || '').toLowerCase();
      const params = indicator.parameters || {};

      console.log(`BotChart: Calculando indicador ${indicatorName} com parâmetros:`, params);

      try {
        switch (indicatorName) {
          case 'sma':
            indicators.push({
              type: 'moving_average',
              data: calculateMovingAverage(candles, {
                period: params.period || 20,
                type: 'simple'
              }),
              config: indicator,
              color: '#2196F3'
            });
            break;

          case 'ema':
            indicators.push({
              type: 'moving_average',
              data: calculateMovingAverage(candles, {
                period: params.period || 20,
                type: 'exponential'
              }),
              config: indicator,
              color: '#FF9800'
            });
            break;

          case 'wma':
            indicators.push({
              type: 'moving_average',
              data: calculateWMA(candles, {
                period: params.period || 20
              }),
              config: indicator,
              color: '#9C27B0'
            });
            break;

          case 'hma':
            indicators.push({
              type: 'moving_average',
              data: calculateHMA(candles, {
                period: params.period || 20
              }),
              config: indicator,
              color: '#E91E63'
            });
            break;

          case 'rsi':
            indicators.push({
              type: 'rsi',
              data: calculateRSI(candles, {
                period: params.period || 14
              }),
              config: indicator,
              color: '#9C27B0'
            });
            break;

          case 'macd':
            indicators.push({
              type: 'macd',
              data: calculateMACD(candles, {
                fastPeriod: params.fastPeriod || 12,
                slowPeriod: params.slowPeriod || 26,
                signalPeriod: params.signalPeriod || 9
              }),
              config: indicator,
              color: '#2196F3'
            });
            break;

          case 'bollingerbands':
            indicators.push({
              type: 'bollinger_bands',
              data: calculateBollingerBands(candles, {
                period: params.period || 20,
                standardDeviation: params.standardDeviations || 2
              }),
              config: indicator,
              color: '#4CAF50'
            });
            break;

          case 'stochastic':
            indicators.push({
              type: 'stochastic_oscillator',
              data: calculateStochasticOscillator(candles, {
                kPeriod: params.kPeriod || 14,
                dPeriod: params.dPeriod || 3,
                slowing: params.slowing || 1
              }),
              config: indicator,
              color: '#F44336'
            });
            break;

          case 'ichimokucloud':
            indicators.push({
              type: 'ichimoku_cloud',
              data: calculateIchimokuCloud(candles, {
                tenkanPeriod: params.conversionPeriod || 9,
                kijunPeriod: params.basePeriod || 26,
                senkouSpanBPeriod: params.spanPeriod || 52,
                displacement: params.displacement || 26
              }),
              config: indicator,
              color: '#FF5722'
            });
            break;

          default:
            break;
        }
      } catch (err) {
        console.error(`Erro ao calcular indicador ${indicatorName}:`, err);
      }
    });

    return indicators;
  }, [candles, bot.config.indicators]);

  // Desenhar gráfico
  const drawChart = useCallback(() => {
    if (!canvasRef.current || !candles.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const plotWidth = cw - margin.left - margin.right;
    const plotHeight = ch - margin.top - margin.bottom;

    ctx.clearRect(0, 0, cw, ch);
    // Fundo baseado no tema
    ctx.fillStyle = isDarkMode ? '#1e1e1e' : '#ffffff';
    ctx.fillRect(0, 0, cw, ch);

    // Dados visíveis
    const windowData = candles.slice(xOffset, xOffset + displayCount);
    if (!windowData.length) return;

    // Calcular escala Y
    const prices = windowData.flatMap(d => [d.high, d.low]);
    const yMin = Math.min(...prices);
    const yMax = Math.max(...prices);
    const yRange = yMax - yMin || 1;
    const yScale = plotHeight / yRange;

    // Desenhar grid primeiro (atrás de tudo)
    if (showGrid) {
      ctx.strokeStyle = isDarkMode ? '#424242' : '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      
      // Linhas horizontais (grid Y)
      const ySteps = 5;
      for (let i = 0; i <= ySteps; i++) {
        const y = margin.top + (plotHeight * i / ySteps);
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + plotWidth, y);
        ctx.stroke();
      }
      
      // Linhas verticais (grid X)
      const xSteps = 10;
      for (let i = 0; i <= xSteps; i++) {
        const x = margin.left + (plotWidth * i / xSteps);
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, margin.top + plotHeight);
        ctx.stroke();
      }
    }

    // Desenhar indicadores (sobre o grid, atrás dos candles)
    const indicators = calculateIndicators();
    indicators.forEach((indicator) => {
      if (indicator.type === 'moving_average') {
        ctx.strokeStyle = indicator.color || '#2196F3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        let firstPoint = true;
        windowData.forEach((candle, i) => {
          const idx = xOffset + i;
          if (idx < indicator.data.length && !isNaN(indicator.data[idx])) {
            const x = margin.left + (plotWidth / displayCount) * i + (plotWidth / displayCount) / 2;
            const y = margin.top + plotHeight - ((indicator.data[idx] - yMin) * yScale);
            if (firstPoint) {
              ctx.moveTo(x, y);
              firstPoint = false;
            } else {
              ctx.lineTo(x, y);
            }
          }
        });
        ctx.stroke();
      } else if (indicator.type === 'bollinger_bands') {
        const { upper, middle, lower } = indicator.data;
        // Desenhar banda (área)
        ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
        ctx.beginPath();
        windowData.forEach((candle, i) => {
          const idx = xOffset + i;
          if (idx < upper.length && !isNaN(upper[idx]) && !isNaN(lower[idx])) {
            const x = margin.left + (plotWidth / displayCount) * i + (plotWidth / displayCount) / 2;
            const yUpper = margin.top + plotHeight - ((upper[idx] - yMin) * yScale);
            const yLower = margin.top + plotHeight - ((lower[idx] - yMin) * yScale);
            if (i === 0) {
              ctx.moveTo(x, yUpper);
            } else {
              ctx.lineTo(x, yUpper);
            }
          }
        });
        // Voltar desenhando a linha inferior
        for (let i = windowData.length - 1; i >= 0; i--) {
          const idx = xOffset + i;
          if (idx < lower.length && !isNaN(lower[idx])) {
            const x = margin.left + (plotWidth / displayCount) * i + (plotWidth / displayCount) / 2;
            const yLower = margin.top + plotHeight - ((lower[idx] - yMin) * yScale);
            ctx.lineTo(x, yLower);
          }
        }
        ctx.closePath();
        ctx.fill();

        // Desenhar linhas
        [upper, middle, lower].forEach((line, lineIdx) => {
          ctx.strokeStyle = lineIdx === 1 ? '#4CAF50' : 'rgba(76, 175, 80, 0.5)';
          ctx.lineWidth = lineIdx === 1 ? 2 : 1;
          ctx.beginPath();
          let firstPoint = true;
          windowData.forEach((candle, i) => {
            const idx = xOffset + i;
            if (idx < line.length && !isNaN(line[idx])) {
              const x = margin.left + (plotWidth / displayCount) * i + (plotWidth / displayCount) / 2;
              const y = margin.top + plotHeight - ((line[idx] - yMin) * yScale);
              if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
              } else {
                ctx.lineTo(x, y);
              }
            }
          });
          ctx.stroke();
        });
      }
    });

    // Desenhar candles
    const candleW = (plotWidth / displayCount) * 0.8;
    windowData.forEach((d, i) => {
      const x0 = margin.left + (plotWidth / displayCount) * i + ((plotWidth / displayCount) - candleW) / 2;
      const yH = margin.top + plotHeight - ((d.high - yMin) * yScale);
      const yL = margin.top + plotHeight - ((d.low - yMin) * yScale);

      // Linha vertical (mecha)
      ctx.strokeStyle = isDarkMode ? '#666' : '#888';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0 + candleW / 2, yH);
      ctx.lineTo(x0 + candleW / 2, yL);
      ctx.stroke();

      // Corpo do candle
      const yO = margin.top + plotHeight - ((d.open - yMin) * yScale);
      const yC = margin.top + plotHeight - ((d.close - yMin) * yScale);
      const yTop = Math.min(yO, yC);
      const yBot = Math.max(yO, yC);
      ctx.fillStyle = d.close >= d.open ? '#4caf50' : '#f44336';
      ctx.fillRect(x0, yTop, candleW, yBot - yTop);
    });

    // Função auxiliar para encontrar o índice do candle mais próximo ao tempo
    const findClosestCandleIndex = (targetTime: number): number => {
      let closestIndex = -1;
      let minDiff = Infinity;
      
      candles.forEach((candle, index) => {
        const diff = Math.abs(candle.time - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = index;
        }
      });
      
      // Verificar se a diferença é razoável (dentro de 2x o intervalo do timeframe)
      // Para timeframes maiores, permitir mais tolerância
      const timeframeMs = mapTimeframeToIntervalMs(bot.config.timeframe);
      if (minDiff > timeframeMs * 2) {
        return -1; // Muito longe, não encontrado
      }
      
      return closestIndex;
    };

    // Função auxiliar para desenhar triângulo (entrada)
    const drawTriangle = (x: number, y: number, size: number, direction: 'up' | 'down', color: string) => {
      ctx.fillStyle = color;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (direction === 'up') {
        ctx.moveTo(x, y - size);
        ctx.lineTo(x - size, y);
        ctx.lineTo(x + size, y);
      } else {
        ctx.moveTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.lineTo(x + size, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // Função auxiliar para desenhar X (saída)
    const drawX = (x: number, y: number, size: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = '#fff';
      ctx.lineWidth = 3;
      // Círculo de fundo
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      // X
      ctx.beginPath();
      ctx.moveTo(x - size * 0.6, y - size * 0.6);
      ctx.lineTo(x + size * 0.6, y + size * 0.6);
      ctx.moveTo(x + size * 0.6, y - size * 0.6);
      ctx.lineTo(x - size * 0.6, y + size * 0.6);
      ctx.stroke();
    };

    // Desenhar trades
    trades.forEach((trade) => {
      // Encontrar índice do candle de entrada (mais próximo ao tempo do trade)
      const entryTime = new Date(trade.entryTime).getTime();
      const entryIndex = findClosestCandleIndex(entryTime);

      if (entryIndex >= 0 && entryIndex >= xOffset && entryIndex < xOffset + displayCount) {
        const x = margin.left + (plotWidth / displayCount) * (entryIndex - xOffset) + (plotWidth / displayCount) / 2;
        const y = margin.top + plotHeight - ((trade.price - yMin) * yScale);

        // Marcador de entrada: triângulo
        // Azul para compra, laranja para venda
        const entryColor = trade.side === 'buy' ? '#2196F3' : '#FF9800';
        drawTriangle(x, y, 8, trade.side === 'buy' ? 'up' : 'down', entryColor);
      }

      // Encontrar índice do candle de saída (se houver)
      if (trade.exitTime && trade.exitPrice) {
        const exitTime = new Date(trade.exitTime).getTime();
        const exitIndex = findClosestCandleIndex(exitTime);

        if (exitIndex >= 0 && exitIndex >= xOffset && exitIndex < xOffset + displayCount) {
          const x = margin.left + (plotWidth / displayCount) * (exitIndex - xOffset) + (plotWidth / displayCount) / 2;
          const y = margin.top + plotHeight - ((trade.exitPrice - yMin) * yScale);

          // Marcador de saída: X
          // Verde para lucro, vermelho para prejuízo
          const isProfit = (trade.pnl || 0) >= 0;
          const exitColor = isProfit ? '#4CAF50' : '#F44336';
          drawX(x, y, 8, exitColor);
        }
      }
    });

    // Desenhar eixos (sobre o grid)
    ctx.strokeStyle = isDarkMode ? '#666' : '#999';
    ctx.lineWidth = 2;
    // Eixo Y
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotHeight);
    ctx.stroke();
    // Eixo X
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + plotHeight);
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
    ctx.stroke();

    // Labels do eixo Y
    ctx.fillStyle = isDarkMode ? '#b0b0b0' : '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const value = yMin + (yMax - yMin) * (i / ySteps);
      const y = margin.top + plotHeight - (i * plotHeight / ySteps);
      ctx.fillText(value.toFixed(2), margin.left - 5, y + 3);
    }

    // Labels do eixo X (datas)
    ctx.fillStyle = isDarkMode ? '#b0b0b0' : '#666';
    ctx.textAlign = 'center';
    const xSteps = 5;
    for (let i = 0; i <= xSteps; i++) {
      const idx = Math.floor((xOffset + (displayCount * i / xSteps)));
      if (idx < candles.length) {
        const x = margin.left + (plotWidth * i / xSteps) + (plotWidth / displayCount) / 2;
        const date = new Date(candles[idx].time);
        ctx.fillText(
          date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
          x,
          margin.top + plotHeight + 20
        );
      }
    }

    // Desenhar cursor XY se o mouse estiver sobre o gráfico
    if (mousePosition && !isPanning) {
      const { x: mouseX, y: mouseY } = mousePosition;
      
      // Verificar se o mouse está sobre a área do gráfico
      if (mouseX >= margin.left && 
          mouseX <= margin.left + plotWidth &&
          mouseY >= margin.top && 
          mouseY <= margin.top + plotHeight) {
        
        // Desenhar linha vertical
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(mouseX, margin.top);
        ctx.lineTo(mouseX, margin.top + plotHeight);
        ctx.stroke();
        ctx.setLineDash([]);

        // Desenhar linha horizontal
        ctx.beginPath();
        ctx.moveTo(margin.left, mouseY);
        ctx.lineTo(margin.left + plotWidth, mouseY);
        ctx.stroke();

        // Calcular preço correspondente à posição Y
        const price = yMax - ((mouseY - margin.top) / plotHeight) * yRange;
        
        // Calcular índice do candle correspondente à posição X
        const relativeX = (mouseX - margin.left) / plotWidth;
        const candleIndex = Math.floor(xOffset + relativeX * displayCount);
        const candle = candleIndex >= 0 && candleIndex < candles.length ? candles[candleIndex] : null;

        // Desenhar label de preço no eixo Y (com fundo)
        ctx.fillStyle = '#2196F3';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const priceText = price.toFixed(2);
        const priceTextWidth = ctx.measureText(priceText).width;
        // Fundo arredondado
        const labelY = Math.max(margin.top + 10, Math.min(margin.top + plotHeight - 10, mouseY));
        ctx.fillRect(margin.left - priceTextWidth - 10, labelY - 10, priceTextWidth + 8, 20);
        ctx.fillStyle = isDarkMode ? '#1e1e1e' : '#ffffff';
        ctx.fillText(priceText, margin.left - 5, labelY);

        // Desenhar label de tempo no eixo X
        if (candle) {
          ctx.fillStyle = '#2196F3';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          const date = new Date(candle.time);
          const timeText = date.toLocaleString('pt-BR', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          const timeTextWidth = ctx.measureText(timeText).width;
          const labelX = Math.max(margin.left + timeTextWidth / 2 + 5, 
                          Math.min(margin.left + plotWidth - timeTextWidth / 2 - 5, mouseX));
          ctx.fillRect(labelX - timeTextWidth / 2 - 4, margin.top + plotHeight + 2, timeTextWidth + 8, 18);
          ctx.fillStyle = isDarkMode ? '#1e1e1e' : '#ffffff';
          ctx.fillText(timeText, labelX, margin.top + plotHeight + 5);
        }
      }
    }
  }, [candles, trades, xOffset, displayCount, calculateIndicators, mousePosition, isPanning, isDarkMode]);

  // Ajustar tamanho do canvas
  useEffect(() => {
    console.log('[BotChart] useEffect resizeCanvas - containerRef:', containerRef.current, 'canvasRef:', canvasRef.current);
    if (!containerRef.current || !canvasRef.current) {
      console.log('[BotChart] Container ou canvas não encontrado no resizeCanvas');
      return;
    }

    const resizeCanvas = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const container = containerRef.current;
      canvasRef.current.width = container.clientWidth;
      canvasRef.current.height = 600;
      drawChart();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawChart]);

  // Redesenhar quando dados mudarem ou posição do mouse mudar
  useEffect(() => {
    drawChart();
  }, [drawChart, mousePosition]);

  // Log quando o componente renderizar
  useEffect(() => {
    console.log('[BotChart] Componente renderizado', {
      hasContainer: !!containerRef.current,
      hasCanvas: !!canvasRef.current,
      candlesLength: candles.length
    });
  }, [candles.length]);

  // Função para configurar o listener de wheel - DEVE estar antes do useEffect que a usa
  const setupWheelListener = useCallback((container: HTMLDivElement) => {
    console.log('[BotChart] setupWheelListener chamado para container:', container);
    
    // Criar handler que intercepta o evento ANTES do React e faz tudo aqui
    const handler = (e: WheelEvent) => {
      console.log('[BotChart] Handler de wheel chamado!', {
        clientX: e.clientX,
        clientY: e.clientY,
        deltaY: e.deltaY
      });
      
      // Verificar se o evento está sobre o container
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      console.log('[BotChart] Posição do mouse no container:', { mouseX, mouseY });
      
      const isOverChart = mouseX >= margin.left && 
                         mouseX <= rect.width - margin.right &&
                         mouseY >= margin.top && 
                         mouseY <= rect.height - margin.bottom;
      
      console.log('[BotChart] Está sobre o gráfico?', isOverChart);
      
      if (!isOverChart) {
        console.log('[BotChart] Fora da área do gráfico, ignorando');
        return; // Não fazer nada se estiver fora da área do gráfico
      }
      
      console.log('[BotChart] Prevenindo scroll e fazendo zoom');
      
      // Prevenir scroll ANTES de qualquer coisa - isso é crítico!
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // Fazer o zoom diretamente aqui, sem chamar handleWheel
      const currentDisplayCount = displayCountRef.current;
      const currentXOffset = xOffsetRef.current;
      const currentCandles = candlesRef.current;
      
      if (currentCandles.length === 0) {
        console.log('[BotChart] Sem candles, ignorando zoom');
        return;
      }
      
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      
      // Calcular posição do mouse relativa ao gráfico
      const plotWidth = rect.width - margin.left - margin.right;
      const relativeX = (mouseX - margin.left) / plotWidth;
      const zoomCenterIndex = Math.round(currentXOffset + relativeX * currentDisplayCount);
      
      // Aplicar zoom
      const newDisplayCount = Math.max(20, Math.min(500, Math.round(currentDisplayCount * zoomFactor)));
      
      // Ajustar offset para manter o ponto de zoom no mesmo lugar
      const newOffset = Math.max(0, Math.min(
        currentCandles.length - newDisplayCount,
        Math.round(zoomCenterIndex - relativeX * newDisplayCount)
      ));
      
      console.log('[BotChart] Aplicando zoom:', { newDisplayCount, newOffset });
      
      setDisplayCount(newDisplayCount);
      setXOffset(newOffset);
    };

    // Adicionar listener com passive: false e capture: true
    // capture: true intercepta o evento na fase de captura, ANTES que chegue ao React
    // passive: false permite chamar preventDefault
    console.log('[BotChart] Adicionando listener de wheel com passive: false, capture: true');
    console.log('[BotChart] Container antes de adicionar listener:', container);
    console.log('[BotChart] Container tagName:', container.tagName);
    console.log('[BotChart] Container className:', container.className);
    
    try {
      container.addEventListener('wheel', handler, { passive: false, capture: true } as any);
      console.log('[BotChart] Listener adicionado com sucesso');
      
      // Verificar se foi adicionado
      const hasListener = container.addEventListener.toString();
      console.log('[BotChart] Verificação: addEventListener disponível:', typeof container.addEventListener);
    } catch (error) {
      console.error('[BotChart] Erro ao adicionar listener:', error);
    }

    return () => {
      console.log('[BotChart] Removendo listener de wheel');
      container.removeEventListener('wheel', handler, { capture: true } as any);
    };
  }, []); // Não precisa de handleWheel como dependência

  // Adicionar listener nativo de wheel com passive: false
  useEffect(() => {
    console.log('[BotChart] ====== useEffect wheel listener - INICIANDO ======');
    console.log('[BotChart] containerRef.current:', containerRef.current);
    console.log('[BotChart] setupWheelListener disponível:', typeof setupWheelListener);
    
    const setupListener = () => {
      const container = containerRef.current;
      if (!container) {
        console.log('[BotChart] Container não encontrado ainda');
        return null;
      }

      console.log('[BotChart] Container encontrado, configurando listener');
      const cleanup = setupWheelListener(container);
      console.log('[BotChart] Cleanup function retornada:', !!cleanup);
      
      // Verificar se o listener foi realmente adicionado
      const hasWheelListeners = (container as any).__wheelListeners || 0;
      console.log('[BotChart] Número de listeners de wheel no container:', hasWheelListeners);
      
      return cleanup;
    };

    // Tentar configurar imediatamente
    let cleanup = setupListener();
    
    // Se não encontrou, tentar novamente após um delay
    if (!cleanup) {
      console.log('[BotChart] Container não encontrado, tentando novamente em 200ms');
      const timeout = setTimeout(() => {
        cleanup = setupListener();
        if (!cleanup) {
          console.log('[BotChart] Container ainda não encontrado após retry');
        }
      }, 200);
      return () => {
        clearTimeout(timeout);
        if (cleanup) cleanup();
      };
    }

    return cleanup || undefined;
  }, [setupWheelListener]);

  // Handler de pan (arrastar)
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Apenas botão esquerdo
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    
    // Verificar se está sobre a área do gráfico
    if (mouseX < margin.left || mouseX > rect.width - margin.right) {
      return;
    }
    
    setIsPanning(true);
    panStartX.current = e.clientX;
    panStartOffset.current = xOffset;
    
    // Prevenir seleção de texto durante o pan
    e.preventDefault();
  }, [xOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Atualizar posição do mouse para cursor XY
    setMousePosition({ x: mouseX, y: mouseY });
    
    // Se estiver fazendo pan, atualizar offset
    if (isPanning) {
      const deltaX = panStartX.current - e.clientX;
      const plotWidth = containerRef.current.clientWidth - margin.left - margin.right;
      const pixelsPerCandle = plotWidth / displayCount;
      const candlesDelta = Math.round(deltaX / pixelsPerCandle);
      
      const newOffset = Math.max(0, Math.min(
        candles.length - displayCount,
        panStartOffset.current + candlesDelta
      ));
      
      setXOffset(newOffset);
      e.preventDefault();
    }
  }, [isPanning, displayCount, candles.length]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Prevenir scroll quando estiver sobre o gráfico
  const handleMouseEnter = useCallback(() => {
    console.log('[BotChart] handleMouseEnter chamado');
    if (containerRef.current) {
      containerRef.current.style.overflow = 'hidden';
      console.log('[BotChart] Container no handleMouseEnter:', containerRef.current);
      
      // Verificar se o listener de wheel está presente
      // Tentar adicionar o listener novamente se não estiver presente
      const container = containerRef.current;
      const hasWheelListener = (container as any).__hasWheelListener;
      console.log('[BotChart] Listener de wheel presente?', hasWheelListener);
      
      if (!hasWheelListener && setupWheelListener) {
        console.log('[BotChart] Listener não encontrado, adicionando agora...');
        const cleanup = setupWheelListener(container);
        (container as any).__hasWheelListener = true;
        (container as any).__wheelCleanup = cleanup;
        console.log('[BotChart] Listener adicionado no handleMouseEnter');
      }
    }
  }, [setupWheelListener]);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    setMousePosition(null); // Remover cursor quando sair do container
    if (containerRef.current) {
      containerRef.current.style.overflow = 'auto';
    }
  }, []);

  // Não usar handler React porque ele é passivo por padrão
  // Usar apenas listener nativo com passive: false

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">{error}</Alert>
    );
  }

  if (!candles.length) {
    return (
      <Alert severity="info">Nenhum dado disponível para exibir</Alert>
    );
  }

  // Componente de legenda
  const LegendItem: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
  }> = ({ icon, label }) => (
    <Box display="flex" alignItems="center" gap={1}>
      {icon}
      <Typography variant="body2" fontSize="0.875rem">
        {label}
      </Typography>
    </Box>
  );

  // Função para desenhar triângulo SVG (entrada)
  const TriangleIcon: React.FC<{ direction: 'up' | 'down'; color: string }> = ({ direction, color }) => (
    <svg width="16" height="16" viewBox="0 0 16 16">
      {direction === 'up' ? (
        <path d="M8 2 L2 12 L14 12 Z" fill={color} stroke="#fff" strokeWidth="1.5" />
      ) : (
        <path d="M8 14 L2 4 L14 4 Z" fill={color} stroke="#fff" strokeWidth="1.5" />
      )}
    </svg>
  );

  // Função para desenhar X SVG (saída)
  const XIcon: React.FC<{ color: string }> = ({ color }) => (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="7" fill="#fff" stroke={color} strokeWidth="2" />
      <path d="M5 5 L11 11 M11 5 L5 11" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );

  return (
    <Paper sx={{ p: 2 }}>
      {/* Legenda acima do gráfico */}
      <Box 
        sx={{ 
          mb: 2, 
          p: 1.5, 
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          display: 'flex',
          gap: 3,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mr: 1 }}>
          Legenda:
        </Typography>
        <LegendItem 
          icon={<TriangleIcon direction="up" color="#2196F3" />}
          label="Entrada Compra"
        />
        <LegendItem 
          icon={<TriangleIcon direction="down" color="#FF9800" />}
          label="Entrada Venda"
        />
        <LegendItem 
          icon={<XIcon color="#4CAF50" />}
          label="Saída (Lucro)"
        />
        <LegendItem 
          icon={<XIcon color="#F44336" />}
          label="Saída (Prejuízo)"
        />
      </Box>

      <Box 
        ref={containerRef} 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => {
          console.log('[BotChart] Mouse entrou no container');
          handleMouseEnter();
        }}
        sx={{ 
          overflow: 'hidden',
          cursor: isPanning ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none', // Prevenir gestos de toque que podem causar scroll
          position: 'relative',
          // Garantir que o container capture eventos de wheel
          willChange: 'transform'
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', pointerEvents: 'none' }}
        />
      </Box>
    </Paper>
  );
};

export default BotChart;

