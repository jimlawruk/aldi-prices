import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UtilitiesService } from './utilities.service';

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
  sortColumn: keyof ProductStats = 'Product';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private utilities: UtilitiesService) {}

  async ngOnInit() {
    const response = await fetch('prices.csv');
    const csvText = await response.text();
    const rows = this.parseCSV(csvText);
    this.stats = this.calculateStats(rows);
  }

  get filteredStats() {
    const stats = this.showSinglePrice ? this.stats : this.stats.filter(s => s.pricesCollected > 1);
    return [...stats].sort((a, b) => {
      let aValue = a[this.sortColumn];
      let bValue = b[this.sortColumn];
      // For numeric columns, compare as numbers
      if (['pricesCollected', 'firstPrice', 'latestPrice', 'annualizedIncrease'].includes(this.sortColumn)) {
        // Remove $ and % for price/increase columns
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

  productToSlug(product: string): string {
    return this.utilities.productToSlug(product);
  }
}
