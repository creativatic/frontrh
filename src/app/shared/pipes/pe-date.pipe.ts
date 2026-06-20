import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'peDate',
  standalone: true
})
export class PeDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '—';
    
    if (typeof value === 'string') {
      const parts = value.split('T')[0].split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        return `${day}/${month}/${year}`;
      }
      const date = new Date(value);
      if (isNaN(date.getTime())) return '—';
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    if (value instanceof Date) {
      if (isNaN(value.getTime())) return '—';
      const day = value.getDate().toString().padStart(2, '0');
      const month = (value.getMonth() + 1).toString().padStart(2, '0');
      const year = value.getFullYear();
      return `${day}/${month}/${year}`;
    }

    return '—';
  }
}
