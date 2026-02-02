import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface BalanceHistoryPoint {
  date: string;
  balance: number;
}

interface BalanceChartProps {
  data: BalanceHistoryPoint[];
  color?: string;
}

const BalanceChart: React.FC<BalanceChartProps> = ({ data, color = '#1976d2' }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayCount, setDisplayCount] = useState(100);
  const [xOffset, setXOffset] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const panStartX = useRef(0);
  const panStartOffset = useRef(0);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  
  // Refs para manter valores atualizados no handler
  const displayCountRef = useRef(displayCount);
  const xOffsetRef = useRef(xOffset);
  const dataRef = useRef(data);
  
  // Atualizar refs quando valores mudarem
  useEffect(() => {
    displayCountRef.current = displayCount;
    xOffsetRef.current = xOffset;
    dataRef.current = data;
  }, [displayCount, xOffset, data]);

  const Y_AXIS_WIDTH = 80;
  const margin = { top: 10, right: 10, bottom: 30, left: Y_AXIS_WIDTH };

  // Ajustar displayCount inicial baseado no tamanho dos dados
  useEffect(() => {
    if (data.length > 0) {
      const initialCount = Math.min(100, data.length);
      setDisplayCount(initialCount);
      setXOffset(Math.max(0, data.length - initialCount));
    }
  }, [data.length]);

  // Função para desenhar o gráfico
  const drawChart = useCallback(() => {
    if (!canvasRef.current || !data.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const plotWidth = cw - margin.left - margin.right;
    const plotHeight = ch - margin.top - margin.bottom;

    // Limpar canvas
    ctx.fillStyle = isDarkMode ? '#1e1e1e' : '#ffffff';
    ctx.fillRect(0, 0, cw, ch);

    // Filtrar dados visíveis
    const visibleData = data.slice(xOffset, xOffset + displayCount);
    if (visibleData.length === 0) return;

    // Calcular min e max do saldo
    const balances = visibleData.map(d => d.balance);
    const yMin = Math.min(...balances) * 0.95; // Margem de 5%
    const yMax = Math.max(...balances) * 1.05;
    const yRange = yMax - yMin;
    const yScale = plotHeight / yRange;

    // Desenhar grid
    ctx.strokeStyle = isDarkMode ? '#424242' : '#e0e0e0';
    ctx.lineWidth = 1;
    const gridLinesY = 5;
    const gridLinesX = 5;
    
    // Linhas horizontais (grid)
    for (let i = 0; i <= gridLinesY; i++) {
      const y = margin.top + (plotHeight / gridLinesY) * i;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + plotWidth, y);
      ctx.stroke();
    }
    
    // Linhas verticais (grid)
    for (let i = 0; i <= gridLinesX; i++) {
      const x = margin.left + (plotWidth / gridLinesX) * i;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + plotHeight);
      ctx.stroke();
    }

    // Desenhar linha do gráfico
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    visibleData.forEach((point, index) => {
      const x = margin.left + (plotWidth / visibleData.length) * index;
      const y = margin.top + plotHeight - ((point.balance - yMin) * yScale);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Desenhar pontos
    ctx.fillStyle = color;
    visibleData.forEach((point, index) => {
      const x = margin.left + (plotWidth / visibleData.length) * index;
      const y = margin.top + plotHeight - ((point.balance - yMin) * yScale);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Desenhar eixos
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
      ctx.fillText(`$${value.toFixed(2)}`, margin.left - 5, y + 3);
    }

    // Labels do eixo X (datas)
    ctx.fillStyle = isDarkMode ? '#b0b0b0' : '#666';
    ctx.textAlign = 'center';
    const xSteps = 5;
    for (let i = 0; i <= xSteps; i++) {
      const idx = Math.floor((xOffset + (displayCount * i / xSteps)));
      if (idx < data.length) {
        const x = margin.left + (plotWidth * i / xSteps) + (plotWidth / displayCount) / 2;
        const date = new Date(data[idx].date);
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

        // Calcular saldo correspondente à posição Y
        const balance = yMax - ((mouseY - margin.top) / plotHeight) * yRange;
        
        // Calcular índice do ponto correspondente à posição X
        const relativeX = (mouseX - margin.left) / plotWidth;
        const pointIndex = Math.floor(xOffset + relativeX * displayCount);
        const point = pointIndex >= 0 && pointIndex < data.length ? data[pointIndex] : null;

        // Desenhar label de saldo no eixo Y (com fundo)
        ctx.fillStyle = '#2196F3';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const balanceText = `$${balance.toFixed(2)}`;
        const balanceTextWidth = ctx.measureText(balanceText).width;
        const labelY = Math.max(margin.top + 10, Math.min(margin.top + plotHeight - 10, mouseY));
        ctx.fillRect(margin.left - balanceTextWidth - 10, labelY - 10, balanceTextWidth + 8, 20);
        ctx.fillStyle = isDarkMode ? '#1e1e1e' : '#ffffff';
        ctx.fillText(balanceText, margin.left - 5, labelY);

        // Desenhar label de tempo no eixo X
        if (point) {
          ctx.fillStyle = '#2196F3';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          const date = new Date(point.date);
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
  }, [data, xOffset, displayCount, mousePosition, isPanning, isDarkMode, color]);

  // Ajustar tamanho do canvas
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const resizeCanvas = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const container = containerRef.current;
      canvasRef.current.width = container.clientWidth;
      canvasRef.current.height = 300;
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

  // Função para configurar o listener de wheel - DEVE estar antes do useEffect que a usa
  const setupWheelListener = useCallback((container: HTMLDivElement) => {
    // Criar handler que intercepta o evento ANTES do React e faz tudo aqui
    const handler = (e: WheelEvent) => {
      // Verificar se o evento está sobre o container
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const isOverChart = mouseX >= margin.left && 
                         mouseX <= rect.width - margin.right &&
                         mouseY >= margin.top && 
                         mouseY <= rect.height - margin.bottom;
      
      if (!isOverChart) {
        return; // Não fazer nada se estiver fora da área do gráfico
      }
      
      // Prevenir scroll ANTES de qualquer coisa - isso é crítico!
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // Fazer o zoom diretamente aqui
      const currentDisplayCount = displayCountRef.current;
      const currentXOffset = xOffsetRef.current;
      const currentData = dataRef.current;
      
      if (currentData.length === 0) {
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
        currentData.length - newDisplayCount,
        Math.round(zoomCenterIndex - relativeX * newDisplayCount)
      ));
      
      setDisplayCount(newDisplayCount);
      setXOffset(newOffset);
    };

    // Adicionar listener com passive: false e capture: true
    // capture: true intercepta o evento na fase de captura, ANTES que chegue ao React
    // passive: false permite chamar preventDefault
    try {
      container.addEventListener('wheel', handler, { passive: false, capture: true } as any);
    } catch (error) {
      console.error('[BalanceChart] Erro ao adicionar listener:', error);
    }

    return () => {
      container.removeEventListener('wheel', handler, { capture: true } as any);
    };
  }, []); // Não precisa de dependências

  // Adicionar listener nativo de wheel
  useEffect(() => {
    const setupListener = () => {
      const container = containerRef.current;
      if (!container) return null;
      return setupWheelListener(container);
    };

    let cleanup = setupListener();
    if (!cleanup) {
      const timeout = setTimeout(() => {
        cleanup = setupListener();
      }, 200);
      return () => {
        clearTimeout(timeout);
        if (cleanup) cleanup();
      };
    }
    return cleanup;
  }, [setupWheelListener]);

  // Handlers de mouse para pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    if (mouseX >= margin.left && mouseX <= rect.width - margin.right) {
      setIsPanning(true);
      panStartX.current = mouseX;
      panStartOffset.current = xOffset;
    }
  }, [xOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setMousePosition({ x: mouseX, y: mouseY });
    
    if (isPanning) {
      const deltaX = panStartX.current - mouseX;
      const plotWidth = rect.width - margin.left - margin.right;
      const deltaIndex = Math.round((deltaX / plotWidth) * displayCount);
      const newOffset = Math.max(0, Math.min(
        data.length - displayCount,
        panStartOffset.current + deltaIndex
      ));
      setXOffset(newOffset);
    }
  }, [isPanning, displayCount, data.length]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    setMousePosition(null);
  }, []);

  if (data.length === 0) {
    return (
      <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box component="span" sx={{ color: 'text.secondary' }}>
          Nenhum dado histórico disponível ainda. O gráfico será atualizado conforme você usar a carteira.
        </Box>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        sx={{
          position: 'relative',
          width: '100%',
          height: 300,
          overflow: 'hidden',
          cursor: isPanning ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            pointerEvents: 'none'
          }}
        />
      </Box>
    </Paper>
  );
};

export default BalanceChart;

