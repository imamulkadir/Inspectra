// Touch-grid coverage tracker (section 20.2). Grid dimensions are runtime,
// not sourced from the dataset (gridRows/gridColumns are null — calibration
// unresolved) — no pass threshold is ever applied here.
export function createTouchGridController({ rows = 6, columns = 4 } = {}) {
  const totalCells = rows * columns;
  const touched = new Set();
  let interruptions = 0;
  let lastCell = null;

  function touchCell(cellIndex) {
    touched.add(cellIndex);
    if (lastCell !== null && Math.abs(cellIndex - lastCell) > columns + 1) {
      interruptions += 1;
    }
    lastCell = cellIndex;
  }

  function reset() {
    touched.clear();
    interruptions = 0;
    lastCell = null;
  }

  function snapshot() {
    return {
      rows,
      columns,
      totalCells,
      touchedCells: touched.size,
      untouchedCells: totalCells - touched.size,
      coverageRatio: totalCells > 0 ? touched.size / totalCells : 0,
      interruptions,
      touchedIndexes: [...touched],
    };
  }

  return { touchCell, reset, snapshot, totalCells, rows, columns };
}
