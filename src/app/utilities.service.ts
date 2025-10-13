import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilitiesService {
  productToSlug(product: string): string {
    return (product || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
  }

  basketOfGoods: string[] = [];

  async initializeBasketOfGoods(): Promise<void> {
    const response = await fetch('prices.csv');
    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '' && !/^,+$/.test(line));
    const [header, ...rows] = lines;
    const productCounts: { [product: string]: number } = {};
    rows.forEach(row => {
      const parts = row.split(',');
      const product = parts[2];
      if (product) {
        productCounts[product] = (productCounts[product] || 0) + 1;
      }
    });
    this.basketOfGoods = Object.keys(productCounts).filter(p => productCounts[p] > 5);
  }
}
