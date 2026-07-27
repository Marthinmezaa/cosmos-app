/**
 * Arma la parte "SET col1 = $1, col2 = $2" de un UPDATE a partir de un objeto ya
 * filtrado a columnas reales de la tabla (nunca pasar el body crudo del request acá).
 */
export function buildUpdateClause(fields: object, startIndex = 1) {
  const entries = Object.entries(fields).filter(([, value]) => value !== undefined);
  const setClause = entries.map(([column], i) => `${column} = $${i + startIndex}`).join(", ");
  const values = entries.map(([, value]) => value);
  return { setClause, values };
}
