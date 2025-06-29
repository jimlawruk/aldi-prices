import { Component, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';

interface PriceRow {
  Filename: string;
  Date: string;
  Product: string;
  Price: string;
}

@Component({
  selector: 'app-raw-prices',
  standalone: true,
  imports: [NgFor],
  templateUrl: './raw-prices.component.html',
  styleUrls: ['./raw-prices.component.css']
})
export class RawPricesComponent implements OnInit {
  prices: PriceRow[] = [];

  async ngOnInit() {
    const response = await fetch('prices.csv');
    const csvText = await response.text();
    this.prices = this.parseCSV(csvText).sort((a, b) => {
      // Sort by date (ascending), then by product (ascending)
      const dateA = new Date(a.Date);
      const dateB = new Date(b.Date);
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      // If dates are equal, sort by product
      return a.Product.localeCompare(b.Product);
    });
  }

  private parseCSV(csv: string): PriceRow[] {
    const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '' && !/^,+$/.test(line));
    const [header, ...rows] = lines;
    return rows.map(row => {
      const [Filename, Date, Product, Price] = row.split(',');
      // Format price to always have two decimal places
      let formattedPrice = Price;
      if (Price && !isNaN(Number(Price))) {
        formattedPrice = Number(Price).toFixed(2);
      }
      return { Filename, Date, Product, Price: formattedPrice };
    }).filter(row => row.Filename && row.Date && row.Product && row.Price);
  }
}
