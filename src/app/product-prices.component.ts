  // ...existing code...

    // ...existing code...

    // ...existing code...
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
  basketChartData: { quarters: string[], sums: number[] } = { quarters: [], sums: [] };
  basketTableData: { quarters: string[], products: { name: string, prices: (number|null)[], estimates: boolean[] }[], totals: number[] } = 
    { quarters: [], products: [], totals: [] };

  // New state for active view
  activeView: 'basket' | 'products' = 'basket';

  setActiveView(view: 'basket' | 'products') {
    this.activeView = view;
    if (view === 'basket') {
      setTimeout(() => this.renderBasketChart(), 0);
    }
  }

  constructor(private utilities: UtilitiesService) {}

  async ngOnInit() {
    this.activeView = 'basket'; // Always default to basket view on reload
    await this.utilities.initializeBasketOfGoods();
    const response = await fetch('prices.csv');
    const csvText = await response.text();
    const rows = this.parseCSV(csvText);
    this.stats = this.calculateStats(rows);
    this.prepareBasketChartData(rows);
    this.prepareBasketTableData(rows);
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
    this.prepareBasketTableData(rows);
    // Chart data is derived from table data
    this.basketChartData = {
      quarters: this.basketTableData.quarters,
      sums: this.basketTableData.totals
    };
  }

  prepareBasketTableData(rows: any[]) {
    // Helper function to get quarter from date
    const getQuarter = (dateStr: string): string => {
      const date = new Date(dateStr);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      if (month >= 1 && month <= 3) return `Q1-${year}`;
      if (month >= 4 && month <= 6) return `Q2-${year}`;
      if (month >= 7 && month <= 9) return `Q3-${year}`;
      return `Q4-${year}`;
    };

    // Group prices by product and quarter
    const basket = this.utilities.basketOfGoods;
    const productQuarterPrices: { [product: string]: { [quarter: string]: number[] } } = {};
    rows.forEach(row => {
      if (!basket.includes(row.Product)) return;
      const quarter = getQuarter(row.Date);
      if (!productQuarterPrices[row.Product]) productQuarterPrices[row.Product] = {};
      if (!productQuarterPrices[row.Product][quarter]) productQuarterPrices[row.Product][quarter] = [];
      productQuarterPrices[row.Product][quarter].push(Number(row.Price));
    });

    // Get all quarters and sort
    const allQuarters = Array.from(new Set(rows.map(r => getQuarter(r.Date)))).sort((a, b) => {
      const [qA, yA] = a.split('-');
      const [qB, yB] = b.split('-');
      if (yA !== yB) return parseInt(yA) - parseInt(yB);
      return parseInt(qA.slice(1)) - parseInt(qB.slice(1));
    });

    // Build table data
    const products: { name: string, prices: (number|null)[], estimates: boolean[] }[] = [];
    const totals: number[] = new Array(allQuarters.length).fill(0);

    basket.forEach(product => {
      // Build array of actual averages for each quarter
      const actualAvgs: (number|null)[] = allQuarters.map(q => {
        if (productQuarterPrices[product] && productQuarterPrices[product][q]) {
          const priceList = productQuarterPrices[product][q];
          return priceList.reduce((a, b) => a + b, 0) / priceList.length;
        }
        return null;
      });

      // Interpolate missing values linearly and track estimates
      const prices: (number|null)[] = [...actualAvgs];
      const estimates: boolean[] = prices.map(v => v === null ? false : true); // will update below
      let idx = 0;
      while (idx < prices.length) {
        if (prices[idx] !== null) {
          estimates[idx] = false; // actual value
          idx++;
          continue;
        }
        // Start of missing range
        let startIdx = idx - 1;
        let endIdx = idx;
        while (endIdx < prices.length && prices[endIdx] === null) {
          endIdx++;
        }
        let prevPrice: number|null = startIdx >= 0 ? prices[startIdx] : null;
        let nextPrice: number|null = endIdx < prices.length ? prices[endIdx] : null;
        const numMissing = endIdx - idx;
        for (let fillIdx = 0; fillIdx < numMissing; fillIdx++) {
          let estimate: number|null = null;
          if (prevPrice !== null && nextPrice !== null) {
            estimate = prevPrice + ((nextPrice - prevPrice) * (fillIdx + 1)) / (numMissing + 1);
          } else if (prevPrice !== null) {
            estimate = prevPrice;
          } else if (nextPrice !== null) {
            estimate = nextPrice;
          }
          prices[idx + fillIdx] = estimate;
          estimates[idx + fillIdx] = true; // mark as estimate
        }
        idx = endIdx;
      }

      // Add to totals (accounting for Bananas lb multiplier)
      prices.forEach((avg, qIdx) => {
        if (avg !== null) {
          if (product === 'Bananas lb') {
            totals[qIdx] += avg * 5;
          } else {
            totals[qIdx] += avg;
          }
        }
      });

      products.push({ name: product, prices, estimates });
    });

    this.basketTableData = {
      quarters: allQuarters,
      products,
      totals: totals.map(t => Number(t.toFixed(2)))
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
        labels: this.basketChartData.quarters,
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
          x: { title: { display: true, text: 'Quarter' } },
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

  // Helper to detect if a cell is an estimate (interpolated)
  public isEstimateCell(productName: string, quarterIdx: number): boolean {
    const product = this.basketTableData.products.find(p => p.name === productName);
    if (!product || !product.estimates) return false;
    return !!product.estimates[quarterIdx];
  }
}
