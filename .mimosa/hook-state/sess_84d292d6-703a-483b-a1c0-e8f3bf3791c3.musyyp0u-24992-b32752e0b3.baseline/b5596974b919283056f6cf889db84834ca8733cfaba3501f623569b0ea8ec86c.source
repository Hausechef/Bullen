import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { MousePointer2, Settings, Type, Crosshair, Pencil, Move, Crop, Plus, Check, Trash2 } from 'lucide-react';
import { useTradingContext } from '../../contexts/TradingContext';
import { useTradingStore } from '../../stores/tradingStore';
import { useForexStore } from '../../stores/forexStore';
import { AssetSelector } from './AssetSelector';

type IndicatorKey = 'ema' | 'rsi' | 'macd' | 'sma' | 'bb';

type CandlePoint = { time: number; open: number; high: number; low: number; close: number };

// ── Drawing Tools ──────────────────────────────────────────────────────────────
type DrawTool = 'pointer' | 'trendline' | 'pencil' | 'hand' | 'rectangle' | 'text' | 'zoom';
type DrawShape =
  | { type: 'trendline'; x1: number; y1: number; x2: number; y2: number }
  | { type: 'pencil'; points: { x: number; y: number }[] }
  | { type: 'rectangle'; x1: number; y1: number; x2: number; y2: number }
  | { type: 'text'; x: number; y: number; text: string };

const DRAW_COLOR = '#D4AF37';

function drawShape(ctx: CanvasRenderingContext2D, shape: DrawShape) {
  ctx.strokeStyle = DRAW_COLOR;
  ctx.fillStyle   = DRAW_COLOR;
  ctx.lineWidth   = 1.5;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  if (shape.type === 'trendline') {
    ctx.beginPath();
    ctx.moveTo(shape.x1, shape.y1);
    ctx.lineTo(shape.x2, shape.y2);
    ctx.stroke();
    [{ x: shape.x1, y: shape.y1 }, { x: shape.x2, y: shape.y2 }].forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2); ctx.fill();
    });
  } else if (shape.type === 'pencil') {
    if (shape.points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(shape.points[0].x, shape.points[0].y);
    for (let i = 1; i < shape.points.length; i++) ctx.lineTo(shape.points[i].x, shape.points[i].y);
    ctx.stroke();
  } else if (shape.type === 'rectangle') {
    const w = shape.x2 - shape.x1, h = shape.y2 - shape.y1;
    ctx.beginPath(); ctx.rect(shape.x1, shape.y1, w, h); ctx.stroke();
    ctx.fillStyle = 'rgba(212,175,55,0.07)'; ctx.fill();
  } else if (shape.type === 'text') {
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = DRAW_COLOR;
    ctx.fillText(shape.text, shape.x, shape.y);
  }
}

const CURSOR_MAP: Record<DrawTool, string> = {
  pointer: 'default', trendline: 'crosshair', pencil: 'crosshair',
  hand: 'grab', rectangle: 'crosshair', text: 'text', zoom: 'zoom-in',
};

const TOOLS: { icon: React.ElementType; tool: DrawTool; label: string }[] = [
  { icon: MousePointer2, tool: 'pointer',   label: 'Select'      },
  { icon: Crosshair,     tool: 'trendline', label: 'Trend Line'  },
  { icon: Pencil,        tool: 'pencil',    label: 'Freehand'    },
  { icon: Move,          tool: 'hand',      label: 'Pan Chart'   },
  { icon: Crop,          tool: 'rectangle', label: 'Rectangle'   },
  { icon: Type,          tool: 'text',      label: 'Add Text'    },
  { icon: Plus,          tool: 'zoom',      label: 'Zoom In'     },
];

const computeSMAData = (candles: CandlePoint[], period = 20) => {
  const result: { time: number; value: number }[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const sum = candles.slice(i - period + 1, i + 1).reduce((a, c) => a + c.close, 0);
    result.push({ time: candles[i].time, value: sum / period });
  }
  return result;
};

const computeBBData = (candles: CandlePoint[], period = 20, mult = 2) => {
  const upper: { time: number; value: number }[] = [];
  const lower: { time: number; value: number }[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, c) => a + c.close, 0) / period;
    const std = Math.sqrt(slice.reduce((a, c) => a + (c.close - mean) ** 2, 0) / period);
    upper.push({ time: candles[i].time, value: mean + mult * std });
    lower.push({ time: candles[i].time, value: mean - mult * std });
  }
  return { upper, lower };
};

const computeRSI = (closes: number[], period = 14): number => {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return Math.round(100 - 100 / (1 + avgGain / avgLoss));
};

const computeMACD = (closes: number[]) => {
  if (closes.length < 26) return { macd: 0, signal: 0, hist: 0 };
  const emaCalc = (data: number[], period: number) => {
    const k = 2 / (period + 1);
    let e = data[0];
    for (let i = 1; i < data.length; i++) e = data[i] * k + e * (1 - k);
    return e;
  };
  const slice = closes.slice(-60);
  const macd = emaCalc(slice.slice(-26), 12) - emaCalc(slice.slice(-26), 26);
  const signal = macd * (2 / 10);
  return { macd, signal, hist: macd - signal };
};

export const TradingChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<{ candlestick: any; volume: any; ema: any; sma: any; bbUpper: any; bbLower: any } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const candleClosesRef = useRef<number[]>([]);
  const candleDataRef = useRef<CandlePoint[]>([]);

  // Drawing tools
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const shapesRef     = useRef<DrawShape[]>([]);
  const activeToolRef = useRef<DrawTool>('pointer');
  const zoomRef       = useRef(8);
  const [activeTool,  setActiveTool]  = useState<DrawTool>('pointer');
  const [hasDrawings, setHasDrawings] = useState(false);
  const [textInput,   setTextInput]   = useState<{ x: number; y: number } | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const [showPanel, setShowPanel] = useState(false);
  const [indicators, setIndicators] = useState<Record<IndicatorKey, boolean>>({ ema: true, rsi: false, macd: false, sma: false, bb: false });

  const toggleIndicator = (key: IndicatorKey) => {
    setIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const { currentPair, currentTimeframe, setCurrentTimeframe } = useTradingContext();

  const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W'];

  const buildDemoCandles = (basePrice: number, tfSeconds: number, points = 500) => {
    const cData = [];
    const vData = [];
    const eData = [];
    const now = Math.floor(Date.now() / 1000);
    let currentVal = basePrice;
    let sum = 0;

    for (let i = points - 1; i >= 0; i--) {
      const index = points - 1 - i;
      const time = (now - i * tfSeconds) as any;
      const volatility = Math.max(basePrice * 0.001, 0.00001);
      const wave = Math.sin(index * 0.7) * volatility;
      const drift = Math.cos(index * 0.23) * volatility * 0.45;
      const open = currentVal;
      const close = Math.max(0.00001, open + wave + drift);
      const high = Math.max(open, close) + volatility * (0.35 + (index % 5) * 0.08);
      const low = Math.max(0.00001, Math.min(open, close) - volatility * (0.3 + (index % 3) * 0.08));

      currentVal = close;
      cData.push({ time, open, high, low, close });

      const isUp = close >= open;
      vData.push({
        time,
        value: Math.round(500 + index * 7 + Math.abs(Math.sin(index)) * 900),
        color: isUp ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 61, 0, 0.3)',
      });

      sum += close;
      const emaVal = index >= 8 ? sum / 9 : sum / (index + 1);
      eData.push({ time, value: emaVal });
      if (index >= 8) sum -= cData[index - 8].close;
    }

    return { cData, vData, eData };
  };

  // Initialize chart once
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      localization: {
        locale: 'en-US',
      },
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
        fontFamily: 'Outfit, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        rightOffset: 12,
        barSpacing: 8,
        fixLeftEdge: true,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 480,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00E676',
      downColor: '#FF3D00',
      borderVisible: false,
      wickUpColor: '#00E676',
      wickDownColor: '#FF3D00',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    const emaSeries = chart.addSeries(LineSeries, { color: '#D4AF37', lineWidth: 2 });
    const smaSeries = chart.addSeries(LineSeries, { color: '#F97316', lineWidth: 2, lineStyle: 1 });
    const bbUpperSeries = chart.addSeries(LineSeries, { color: 'rgba(139,92,246,0.6)', lineWidth: 1, lineStyle: 1 });
    const bbLowerSeries = chart.addSeries(LineSeries, { color: 'rgba(139,92,246,0.6)', lineWidth: 1, lineStyle: 1 });

    emaSeries.applyOptions({ visible: indicators.ema });
    smaSeries.applyOptions({ visible: false });
    bbUpperSeries.applyOptions({ visible: false });
    bbLowerSeries.applyOptions({ visible: false });
    chartRef.current = chart;
    seriesRef.current = { candlestick: candlestickSeries, volume: volumeSeries, ema: emaSeries, sma: smaSeries, bbUpper: bbUpperSeries, bbLower: bbLowerSeries };

    let disposed = false;

    const resizeChart = () => {
      if (disposed) return;
      const container = chartContainerRef.current;
      if (!container) return;
      chart.applyOptions({
        width: Math.max(1, container.clientWidth),
        height: Math.max(320, container.clientHeight),
      });
    };

    const resizeObserver = new ResizeObserver(resizeChart);
    resizeObserver.observe(chartContainerRef.current);
    window.addEventListener('resize', resizeChart);
    resizeChart();

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      window.removeEventListener('resize', resizeChart);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Keep activeToolRef in sync with state
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);

  // Canvas drawing engine
  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const redraw = (live?: DrawShape | null) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      shapesRef.current.forEach(s => drawShape(ctx, s));
      if (live) drawShape(ctx, live);
    };

    const syncSize = () => {
      const p = canvas.parentElement;
      if (!p) return;
      canvas.width  = p.clientWidth;
      canvas.height = p.clientHeight;
      redraw();
    };
    syncSize();
    const ro = new ResizeObserver(syncSize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    let drawing = false;
    let live: DrawShape | null = null;

    const pos = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onDown = (e: MouseEvent) => {
      const tool = activeToolRef.current;
      if (tool === 'pointer' || tool === 'hand') return;
      const { x, y } = pos(e);

      if (tool === 'text') {
        setTextInput({ x, y });
        setTimeout(() => textInputRef.current?.focus(), 30);
        return;
      }
      if (tool === 'zoom') {
        zoomRef.current = Math.min(60, zoomRef.current * 1.35);
        chartRef.current?.timeScale().applyOptions({ barSpacing: zoomRef.current });
        return;
      }

      drawing = true;
      if (tool === 'trendline')  live = { type: 'trendline', x1: x, y1: y, x2: x, y2: y };
      else if (tool === 'pencil')    live = { type: 'pencil', points: [{ x, y }] };
      else if (tool === 'rectangle') live = { type: 'rectangle', x1: x, y1: y, x2: x, y2: y };
      e.preventDefault();
    };

    const onMove = (e: MouseEvent) => {
      if (!drawing || !live) return;
      const { x, y } = pos(e);
      if (live.type === 'trendline')       live = { ...live, x2: x, y2: y };
      else if (live.type === 'pencil')     live = { ...live, points: [...live.points, { x, y }] };
      else if (live.type === 'rectangle')  live = { ...live, x2: x, y2: y };
      redraw(live);
    };

    const onUp = () => {
      if (!drawing || !live) return;
      shapesRef.current = [...shapesRef.current, live];
      setHasDrawings(true);
      drawing = false; live = null; redraw();
    };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup',   onUp);
    canvas.addEventListener('mouseleave', onUp);
    return () => {
      ro.disconnect();
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup',   onUp);
      canvas.removeEventListener('mouseleave', onUp);
    };
  }, []);

  const clearDrawings = () => {
    shapesRef.current = [];
    setHasDrawings(false);
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Sync EMA visibility
  useEffect(() => {
    if (seriesRef.current?.ema) {
      seriesRef.current.ema.applyOptions({ visible: indicators.ema });
    }
  }, [indicators.ema]);

  // Sync SMA visibility
  useEffect(() => {
    const s = seriesRef.current;
    if (!s?.sma) return;
    s.sma.applyOptions({ visible: indicators.sma });
    if (indicators.sma && candleDataRef.current.length >= 20) {
      s.sma.setData(computeSMAData(candleDataRef.current) as any);
    }
  }, [indicators.sma]);

  // Sync BB visibility
  useEffect(() => {
    const s = seriesRef.current;
    if (!s?.bbUpper || !s?.bbLower) return;
    s.bbUpper.applyOptions({ visible: indicators.bb });
    s.bbLower.applyOptions({ visible: indicators.bb });
    if (indicators.bb && candleDataRef.current.length >= 20) {
      const { upper, lower } = computeBBData(candleDataRef.current);
      s.bbUpper.setData(upper as any);
      s.bbLower.setData(lower as any);
    }
  }, [indicators.bb]);

  // Handle data updates
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;

    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }

    let cancelled = false;

    const { candlestick, volume, ema, sma, bbUpper, bbLower } = seriesRef.current;

    const getTfSeconds = (tf: string) => {
      const value = parseInt(tf);
      if (tf.endsWith('m')) return value * 60;
      if (tf.endsWith('h')) return value * 3600;
      if (tf.endsWith('D')) return value * 86400;
      if (tf.endsWith('W')) return value * 604800;
      return 60;
    };
    const tfSeconds = getTfSeconds(currentTimeframe);

    const isJPYPair = currentPair.includes('JPY');
    const isCryptoPair = currentPair.endsWith('USDT');
    const isMetalPair = currentPair.startsWith('XA') || currentPair.startsWith('XP');
    const isExoticPair = ['USDTRY','USDMXN','USDZAR','USDSEK','USDNOK','USDDKK','USDPLN',
      'USDCNH','EURTRY','EURSEK','EURNOK','GBPTRY','GBPZAR'].includes(currentPair);

    const precision = isJPYPair ? 3 : isCryptoPair ? 2 : isMetalPair ? 2 : isExoticPair ? 3 : 5;
    const minMove  = isJPYPair ? 0.001 : isCryptoPair ? 0.01 : isMetalPair ? 0.01 : isExoticPair ? 0.001 : 0.00001;

    candlestick.applyOptions({
      priceFormat: { type: 'price', precision, minMove },
    });

    const isForex = !currentPair.endsWith('USDT');

    if (isForex) {
      const generateDummyForex = (basePrice: number) => {
        const cData = [];
        const vData = [];
        const eData = [];
        let currentVal = basePrice;
        const now = Math.floor(Date.now() / 1000);
        let sum = 0;

        for (let i = 500; i >= 0; i--) {
          const index = 500 - i;
          const time = (now - i * tfSeconds) as any;
          const volatility = basePrice * 0.001;
          const open = currentVal + (Math.random() - 0.5) * volatility;
          const close = open + (Math.random() - 0.5) * volatility * 2;
          const high = Math.max(open, close) + Math.random() * volatility;
          const low = Math.min(open, close) - Math.random() * volatility;

          currentVal = close;
          cData.push({ time, open, high, low, close });

          const isUp = close >= open;
          vData.push({ time, value: Math.random() * 1000 + 500, color: isUp ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 61, 0, 0.3)' });

          sum += close;
          const emaVal = index >= 8 ? sum / 9 : sum / (index + 1);
          eData.push({ time, value: emaVal });
          if (index >= 8) sum -= cData[index - 8].close;
        }
        return { cData, vData, eData };
      };

      const curPrice = useTradingStore.getState().prices[currentPair] || 1.1;
      const { cData, vData, eData } = generateDummyForex(curPrice);
      candleClosesRef.current = cData.map((c: any) => c.close);
      candleDataRef.current = cData as CandlePoint[];
      candlestick.setData(cData as any);
      volume.setData(vData as any);
      ema.setData(eData as any);
      if (indicators.sma) { sma.setData(computeSMAData(cData as CandlePoint[]) as any); }
      if (indicators.bb) { const { upper, lower } = computeBBData(cData as CandlePoint[]); bbUpper.setData(upper as any); bbLower.setData(lower as any); }

      let lastPrice = curPrice;
      unsubRef.current = useTradingStore.subscribe((state) => {
          const newPrice = state.prices[currentPair];
          if (!newPrice || newPrice === lastPrice) return;
          
          const prevPrice = lastPrice;
          lastPrice = newPrice;
          
          const now = Math.floor(Date.now() / 1000);
          const candleTime = now - (now % tfSeconds);
          candlestick.update({
            time: candleTime as any,
            open: prevPrice,
            high: Math.max(prevPrice, newPrice) * 1.0001,
            low: Math.min(prevPrice, newPrice) * 0.9999,
            close: newPrice,
          });
      });
    } else {
      // Crypto — fetch real Binance history
      const BINANCE_INTERVAL: Record<string, string> = {
        '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
        '1h': '1h', '4h': '4h', '1D': '1d', '1W': '1w',
      };
      const binanceInterval = BINANCE_INTERVAL[currentTimeframe] ?? currentTimeframe.toLowerCase();
      const symbol = currentPair.toUpperCase();
      const fallbackPrice = useTradingStore.getState().prices[currentPair] || 100;

      const parseKlines = (data: any[]) => {
        const cData = [];
        const vData = [];
        const eData = [];
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const d = data[i];
          const time = Math.floor(d[0] / 1000);
          const open  = parseFloat(d[1]);
          const high  = parseFloat(d[2]);
          const low   = parseFloat(d[3]);
          const close = parseFloat(d[4]);
          const vol   = parseFloat(d[5]);
          cData.push({ time, open, high, low, close });
          const isUp = close >= open;
          vData.push({ time, value: vol, color: isUp ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 61, 0, 0.3)' });
          sum += close;
          const emaVal = i >= 8 ? sum / 9 : sum / (i + 1);
          eData.push({ time, value: emaVal });
          if (i >= 8) sum -= parseFloat(data[i - 8][4]);
        }
        return { cData, vData, eData };
      };

      const tryFetch = async (url: string) => {
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error('Empty');
        return data;
      };

      const loadHistory = async () => {
        let raw: any[] | null = null;

        try {
          raw = await tryFetch(
            `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${binanceInterval}&limit=1000`
          );
        } catch {
          try {
            raw = await tryFetch(
              `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${binanceInterval}&limit=1000`
            );
          } catch {
            raw = null;
          }
        }

        if (cancelled || !seriesRef.current) return;

        if (raw && raw.length > 0) {
          const { cData, vData, eData } = parseKlines(raw);
          
          const fp = useForexStore.getState().pairs[currentPair];
          if (fp && (fp.trend !== 'sideways' || fp.isPaused)) {
            if (cData.length > 0) {
              const last = cData[cData.length - 1];
              if (fallbackPrice !== last.close) {
                const now = Math.floor(Date.now() / 1000);
                const candleTime = now - (now % tfSeconds);
                cData.push({
                  time: candleTime as any,
                  open: last.close,
                  high: Math.max(last.close, fallbackPrice) * 1.0001,
                  low: Math.min(last.close, fallbackPrice) * 0.9999,
                  close: fallbackPrice
                });
                vData.push({ time: candleTime as any, value: 0, color: fallbackPrice >= last.close ? '#26a69a' : '#ef5350' });
                eData.push({ time: candleTime as any, value: fallbackPrice });
              }
            }
          }

          candleClosesRef.current = cData.map((c: any) => c.close);
          candleDataRef.current = cData as CandlePoint[];
          candlestick.setData(cData as any);
          volume.setData(vData as any);
          ema.setData(eData as any);
          if (indicators.sma) { sma.setData(computeSMAData(cData as CandlePoint[]) as any); }
          if (indicators.bb) { const { upper, lower } = computeBBData(cData as CandlePoint[]); bbUpper.setData(upper as any); bbLower.setData(lower as any); }

          // Live WebSocket for real-time tick updates
          if (!cancelled) {
            try {
              const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${binanceInterval}`);
              wsRef.current = ws;
              ws.onmessage = (event) => {
                if (cancelled || !seriesRef.current) return;
                const fp = useForexStore.getState().pairs[currentPair];
                if (fp && (fp.trend !== 'sideways' || fp.isPaused)) return;

                const msg = JSON.parse(event.data);
                if (msg?.k) {
                  const k = msg.k;
                  const time = Math.floor(k.t / 1000);
                  const open  = parseFloat(k.o);
                  const high  = parseFloat(k.h);
                  const low   = parseFloat(k.l);
                  const close = parseFloat(k.c);
                  const vol   = parseFloat(k.v);
                  candlestick.update({ time: time as any, open, high, low, close });
                  const isUp = close >= open;
                  volume.update({ time: time as any, value: vol, color: isUp ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 61, 0, 0.3)' });
                }
              };
            } catch { /* static history still shown */ }

            let lastCryptoPrice = fallbackPrice;
            unsubRef.current = useTradingStore.subscribe((state) => {
              const fp = useForexStore.getState().pairs[currentPair];
              if (!fp || (fp.trend === 'sideways' && !fp.isPaused)) return;
              
              const newPrice = state.prices[currentPair];
              if (!newPrice || newPrice === lastCryptoPrice) return;
              
              const prevPrice = lastCryptoPrice;
              lastCryptoPrice = newPrice;
              
              const now = Math.floor(Date.now() / 1000);
              const candleTime = now - (now % tfSeconds);
              candlestick.update({
                time: candleTime as any,
                open: prevPrice,
                high: Math.max(prevPrice, newPrice) * 1.0001,
                low: Math.min(prevPrice, newPrice) * 0.9999,
                close: newPrice
              });
            });
          }
        } else {
          const { cData, vData, eData } = buildDemoCandles(fallbackPrice, tfSeconds, 500);
          candleClosesRef.current = cData.map((c: any) => c.close);
          candleDataRef.current = cData as CandlePoint[];
          candlestick.setData(cData as any);
          volume.setData(vData as any);
          ema.setData(eData as any);
          if (indicators.sma) { sma.setData(computeSMAData(cData as CandlePoint[]) as any); }
          if (indicators.bb) { const { upper, lower } = computeBBData(cData as CandlePoint[]); bbUpper.setData(upper as any); bbLower.setData(lower as any); }
        }
      };

      loadHistory().catch(() => {
        if (cancelled || !seriesRef.current) return;
        const { cData, vData, eData } = buildDemoCandles(fallbackPrice, tfSeconds, 500);
        candleClosesRef.current = cData.map((c: any) => c.close);
        candleDataRef.current = cData as CandlePoint[];
        candlestick.setData(cData as any);
        volume.setData(vData as any);
        ema.setData(eData as any);
        if (indicators.sma) { sma.setData(computeSMAData(cData as CandlePoint[]) as any); }
        if (indicators.bb) { const { upper, lower } = computeBBData(cData as CandlePoint[]); bbUpper.setData(upper as any); bbLower.setData(lower as any); }
      });
    }

    return () => {
      cancelled = true;
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    };
  }, [currentPair, currentTimeframe]);

  const activeCount = Object.values(indicators).filter(Boolean).length;
  const closes = candleClosesRef.current;
  const rsiValue = closes.length > 14 ? computeRSI(closes) : 50;
  const macdData = closes.length > 26 ? computeMACD(closes) : { macd: 0, signal: 0, hist: 0 };
  const rsiColor = rsiValue > 70 ? '#FF3D00' : rsiValue < 30 ? '#00E676' : '#D4AF37';

  return (
    <div className="w-full h-full min-h-[420px] flex flex-col bg-[#0a0a0a]">
      {/* Main chart area */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Top Toolbar — in-flow, never overlaps chart */}
        <div className="min-h-12 sm:h-10 border-b border-white/5 bg-surface-bg/95 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 sm:px-0 sm:py-0">
          <div className="flex flex-col sm:flex-row sm:items-center min-w-0 sm:h-full gap-2 sm:gap-0">
            <AssetSelector />
            <div className="flex gap-1 sm:px-4 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
              {timeframes.map(tf => (
                <button
                  key={tf}
                  onClick={() => setCurrentTimeframe(tf)}
                  className={`shrink-0 px-3 py-1 rounded text-[10px] font-bold transition-all ${currentTimeframe === tf ? 'bg-accent-primary text-black' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 px-3">
            {/* Indicators button */}
            <div className="relative">
              <button
                onClick={() => setShowPanel(p => !p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${showPanel ? 'bg-accent-primary/10 border-accent-primary/40 text-accent-primary' : 'bg-surface-bg/80 border-white/10 text-white hover:border-accent-primary/40'}`}
              >
                <Settings size={11} className="text-accent-primary" />
                Indicators
                {activeCount > 0 && <span className="bg-accent-primary text-black rounded-full px-1 ml-1">{activeCount}</span>}
              </button>
              {showPanel && (
                <div className="absolute top-full right-0 mt-1 w-52 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-50 p-2">
                  {([
                    { key: 'ema' as IndicatorKey, label: 'EMA (9)', color: '#D4AF37', desc: 'Exponential Moving Avg' },
                    { key: 'sma' as IndicatorKey, label: 'SMA (20)', color: '#F97316', desc: 'Simple Moving Average' },
                    { key: 'bb' as IndicatorKey, label: 'BB (20, 2)', color: '#8B5CF6', desc: 'Bollinger Bands' },
                    { key: 'rsi' as IndicatorKey, label: 'RSI (14)', color: '#60A5FA', desc: 'Relative Strength Index' },
                    { key: 'macd' as IndicatorKey, label: 'MACD (12,26,9)', color: '#A78BFA', desc: 'Moving Avg Convergence' },
                  ] as const).map(ind => (
                    <button
                      key={ind.key}
                      onClick={() => toggleIndicator(ind.key)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group text-left"
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${indicators[ind.key] ? 'border-transparent' : 'border-white/20'}`}
                        style={indicators[ind.key] ? { backgroundColor: ind.color } : {}}>
                        {indicators[ind.key] && <Check size={10} className="text-black" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-white">{ind.label}</div>
                        <div className="text-[9px] text-slate-500">{ind.desc}</div>
                      </div>
                      <div className="w-3 h-0.5 rounded-full shrink-0" style={{ backgroundColor: ind.color }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Active indicator badges */}
            <div className="hidden md:flex items-center gap-1">
              {indicators.ema && (
                <button onClick={() => toggleIndicator('ema')} className="px-2 py-1 rounded text-[9px] font-bold border border-yellow-500/30 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 transition-all">
                  EMA 9 ✕
                </button>
              )}
              {indicators.sma && (
                <button onClick={() => toggleIndicator('sma')} className="px-2 py-1 rounded text-[9px] font-bold border border-orange-500/30 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 transition-all">
                  SMA 20 ✕
                </button>
              )}
              {indicators.bb && (
                <button onClick={() => toggleIndicator('bb')} className="px-2 py-1 rounded text-[9px] font-bold border border-purple-500/30 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 transition-all">
                  BB 20 ✕
                </button>
              )}
              {indicators.rsi && (
                <button onClick={() => toggleIndicator('rsi')} className="px-2 py-1 rounded text-[9px] font-bold border border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-all">
                  RSI 14 ✕
                </button>
              )}
              {indicators.macd && (
                <button onClick={() => toggleIndicator('macd')} className="px-2 py-1 rounded text-[9px] font-bold border border-violet-500/30 text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 transition-all">
                  MACD ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Chart + sidebar row */}
        <div className="flex-1 min-h-0 relative flex flex-row">
          {/* Left Drawing Tools Sidebar */}
          <div className="hidden sm:flex w-12 h-full border-r border-white/5 flex-col items-center py-3 gap-1 z-10 bg-surface-bg/50">
            {TOOLS.map(({ icon: Icon, tool, label }) => (
              <button
                key={tool}
                title={label}
                onClick={() => setActiveTool(tool)}
                className={`p-2 rounded-lg transition-all ${
                  activeTool === tool
                    ? 'text-[#D4AF37] bg-[#D4AF37]/15 ring-1 ring-[#D4AF37]/30'
                    : 'text-slate-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/8'
                }`}
              >
                <Icon size={15} />
              </button>
            ))}
            {hasDrawings && (
              <button
                title="Clear all drawings"
                onClick={clearDrawings}
                className="p-2 mt-auto text-red-500/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          <div className="flex-1 relative overflow-hidden min-h-[280px]">
            <div ref={chartContainerRef} className="w-full h-full absolute inset-0" />
            <canvas
              ref={drawCanvasRef}
              className="absolute inset-0 w-full h-full"
              style={{
                zIndex: 10,
                pointerEvents: activeTool === 'pointer' || activeTool === 'hand' ? 'none' : 'auto',
                cursor: CURSOR_MAP[activeTool],
              }}
            />
            {/* Inline text input for Text tool */}
            {textInput && (
              <input
                ref={textInputRef}
                autoFocus
                placeholder="Type label…"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) {
                      const canvas = drawCanvasRef.current;
                      const ctx = canvas?.getContext('2d');
                      if (canvas && ctx) {
                        shapesRef.current = [...shapesRef.current, { type: 'text', x: textInput.x, y: textInput.y, text: val }];
                        setHasDrawings(true);
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        shapesRef.current.forEach(s => drawShape(ctx, s));
                      }
                    }
                    setTextInput(null);
                  }
                  if (e.key === 'Escape') setTextInput(null);
                }}
                onBlur={() => setTextInput(null)}
                style={{
                  position: 'absolute',
                  left: textInput.x,
                  top: textInput.y - 14,
                  zIndex: 20,
                  background: 'rgba(10,10,11,0.85)',
                  border: '1px solid #D4AF37',
                  borderRadius: 4,
                  color: '#D4AF37',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '2px 6px',
                  outline: 'none',
                  width: 140,
                  fontFamily: 'Inter, sans-serif',
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* RSI Panel */}
      {indicators.rsi && (
        <div className="h-[88px] border-t border-white/5 bg-[#0a0a0a] flex items-center px-4 gap-6 shrink-0">
          <div className="text-[9px] font-bold text-blue-400/60 uppercase tracking-widest w-16 shrink-0">RSI (14)</div>
          <div className="flex-1 flex items-center gap-4">
            <div className="flex-1 h-2 bg-white/5 rounded-full relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500" style={{ width: `${rsiValue}%`, backgroundColor: rsiColor }} />
              <div className="absolute inset-y-0 w-px bg-white/20" style={{ left: '30%' }} />
              <div className="absolute inset-y-0 w-px bg-white/20" style={{ left: '70%' }} />
            </div>
            <div className="text-xl font-bold shrink-0" style={{ color: rsiColor }}>{rsiValue}</div>
          </div>
          <div className="text-[9px] text-slate-500 text-right shrink-0">
            <div className={rsiValue > 70 ? 'text-red-400 font-bold' : rsiValue < 30 ? 'text-green-400 font-bold' : 'text-slate-500'}>
              {rsiValue > 70 ? 'Overbought' : rsiValue < 30 ? 'Oversold' : 'Neutral'}
            </div>
            <div className="text-[8px] mt-0.5">30 / 70</div>
          </div>
        </div>
      )}

      {/* MACD Panel */}
      {indicators.macd && (
        <div className="h-[88px] border-t border-white/5 bg-[#0a0a0a] flex items-center px-4 gap-6 shrink-0">
          <div className="text-[9px] font-bold text-violet-400/60 uppercase tracking-widest w-16 shrink-0">MACD</div>
          <div className="flex-1 flex items-end gap-0.5 h-12">
            {Array.from({ length: 40 }).map((_, i) => {
              const seed = Math.sin(i * 1.3 + macdData.hist) * 0.5;
              const h = Math.abs(seed) * 80 + 10;
              const isPos = seed > 0;
              return (
                <div key={i} className="flex-1 rounded-sm transition-all" style={{ height: `${h}%`, backgroundColor: isPos ? 'rgba(0,230,118,0.5)' : 'rgba(255,61,0,0.5)' }} />
              );
            })}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[11px] font-bold" style={{ color: macdData.macd >= 0 ? '#00E676' : '#FF3D00' }}>
              {macdData.macd >= 0 ? '+' : ''}{macdData.macd.toFixed(4)}
            </div>
            <div className="text-[9px] text-slate-500">Signal: {macdData.signal.toFixed(4)}</div>
            <div className="text-[9px] text-violet-400">Hist: {macdData.hist.toFixed(4)}</div>
          </div>
        </div>
      )}
    </div>
  );
};
