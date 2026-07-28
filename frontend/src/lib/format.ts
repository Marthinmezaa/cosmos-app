const currencyFormatter = new Intl.NumberFormat("es-PY", {
  style: "currency",
  currency: "PYG",
  maximumFractionDigits: 0,
});

export function formatGuaranies(value: string | number): string {
  return currencyFormatter.format(Number(value));
}

export function formatFecha(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
