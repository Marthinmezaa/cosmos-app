export interface BarComparisonRow {
  key: string;
  label: string;
  value: number;
  colorClassName: string;
}

interface BarComparisonProps {
  rows: BarComparisonRow[];
  max?: number;
  formatValue?: (value: number) => string;
}

// Barra horizontal: pista cuadrada (mobiliario del grafico), relleno con la punta
// redondeada (4px) y la base cuadrada, siguiendo el spec de "bar / column" del skill de dataviz.
export function BarComparison({ rows, max, formatValue = String }: BarComparisonProps) {
  const maximo = max ?? Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="space-y-3 p-4">
      {rows.map((row) => {
        const porcentaje = maximo === 0 ? 0 : Math.min(100, (row.value / maximo) * 100);
        return (
          <div key={row.key} className="flex items-center gap-3 text-sm">
            <span className="w-20 shrink-0 text-slate-600 dark:text-slate-300">{row.label}</span>
            <div className="relative h-2 flex-1 bg-slate-100 dark:bg-slate-800">
              <div
                className={`absolute inset-y-0 left-0 rounded-r-[4px] ${row.colorClassName}`}
                style={{ width: `${porcentaje}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right font-medium text-slate-900 dark:text-white">
              {formatValue(row.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
