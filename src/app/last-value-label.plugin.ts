// Chart.js plugin to draw a label above the last data point and the highest price (if >1 year before last)
export const lastValueLabelPlugin = {
  id: 'lastValueLabel',
  afterDatasetsDraw(chart: any) {
    const { ctx } = chart;
    const dataset = chart.data.datasets[0];
    if (!dataset || !dataset.data.length) return;
    const meta = chart.getDatasetMeta(0);
    const lastIndex = dataset.data.length - 1;
    const lastPoint = meta.data[lastIndex];
    if (lastPoint) {
      const value = dataset.data[lastIndex];
      ctx.save();
      ctx.font = 'bold 1rem Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#1976d2';
      ctx.fillText(`$${Number(value).toFixed(2)}`, lastPoint.x - 10, lastPoint.y - 10);
      ctx.restore();
    }
    // Find highest price and its index
    let maxValue = -Infinity;
    let maxIndex = -1;
    dataset.data.forEach((v: number, i: number) => {
      if (v > maxValue) {
        maxValue = v;
        maxIndex = i;
      }
    });
    // Only label if highest price is more than 1 year before last price
    if (maxIndex !== -1 && maxIndex !== lastIndex) {
      const labels = chart.data.labels;
      const parseDate = (label: string) => {
        // Try to parse as ISO date
        const d = new Date(label);
        if (!isNaN(d.getTime())) return d;
        return new Date(Date.parse(label));
      };
      const lastDate = parseDate(labels[lastIndex]);
      const maxDate = parseDate(labels[maxIndex]);
      if (lastDate && maxDate && (lastDate.getTime() - maxDate.getTime()) > 365 * 24 * 60 * 60 * 1000) {
        const maxPoint = meta.data[maxIndex];
        if (maxPoint) {
          ctx.save();
          ctx.font = 'bold 1rem Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillStyle = '#d2691e'; // Use a brownish color for contrast
          // If highest is first, move label 10px right, else 10px left
          const xOffset = maxIndex === 0 ? 10 : -10;
          ctx.fillText(`$${Number(maxValue).toFixed(2)}`, maxPoint.x + xOffset, maxPoint.y - 10);
          ctx.restore();
        }
      }
    }
  }
};
