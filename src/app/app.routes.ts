import { Routes } from '@angular/router';
import { RawPricesComponent } from './raw-prices.component';
import { ProductPricesComponent } from './product-prices.component';
import { ProductComponent } from './product.component';

export const routes: Routes = [
  {
    path: '',
    component: ProductPricesComponent
  },
  {
    path: 'raw-prices',
    component: RawPricesComponent
  },
  {
    path: 'product-prices',
    component: ProductPricesComponent
  },
  {
    path: 'products/:slug',
    component: ProductComponent
  }
];
