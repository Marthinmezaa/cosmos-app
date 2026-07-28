import { useState } from "react";
import type { AvanceAnual } from "../../lib/types";

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Paleta categorica validada (color-formula.md): orden fijo, nunca ciclada.
// Slot 1 azul, slot 2 naranja, slot 3 aqua — asignados en orden cronologico (mas viejo primero).
const SERIES_COLORS = [
  { stroke: "stroke-[#2a78d6] dark:stroke-[#3987e5]", fill: "fill-[#2a78d6] dark:fill-[#3987e5]", swatch: "bg-[#2a78d6] dark:bg-[#3987e5]" },
  { stroke: "stroke-[#eb6834] dark:stroke-[#d95926]", fill: "fill-[#eb6834] dark:fill-[#d95926]", swatch: "bg-[#eb6834] dark:bg-[#d95926]" },
  { stroke: "stroke-[#1baf7a] dark:stroke-[#199e70]", fill: "fill-[#1baf7a] dark:fill-[#199e70]", swatch: "bg-[#1baf7a] dark:bg-[#199e70]" },
];

const WIDTH = 680;
const HEIGHT = 260;
const MARGIN = { top: 16, right: 16, bottom: 28, left: 34 };
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;

function nicMax(value: number): number {
  if (value <= 0) return 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

function xForMonth(index: number): number {
  return MARGIN.left + (index / 11) * PLOT_WIDTH;
}

interface AvanceAnualChartProps {
  series: AvanceAnual[];
}

export function AvanceAnualChart({ series }: AvanceAnualChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxValor = Math.max(0, ...series.flatMap((s) => s.valores));
  const yMax = nicMax(maxValor);
  const yForValor = (v: number) => MARGIN.top + PLOT_HEIGHT - (v / yMax) * PLOT_HEIGHT;

  const yTicks = [0, yMax / 2, yMax];
  const hoverX = hoverIndex === null ? null : xForMonth(hoverIndex);
  const tooltipLeftPct = hoverIndex === null ? 0 : (xForMonth(hoverIndex) / WIDTH) * 100;

  return (
    <div className="p-4">
      <div className="relative">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Avance anual de instalaciones acumuladas por mes">
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={WIDTH - MARGIN.right}
                y1={yForValor(tick)}
                y2={yForValor(tick)}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth={1}
              />
              <text
                x={MARGIN.left - 8}
                y={yForValor(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-slate-400 text-[10px] dark:fill-slate-500"
              >
                {Math.round(tick)}
              </text>
            </g>
          ))}

          {MESES_CORTOS.map((mes, index) => (
            <text
              key={mes}
              x={xForMonth(index)}
              y={HEIGHT - MARGIN.bottom + 16}
              textAnchor="middle"
              className="fill-slate-400 text-[10px] dark:fill-slate-500"
            >
              {mes}
            </text>
          ))}

          {hoverX !== null && (
            <line x1={hoverX} x2={hoverX} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} className="stroke-slate-300 dark:stroke-slate-700" strokeWidth={1} />
          )}

          {series.map((serie, seriesIndex) => {
            const color = SERIES_COLORS[seriesIndex % SERIES_COLORS.length];
            const puntos = serie.valores.map((v, i) => `${xForMonth(i)},${yForValor(v)}`).join(" ");
            const ultimoValor = serie.valores[serie.valores.length - 1];

            return (
              <g key={serie.anio}>
                <polyline points={puntos} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" className={color.stroke} />
                <circle
                  cx={xForMonth(11)}
                  cy={yForValor(ultimoValor)}
                  r={4}
                  strokeWidth={2}
                  className={`${color.fill} stroke-white dark:stroke-slate-900`}
                />
              </g>
            );
          })}

          {/* Zonas de hover, una por mes: el hit target es la columna completa, no el punto. */}
          {MESES_CORTOS.map((_, index) => (
            <rect
              key={index}
              x={MARGIN.left + (index / 12) * PLOT_WIDTH}
              y={MARGIN.top}
              width={PLOT_WIDTH / 12}
              height={PLOT_HEIGHT}
              fill="transparent"
              onPointerEnter={() => setHoverIndex(index)}
              onPointerLeave={() => setHoverIndex((current) => (current === index ? null : current))}
              onFocus={() => setHoverIndex(index)}
              tabIndex={0}
              aria-label={`${MESES_CORTOS[index]}: ${series.map((s) => `${s.anio} ${s.valores[index]}`).join(", ")}`}
            />
          ))}
        </svg>

        {hoverIndex !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800"
            style={{ left: `${Math.min(88, Math.max(12, tooltipLeftPct))}%` }}
          >
            <p className="mb-1 font-medium text-slate-700 dark:text-slate-200">{MESES_CORTOS[hoverIndex]}</p>
            {series.map((serie, seriesIndex) => (
              <div key={serie.anio} className="flex items-center gap-2 py-0.5">
                <span className={`h-0.5 w-3 ${SERIES_COLORS[seriesIndex % SERIES_COLORS.length].swatch}`} />
                <span className="font-semibold text-slate-900 dark:text-white">{serie.valores[hoverIndex]}</span>
                <span className="text-slate-500 dark:text-slate-400">{serie.anio}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-4">
        {series.map((serie, seriesIndex) => (
          <div key={serie.anio} className="flex items-center gap-1.5 text-xs">
            <span className={`h-0.5 w-4 ${SERIES_COLORS[seriesIndex % SERIES_COLORS.length].swatch}`} />
            <span className="text-slate-600 dark:text-slate-300">{serie.anio}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
