import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { loadChartJs } from './chartjs-loader';
import { lastValueLabelPlugin } from './last-value-label.plugin';
import { NgIf, NgFor } from '@angular/common';

interface ProductRow {
  Date: string;
  Quarter: string;
  Price: string;
}

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [RouterModule, NgIf, NgFor],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent implements OnInit {
  productName = '';
  rows: ProductRow[] = [];

  constructor(private route: ActivatedRoute) {}

  async ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const slug = params.get('slug');
      if (slug) {
        this.productName = this.slugToName(slug);
        const response = await fetch('prices.csv');
        const csvText = await response.text();
        this.rows = this.parseCSV(csvText, this.productName);
        await loadChartJs();
        setTimeout(() => this.renderChart(), 0);
      }
    });
  }

  private slugToName(slug: string): string {
    // Convert kebab-case to Title Case (e.g. spread-butter -> Spread Butter)
    // Special handling for 2-milk to match 2% Milk
    let name = slug.replace(/-/g, ' ');
    if (name.startsWith('2 milk')) {
      name = name.replace('2 milk', '2% Milk');
    }
    return name.replace(/\b\w/g, c => c.toUpperCase());
  }

  private parseCSV(csv: string, productName: string): ProductRow[] {
        if (productName.toLowerCase().includes('big dipper chips')) {
          console.log('--- DEBUG: Big Dipper Chips parseCSV ---');
        }
    const getQuarter = (dateStr: string): string => {
      // Accepts either a date string or a Date object
      let date: Date;
      if (typeof dateStr === 'string') {
        // Only use the date part if ISO string
        if (dateStr.length > 10 && dateStr.includes('T')) {
          date = new Date(dateStr.substring(0, 10));
        } else {
          date = new Date(dateStr);
        }
      } else {
        date = dateStr;
      }
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      if (month >= 1 && month <= 3) return `Q1 - ${year}`;
      if (month >= 4 && month <= 6) return `Q2 - ${year}`;
      if (month >= 7 && month <= 9) return `Q3 - ${year}`;
      return `Q4 - ${year}`;
    };

    const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '' && !/^,+$/.test(line));
    const [header, ...rows] = lines;
    
    // Parse actual data rows
    const actualRows = rows.map(row => {
      const parts = row.split(',');
      const Date = parts[1];
      const Product = parts[2];
      const Price = parts[3];
      let formattedPrice = Price;
      if (Price && !isNaN(Number(Price))) {
        formattedPrice = Number(Price).toFixed(2);
      }
      return { Date, Quarter: getQuarter(Date), Product, Price: formattedPrice };
    })
    .filter(row => row.Product && row.Product.toLowerCase() === productName.toLowerCase())
    .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
    if (productName.toLowerCase().includes('big dipper chips')) {
      console.log('actualRows:', actualRows);
    }

    if (actualRows.length === 0) return [];

    // Group by quarter to get average prices
    const quarterData: { [quarter: string]: { dates: string[], prices: number[] } } = {};
    actualRows.forEach(row => {
      if (!quarterData[row.Quarter]) {
        quarterData[row.Quarter] = { dates: [], prices: [] };
      }
      quarterData[row.Quarter].dates.push(row.Date);
      quarterData[row.Quarter].prices.push(Number(row.Price));
    });
    if (productName.toLowerCase().includes('big dipper chips')) {
      console.log('quarterData:', quarterData);
    }

    // Get all quarters between first and last
    const firstDate = new Date(actualRows[0].Date);
    const lastDate = new Date(actualRows[actualRows.length - 1].Date);
    const allQuarters: string[] = [];
    
    let currentDate = new Date(firstDate.getFullYear(), Math.floor(firstDate.getMonth() / 3) * 3, 1);
    const endDate = new Date(lastDate.getFullYear(), Math.floor(lastDate.getMonth() / 3) * 3, 1);
    while (currentDate <= endDate) {
      // Use the same date format as in the CSV for quarter calculation
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
      const q = getQuarter(dateStr);
      allQuarters.push(q);
      currentDate.setMonth(currentDate.getMonth() + 3);
    }
    if (productName.toLowerCase().includes('big dipper chips')) {
      console.log('allQuarters:', allQuarters);
    }

    // Build complete rows with estimates (handle consecutive missing quarters with linear interpolation)
    const completeRows: ProductRow[] = [];
    let idx = 0;
    while (idx < allQuarters.length) {
      const quarter = allQuarters[idx];
      if (quarterData[quarter]) {
        // Has actual data - add all actual rows for this quarter
        quarterData[quarter].dates.forEach((date, i) => {
          completeRows.push({
            Date: date,
            Quarter: quarter,
            Price: quarterData[quarter].prices[i].toFixed(2)
          });
        });
        idx++;
      } else {
        // Start of a missing range
        let startIdx = idx - 1;
        let endIdx = idx;
        while (endIdx < allQuarters.length && !quarterData[allQuarters[endIdx]]) {
          endIdx++;
        }
        // Find previous and next known prices
        let prevPrice: number | null = null;
        let nextPrice: number | null = null;
        if (startIdx >= 0) {
          const prevQ = allQuarters[startIdx];
          if (quarterData[prevQ]) {
            prevPrice = quarterData[prevQ].prices.reduce((a, b) => a + b, 0) / quarterData[prevQ].prices.length;
          }
        }
        if (endIdx < allQuarters.length) {
          const nextQ = allQuarters[endIdx];
          if (quarterData[nextQ]) {
            nextPrice = quarterData[nextQ].prices.reduce((a, b) => a + b, 0) / quarterData[nextQ].prices.length;
          }
        }
        const numMissing = endIdx - idx;
        if (productName.toLowerCase().includes('big dipper chips')) {
          console.log('MISSING RANGE:', {startIdx, endIdx, prevPrice, nextPrice, numMissing, idx, allQuarters: allQuarters.slice(idx, endIdx)});
        }
        for (let fillIdx = 0; fillIdx < numMissing; fillIdx++) {
          let estimate: number | null = null;
          if (prevPrice !== null && nextPrice !== null) {
            // Linear interpolation
            estimate = prevPrice + ((nextPrice - prevPrice) * (fillIdx + 1)) / (numMissing + 1);
          } else if (prevPrice !== null) {
            estimate = prevPrice;
          } else if (nextPrice !== null) {
            estimate = nextPrice;
          }
          if (productName.toLowerCase().includes('big dipper chips')) {
            console.log('Estimate for', allQuarters[idx + fillIdx], ':', estimate);
          }
          if (estimate !== null) {
            completeRows.push({
              Date: 'estimate',
              Quarter: allQuarters[idx + fillIdx],
              Price: estimate.toFixed(2)
            });
          }
        }
        idx = endIdx;
      }
    }

    return completeRows;
  }

  private renderChart() {
    const chartEl = document.getElementById('priceChart') as HTMLCanvasElement;
    if (!chartEl || !(window as any).Chart) return;
    // Set canvas width to match parent container for full responsiveness
    const parent = chartEl.parentElement;
    if (parent) {
      chartEl.width = parent.clientWidth;
    }
    // Use ISO dates as labels for correct plugin logic
    const isoLabels = this.rows.map(row => row.Date);
    const displayLabels = this.rows.map(row => {
      const d = new Date(row.Date);
      return d.toLocaleString('default', { month: 'short', year: '2-digit' });
    });
    const data = this.rows.map(row => Number(row.Price));
    // Calculate min/max and expand the range to double
    let min = Math.min(...data);
    let max = Math.max(...data);
    const center = (min + max) / 2;
    const halfRange = (max - min) / 2;
    min = Math.max(0, center - halfRange);
    max = center + halfRange;
    // Now double the range
    min = Math.max(0, center - (max - min));
    max = center + (max - min);
    new (window as any).Chart(chartEl, {
      type: 'line',
      data: {
        labels: isoLabels, // Use ISO dates for plugin
        datasets: [{
          data,
          borderColor: '#1976d2',
          backgroundColor: '#1976d2',
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: false,
          tension: 0.2,
        }]
      },
      options: {
        plugins: {
          legend: { display: false },
          title: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const idx = ctx.dataIndex;
                const date = displayLabels[idx];
                const price = this.rows[idx].Price;
                return `${date}: $${price}`;
              }
            }
          },
          lastValueLabel: {},
        },
        scales: {
          x: {
            title: { display: false },
            ticks: {
              color: '#222',
              callback: (v: any, idx: number) => displayLabels[idx]
            }
          },
          y: {
            title: { display: false },
            min,
            max,
            ticks: { color: '#222', callback: (v: number) => `$${v.toFixed(2)}` }
          }
        },
        interaction: {
          mode: 'nearest',
          intersect: false
        },
        responsive: true,
        maintainAspectRatio: false
      },
      plugins: [lastValueLabelPlugin]
    });
  }
}
