import { Component, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';

interface ProductRow {
  Date: string;
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
}
