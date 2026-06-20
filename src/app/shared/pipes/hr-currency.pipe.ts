import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hrCurrency',
  standalone: true
})
export class HrCurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined, currencyCode: string = 'PEN'): string {
    if (value === null || value === undefined) return '—';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '—';

    const formatted = num.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    switch (currencyCode.toUpperCase()) {
      case 'USD':
        return `$ ${formatted}`;
      case 'EUR':
        return `€ ${formatted}`;
      case 'PEN':
      default:
        return `S/ ${formatted}`;
    }
  }
}
