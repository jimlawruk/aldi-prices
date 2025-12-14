import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UtilitiesService } from './utilities.service';
import { loadChartJs } from './chartjs-loader';
import { lastValueLabelPlugin } from './last-value-label.plugin';

interface ProductStats {
  Product: string;
  pricesCollected: number;
  averagePrice: string;
  firstDate: string;
  firstPrice: string;
  latestDate: string;
  latestPrice: string;
  annualizedIncrease: string;
}

@Component({
  selector: 'app-product-prices',
  standalone: true,
  imports: [NgFor, NgIf, RouterModule],
  templateUrl: './product-prices.component.html',
  styleUrls: ['./product-prices.component.css']
})
export class ProductPricesComponent implements OnInit {
  stats: ProductStats[] = [];
  showSinglePrice = false;
  showAllProducts = false;
  sortColumn: keyof ProductStats = 'pricesCollected';
  sortDirection: 'asc' | 'desc' = 'desc';
  basketChart: any = null;
  basketChartData: { years: string[], sums: number[] } = { years: [], sums: [] };

  constructor(private utilities: UtilitiesService) {}

  async ngOnInit() {
    await this.utilities.initializeBasketOfGoods();
    const response = await fetch('prices.csv');
    const csvText = await response.text();
    const rows = this.parseCSV(csvText);
    this.stats = this.calculateStats(rows);
    this.prepareBasketChartData(rows);
    await loadChartJs();
    setTimeout(() => this.renderBasketChart(), 0);
  }

  get filteredStats() {
    if (this.showAllProducts) {
      return [...this.stats].sort((a, b) => {
        let aValue = a[this.sortColumn];
        let bValue = b[this.sortColumn];
        if (['pricesCollected', 'firstPrice', 'latestPrice', 'annualizedIncrease', 'averagePrice'].includes(this.sortColumn)) {
          aValue = typeof aValue === 'string' ? aValue.replace(/[$,% ]/g, '') : aValue;
          bValue = typeof bValue === 'string' ? bValue.replace(/[$,% ]/g, '') : bValue;
          aValue = Number(aValue);
          bValue = Number(bValue);
          if (isNaN(aValue)) aValue = 0;
          if (isNaN(bValue)) bValue = 0;
        }
        if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Only show products in basketOfGoods
      const basket = this.utilities.basketOfGoods;
      return [...this.stats].filter(s => basket.includes(s.Product)).sort((a, b) => {
        let aValue = a[this.sortColumn];
        let bValue = b[this.sortColumn];
        if (['pricesCollected', 'firstPrice', 'latestPrice', 'annualizedIncrease', 'averagePrice'].includes(this.sortColumn)) {
          aValue = typeof aValue === 'string' ? aValue.replace(/[$,% ]/g, '') : aValue;
          bValue = typeof bValue === 'string' ? bValue.replace(/[$,% ]/g, '') : bValue;
          aValue = Number(aValue);
          bValue = Number(bValue);
          if (isNaN(aValue)) aValue = 0;
          if (isNaN(bValue)) bValue = 0;
        }
        if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
  }

  setSort(column: keyof ProductStats) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  private parseCSV(csv: string) {
    const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '' && !/^,+$/.test(line));
    const [header, ...rows] = lines;
    return rows.map(row => {
      const [Filename, Date, Product, Price] = row.split(',');
      let formattedPrice = Price;
      if (Price && !isNaN(Number(Price))) {
        formattedPrice = Number(Price).toFixed(2);
      }
      return { Filename, Date, Product, Price: formattedPrice };
    }).filter(row => row.Filename && row.Date && row.Product && row.Price);
  }

  private calculateStats(rows: any[]): ProductStats[] {
    const grouped: { [product: string]: any[] } = {};
    for (const row of rows) {
      if (!grouped[row.Product]) grouped[row.Product] = [];
      grouped[row.Product].push(row);
    }
    // Alphabetically order products by name
    return Object.entries(grouped)
      .map(([product, entries]) => {
        const sorted = entries.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
        const pricesCollected = sorted.length;
        const first = sorted[0];
        const latest = sorted[sorted.length - 1];
        const firstDate = first.Date;
        const firstPrice = first.Price;
        const latestDate = latest.Date;
        const latestPrice = latest.Price;
        // Calculate average price
        const avg = (sorted.reduce((sum, e) => sum + Number(e.Price), 0) / pricesCollected).toFixed(2);
        let annualizedIncrease = '';
        if (pricesCollected > 1) {
          const years = (new Date(latestDate).getTime() - new Date(firstDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
          if (years > 0) {
            const pct = (Math.pow(Number(latestPrice) / Number(firstPrice), 1 / years) - 1) * 100;
            annualizedIncrease = pct.toFixed(2) + '%';
          } else {
            annualizedIncrease = '0.00%';
          }
        } else {
          annualizedIncrease = '0.00%';
        }
        return {
          Product: product,
          pricesCollected,
          averagePrice: avg,
          firstDate,
          firstPrice,
          latestDate,
          latestPrice,
          annualizedIncrease
        };
      })
      .sort((a, b) => a.Product.localeCompare(b.Product));
  }

  prepareBasketChartData(rows: any[]) {
    // Group prices by product and year
    const basket = this.utilities.basketOfGoods;
    const productYearPrices: { [product: string]: { [year: string]: number[] } } = {};
    rows.forEach(row => {
      if (!basket.includes(row.Product)) return;
      const year = row.Date.slice(0, 4);
      if (!productYearPrices[row.Product]) productYearPrices[row.Product] = {};
      if (!productYearPrices[row.Product][year]) productYearPrices[row.Product][year] = [];
      productYearPrices[row.Product][year].push(Number(row.Price));
    });
    // Get all years in data
    const allYears = Array.from(new Set(rows.map(r => r.Date.slice(0, 4)))).sort();
    // For each year, sum average price for each product in basket
    const yearSums: { [year: string]: number } = {};
    basket.forEach(product => {
      let lastAvg: number|null = null;
      allYears.forEach(year => {
        let avg: number|null = null;
        if (productYearPrices[product][year]) {
          const prices = productYearPrices[product][year];
          avg = prices.reduce((a, b) => a + b, 0) / prices.length;
          lastAvg = avg;
        } else if (lastAvg !== null) {
          avg = lastAvg;
        } else {
          // Look ahead for next available year
          const nextYear = allYears.find(y => y > year && productYearPrices[product][y]);
          if (nextYear) {
            const prices = productYearPrices[product][nextYear];
            avg = prices.reduce((a, b) => a + b, 0) / prices.length;
            lastAvg = avg;
          }
        }
        if (!yearSums[year]) yearSums[year] = 0;
        if (avg !== null) {
          if (product === 'Bananas lb') {
            yearSums[year] += avg * 5;
          } else {
            yearSums[year] += avg;
          }
        }
      });
    });
    this.basketChartData = {
      years: allYears,
      sums: allYears.map(y => Number(yearSums[y]?.toFixed(2) || 0))
    };
  }

  renderBasketChart() {
    const el = document.getElementById('basketChart') as HTMLCanvasElement;
    if (!el) return;
    if (this.basketChart) {
      this.basketChart.destroy();
      this.basketChart = null;
    }
    this.basketChart = new (window as any).Chart(el, {
      type: 'line',
      data: {
        labels: this.basketChartData.years,
        datasets: [{
          label: 'Basket of Goods Price Sum',
          data: this.basketChartData.sums,
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        scales: {
          x: { title: { display: true, text: 'Year' } },
          y: {
            title: { display: true, text: 'Sum of Avg Prices ($)' },
            min: 60,
            max: 100
          }
        }
      },
      plugins: [lastValueLabelPlugin]
    });
  }

  productToSlug(product: string): string {
    return this.utilities.productToSlug(product);
  }
}
