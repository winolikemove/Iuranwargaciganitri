'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import type { MonthlyFinance } from '@/types';

interface FinanceChartProps {
  data: MonthlyFinance[];
  title?: string;
  description?: string;
  formatCurrency?: (amount: number) => string;
}

export function FinanceChart({ 
  data, 
  title = "Grafik Keuangan",
  description = "Pemasukan vs Pengeluaran 6 bulan terakhir",
  formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}: FinanceChartProps) {
  const [activeData, setActiveData] = useState<{ month: string; pemasukan: number; pengeluaran: number; saldo: number } | null>(null);

  // Calculate chart dimensions and scales
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { points: [], max: 0, min: 0 };
    
    const allValues = data.flatMap(d => [d.pemasukan, d.pengeluaran]);
    const max = Math.max(...allValues, 1);
    const min = 0;
    
    const width = 100; // percentage based
    const height = 100; // percentage based
    const padding = 5;
    
    const points = data.map((d, i) => {
      const x = padding + (i * ((width - 2 * padding) / (data.length - 1 || 1)));
      const yPemasukan = height - padding - ((d.pemasukan - min) / (max - min || 1)) * (height - 2 * padding);
      const yPengeluaran = height - padding - ((d.pengeluaran - min) / (max - min || 1)) * (height - 2 * padding);
      
      return {
        x,
        yPemasukan,
        yPengeluaran,
        data: d,
      };
    });
    
    return { points, max, min };
  }, [data]);

  // Generate SVG path
  const generatePath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) / 3;
      const cpx2 = prev.x + 2 * (curr.x - prev.x) / 3;
      path += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return path;
  };

  // Generate area path
  const generateAreaPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    
    const linePath = generatePath(points);
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    
    return `${linePath} L ${lastPoint.x} 95 L ${firstPoint.x} 95 Z`;
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Tidak ada data
          </div>
        </CardContent>
      </Card>
    );
  }

  const pemasukanPoints = chartData.points.map(p => ({ x: p.x, y: p.yPemasukan }));
  const pengeluaranPoints = chartData.points.map(p => ({ x: p.x, y: p.yPengeluaran }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-muted-foreground">Pemasukan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-muted-foreground">Pengeluaran</span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="relative w-full h-48">
          <svg 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
            className="w-full h-full"
            onMouseLeave={() => setActiveData(null)}
          >
            {/* Grid lines */}
            <line x1="5" y1="25" x2="95" y2="25" stroke="currentColor" strokeOpacity="0.1" />
            <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeOpacity="0.1" />
            <line x1="5" y1="75" x2="95" y2="75" stroke="currentColor" strokeOpacity="0.1" />

            {/* Pemasukan Area */}
            <path
              d={generateAreaPath(pemasukanPoints)}
              fill="url(#pemasukanGradient)"
              opacity="0.3"
            />

            {/* Pengeluaran Area */}
            <path
              d={generateAreaPath(pengeluaranPoints)}
              fill="url(#pengeluaranGradient)"
              opacity="0.3"
            />

            {/* Pemasukan Line */}
            <path
              d={generatePath(pemasukanPoints)}
              fill="none"
              stroke="#10b981"
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Pengeluaran Line */}
            <path
              d={generatePath(pengeluaranPoints)}
              fill="none"
              stroke="#ef4444"
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Points - Pemasukan */}
            {chartData.points.map((p, i) => (
              <circle
                key={`pemasukan-${i}`}
                cx={p.x}
                cy={p.yPemasukan}
                r={activeData?.month === p.data.month ? 1.5 : 1}
                fill="#10b981"
                stroke="white"
                strokeWidth="0.3"
                className="cursor-pointer"
                onMouseEnter={() => setActiveData(p.data)}
              />
            ))}

            {/* Data Points - Pengeluaran */}
            {chartData.points.map((p, i) => (
              <circle
                key={`pengeluaran-${i}`}
                cx={p.x}
                cy={p.yPengeluaran}
                r={activeData?.month === p.data.month ? 1.5 : 1}
                fill="#ef4444"
                stroke="white"
                strokeWidth="0.3"
                className="cursor-pointer"
                onMouseEnter={() => setActiveData(p.data)}
              />
            ))}

            {/* Gradients */}
            <defs>
              <linearGradient id="pemasukanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="pengeluaranGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* X Axis Labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
            {data.map((d, i) => (
              <span 
                key={i} 
                className="text-xs text-muted-foreground transform -translate-x-1/2"
                style={{ left: `${5 + (i * 90 / (data.length - 1 || 1))}%`, position: 'absolute' }}
              >
                {d.monthShort}
              </span>
            ))}
          </div>

          {/* Tooltip */}
          {activeData && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-popover border rounded-lg p-3 shadow-lg z-10 min-w-[180px]">
              <p className="font-medium text-sm mb-2">{activeData.month}</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">Pemasukan</span>
                  </div>
                  <span className="text-sm font-medium text-emerald-600">{formatCurrency(activeData.pemasukan)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-muted-foreground">Pengeluaran</span>
                  </div>
                  <span className="text-sm font-medium text-red-600">{formatCurrency(activeData.pengeluaran)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 pt-1 border-t">
                  <div className="flex items-center gap-1">
                    <Wallet className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-muted-foreground">Saldo</span>
                  </div>
                  <span className="text-sm font-medium text-blue-600">{formatCurrency(activeData.saldo)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to generate demo monthly finance data
export function generateMonthlyFinanceData(months: number = 6): MonthlyFinance[] {
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const now = new Date();
  const data: MonthlyFinance[] = [];
  let runningSaldo = 2000000; // Starting saldo
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const pemasukan = Math.floor(Math.random() * 3000000) + 2000000;
    const pengeluaran = Math.floor(Math.random() * 2000000) + 1000000;
    runningSaldo = runningSaldo + pemasukan - pengeluaran;
    
    data.push({
      month: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
      monthShort: monthShort[date.getMonth()],
      pemasukan,
      pengeluaran,
      saldo: runningSaldo,
    });
  }
  
  return data;
}
