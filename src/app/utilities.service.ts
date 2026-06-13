import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilitiesService {
  // Product name aliases - map canonical names to arrays of aliases
  productAliases: { [key: string]: string[] } = {
    'Whole Milk Gallon': ['Whole Milks', 'While Milk', 'Milk Gallon'],
    'Toaster Tarts': ['Toater Tarts']
    // Add more aliases here as needed
  };

  productToSlug(product: string): string {
    return (product || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
  }

  applyProductAlias(productName: string): string {
    const trimmedName = (productName || '').trim();
    
    // Check if the product name is already canonical (case-insensitive)
    for (const canonical of Object.keys(this.productAliases)) {
      if (canonical.toLowerCase() === trimmedName.toLowerCase()) {
        return canonical;
      }
    }
    
    // Search for the canonical name by checking all aliases (case-insensitive)
    for (const [canonical, aliases] of Object.entries(this.productAliases)) {
      if (aliases.some(alias => alias.toLowerCase() === trimmedName.toLowerCase())) {
        return canonical;
      }
    }
    
    // Return original if no alias found
    return trimmedName;
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
