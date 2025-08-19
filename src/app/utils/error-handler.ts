import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandler {
  
  constructor(private notificationService: NotificationService) {}

  handleHttpError(error: HttpErrorResponse, context: string = '') {
    let userMessage = 'An unexpected error occurred';
    
    if (error.error && error.error.message) {
      userMessage = error.error.message;
    } else if (error.status === 0) {
      userMessage = 'Unable to connect to server. Please check your connection.';
    } else if (error.status === 401) {
      userMessage = 'Authentication required. Please log in.';
    } else if (error.status === 403) {
      userMessage = 'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      userMessage = 'The requested resource was not found.';
    } else if (error.status === 422) {
      userMessage = 'Validation failed. Please check your input.';
    } else if (error.status >= 500) {
      userMessage = 'Server error. Please try again later.';
    }

    const fullMessage = context ? `${context}: ${userMessage}` : userMessage;
    this.notificationService.error('Error', fullMessage);
    
    console.error('HTTP Error:', error);
    return fullMessage;
  }

  handleComplianceError(errors: any[], context: string = 'Compliance Check') {
    if (errors.length === 0) return;
    
    const errorMessages = errors.map(err => `${err.rule}: ${err.message}`).join('\n');
    this.notificationService.error(context, errorMessages);
  }

  handleValidationError(field: string, message: string) {
    this.notificationService.warning('Validation Error', `${field}: ${message}`);
  }
}