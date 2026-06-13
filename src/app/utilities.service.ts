import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilitiesService {
  // Product name aliases - map canonical names to arrays of aliases
  productAliases: { [key: string]: string[] } = {
    '2% Milk Gallon': ['2% Gallon Milk'],
    'Bananas lb': ['Bananas'],
    'Black Beans': ['Balck Beans'],
    'Cheddar Cheese': ['Mild Cheddar Cheese'],
    'Greek Plain Yogurt': ['Greek Yogurt'],
    'Mixed Nuts': ['Mixed Nuts 14.75', 'Mixed Nuts 14.75 oz', 'Raw Mixed Nuts'],
    'Multi Peppers 3pk': ['Multi-Peppers 3 pk', 'Multi Peppers'],
    'Potatoes 10lb': ['Pototoes 10 lb'],
    'Pure Olive Oil': ['Pure Olive Oil 16.9 oz'],
    'Raspberries': ['Rasberries'],
    'Spread Butter': ['Spead Butter'],
    'Thin Wheat Crackers': ['Thin Wheat Cracker'],
    'Toaster Tarts': ['Toater Tarts'],
    'Tuna': ['Chunk Tuna'],
    'Whole Milk Gallon': ['Whole Milk', 'Whole Milks', 'While Milk', 'Milk Gallon'],
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
