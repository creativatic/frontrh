import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MealService {
  private readonly http = inject(HttpClient);

  /**
   * Registers a meal for an employee.
   *
   * @param qrCodeToken Unique QR code token of the employee.
   * @param mealType The type of meal (desayuno, almuerzo, cena).
   * @param photo The captured image blob.
   * @param latitude HTML5 geolocation latitude.
   * @param longitude HTML5 geolocation longitude.
   */
  registerMeal(
    qrCodeToken: string,
    mealType: 'desayuno' | 'almuerzo' | 'cena',
    photo?: Blob | null,
    latitude?: number,
    longitude?: number
  ): Promise<{ message: string; employeeName: string; mealType: string; action: string; mealRecord: any }> {
    const formData = new FormData();
    formData.append('qr_code_token', qrCodeToken);
    formData.append('meal_type', mealType);
    
    if (photo) {
      formData.append('photo', photo, 'meal.png');
    }
    
    if (latitude !== undefined && latitude !== null) {
      formData.append('latitude', latitude.toString());
    }
    if (longitude !== undefined && longitude !== null) {
      formData.append('longitude', longitude.toString());
    }

    return firstValueFrom(
      this.http.post<{ message: string; employeeName: string; mealType: string; action: string; mealRecord: any }>(
        `${environment.apiUrl}/meals`,
        formData
      )
    );
  }
}
