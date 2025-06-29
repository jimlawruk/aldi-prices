import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RawPricesComponent } from './raw-prices.component';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RawPricesComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'Aldi Prices';
  protected isRawPricesRoute = false;

  private router = inject(Router);

  constructor() {
    this.router.events?.subscribe(() => {
      this.isRawPricesRoute = this.router.url === '/raw-prices';
    });
  }
}
