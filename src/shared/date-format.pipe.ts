import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  private datePipe: DatePipe;

  constructor() {
    this.datePipe = new DatePipe('en-US'); // Keep locale as 'en-US'
  }

  transform(value: string | Date, format: string = 'yyyy-MM-dd HH:mm:ss'): string | null {
    if (!value) {
      return null;
    }

    // If value is a string, handle the specific timestamp format
    const dateString = typeof value === 'string' ? value : value.toString();

    // Create a new Date object directly from the string (removing timezone part)
    const date = new Date(dateString.replace(/(\+\d{2}:\d{2})$/, '')); // Remove the timezone part

    // Return formatted date
    return this.datePipe.transform(date, format);
  }
}
