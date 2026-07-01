import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserDto {
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);

  getUsers(): Promise<{ users: UserDto[] }> {
    return firstValueFrom(
      this.http.get<{ users: UserDto[] }>(`${environment.apiUrl}/users`)
    );
  }

  getUser(id: string): Promise<{ user: UserDto }> {
    return firstValueFrom(
      this.http.get<{ user: UserDto }>(`${environment.apiUrl}/users/${id}`)
    );
  }

  createUser(user: UserDto): Promise<{ message: string; user: UserDto }> {
    return firstValueFrom(
      this.http.post<{ message: string; user: UserDto }>(`${environment.apiUrl}/users`, user)
    );
  }

  updateUser(id: string, user: UserDto): Promise<{ message: string; user: UserDto }> {
    return firstValueFrom(
      this.http.put<{ message: string; user: UserDto }>(`${environment.apiUrl}/users/${id}`, user)
    );
  }

  deleteUser(id: string): Promise<{ message: string }> {
    return firstValueFrom(
      this.http.delete<{ message: string }>(`${environment.apiUrl}/users/${id}`)
    );
  }
}
