interface MeterProps {
  label: string;
  displayValue: string;
  fraction: number;
  fillClassName: string;
  sub?: string;
}

// Meter: el relleno lleva la severidad, la pista es un paso mas claro de la misma rampa
// (spec del skill de dataviz). El numero grande es la lectura principal; la barra la refuerza.
export function Meter({ label, displayValue, fraction, fillClassName, sub }: MeterProps) {
  const porcentaje = Math.max(0, Math.min(100, fraction * 100));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{displayValue}</p>
      {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
      <div className="mt-3 h-2 bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-r-[4px] ${fillClassName}`} style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  );
}
