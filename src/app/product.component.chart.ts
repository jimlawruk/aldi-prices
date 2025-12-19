import { Component, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';

interface ProductRow {
  Date: string;
  Quarter: string;
  Price: string;
}

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [NgFor, RouterModule],
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
        setTimeout(() => this.renderChart(), 0);
      }
    });
  }

  private slugToName(slug: string): string {
    let name = slug.replace(/-/g, ' ');
    if (name.startsWith('2 milk')) {
      name = name.replace('2 milk', '2% Milk');
    }
    return name.replace(/\b\w/g, c => c.toUpperCase());
  }

  private parseCSV(csv: string, productName: string): ProductRow[] {
    const getQuarter = (dateStr: string): string => {
      const date = new Date(dateStr);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      if (month >= 1 && month <= 3) return `Q1 - ${year}`;
      if (month >= 4 && month <= 6) return `Q2 - ${year}`;
      if (month >= 7 && month <= 9) return `Q3 - ${year}`;
      return `Q4 - ${year}`;
    };
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
      return { Date, Quarter: getQuarter(Date), Product, Price: formattedPrice };
    })
    .filter(row => row.Product && row.Product.toLowerCase() === productName.toLowerCase())
    .map(row => ({ Date: row.Date, Quarter: row.Quarter, Price: row.Price }))
    .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
  }

  private renderChart() {
    const chartEl = document.getElementById('priceChart') as HTMLCanvasElement;
    // Use (window as any).Chart to avoid TS7015 error
    if (!chartEl || !(window as any).Chart) return;
    const labels = this.rows.map(row => {
      const d = new Date(row.Date);
      return d.toLocaleString('default', { month: 'short', year: '2-digit' });
    });
    const data = this.rows.map(row => Number(row.Price));
    new (window as any).Chart(chartEl, {
      type: 'line',
      data: {
        labels,
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
                const date = this.rows[idx].Date;
                const price = this.rows[idx].Price;
                return `${date}: $${price}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: false },
            ticks: { color: '#222' }
          },
          y: {
            title: { display: false },
            ticks: { color: '#222', callback: (v: number) => `$${v.toFixed(2)}` },
            min: 50,
            max: 100
          }
        },
        interaction: {
          mode: 'nearest',
          intersect: false
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
}
