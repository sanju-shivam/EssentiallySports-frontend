import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'date',
  standalone: true   // ✅ makes it usable in standalone components
})
export class DatePipe implements PipeTransform {
  transform(value: string | Date | number, format: string = 'medium'): string {
    if (!value) return '';

    let date: Date;

    // Handle different input types
    if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    } else {
      date = value;
    }

    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    // Simple formatting logic (expandable)
    switch (format) {
      case 'short':
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      case 'date':
        return date.toLocaleDateString();
      case 'time':
        return date.toLocaleTimeString();
      case 'medium':
      default:
        return date.toLocaleString();
    }
  }
}
