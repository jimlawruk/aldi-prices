import { Component, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UtilitiesService } from './utilities.service';

interface ProductStats {
  Product: string;
  pricesCollected: number;
  firstDate: string;
  firstPrice: string;
  latestDate: string;
  latestPrice: string;
  annualizedIncrease: string;
}

@Component({
  selector: 'app-product-prices',
  standalone: true,
  imports: [NgFor, RouterModule],
  templateUrl: './product-prices.component.html',
  styleUrls: ['./product-prices.component.css']
})
export class ProductPricesComponent implements OnInit {
  stats: ProductStats[] = [];

  constructor(private utilities: UtilitiesService) {}

  async ngOnInit() {
    const response = await fetch('prices.csv');
    const csvText = await response.text();
    const rows = this.parseCSV(csvText);
    this.stats = this.calculateStats(rows);
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
    return Object.entries(grouped).map(([product, entries]) => {
      const sorted = entries.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
      const pricesCollected = sorted.length;
      const first = sorted[0];
      const latest = sorted[sorted.length - 1];
      const firstDate = first.Date;
      const firstPrice = first.Price;
      const latestDate = latest.Date;
      const latestPrice = latest.Price;
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
        firstDate,
        firstPrice,
        latestDate,
        latestPrice,
        annualizedIncrease
      };
    });
  }

  productToSlug(product: string): string {
    return this.utilities.productToSlug(product);
  }
}
