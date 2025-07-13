import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { loadChartJs } from './chartjs-loader';
import { lastValueLabelPlugin } from './last-value-label.plugin';
import { NgIf, NgFor } from '@angular/common';

interface ProductRow {
  Date: string;
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
    const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '' && !/^,+$/.test(line));
    const [header, ...rows] = lines;
    return rows.map(row => {
      const parts = row.split(',');
      const Date = parts[1];
      const Product = parts[2];
      const Price = parts[3];
      let formattedPrice = Price;
      if (Price && !isNaN(Number(Price))) {
        formattedPrice = Number(Price).toFixed(2);
      }
      return { Date, Product, Price: formattedPrice };
    })
    .filter(row => row.Product && row.Product.toLowerCase() === productName.toLowerCase())
    .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
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
