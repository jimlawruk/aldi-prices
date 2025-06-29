import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilitiesService {
  productToSlug(product: string): string {
    return (product || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
  }
}
