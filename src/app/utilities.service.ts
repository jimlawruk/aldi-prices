import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilitiesService {
  productToSlug(product: string): string {
    return (product || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
  }

  basketOfGoods: string[] = [
    '2% Milk Gallon',
    'Bananas lb',
    'Big Dipper Chips',
    'Black Beans',
    'Blackberries',
    'Bran Flakes',
    'Celery',
    'Cheddar Cheese',
    'Cheese Crackers',
    'Chopped Walnuts',
    'Flat Leaf Spinach',
    'Frozen Blueberries',
    'Granny Smith Apples',
    'Greek Plain Yogurt',
    'Ground Coffee',
    'Half and Half',
    'Hot Sauce',
    'Ice Cream',
    'Large Eggs',
    'Multi Peppers',
    'Protein Energy Bar',
    'Protein Energy Bars',
    'Raisin Bran',
    'Thin Pizza',
    'Tuna',
    'Walnuts'
  ];

  async initializeBasketOfGoods(): Promise<void> {
    // Basket of goods is now hardcoded above
  }
}
