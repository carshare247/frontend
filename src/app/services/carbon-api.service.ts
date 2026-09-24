import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CarbonApiRecord {
  id?: string;
  rideId?: string;
  distanceKm?: number;
  passengers?: number;
  fuelSavedLitres?: number;
  co2ReducedKg?: number;
  carbonSaved?: number;
  treesEquivalent?: number;
  environmentalScore?: number;
  calculationSource?: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class CarbonApiService {
  private readonly apiUrl = `${environment.apiBaseUrl}/carbon`;

  constructor(private http: HttpClient) {}

  myFootprint(): Observable<CarbonApiRecord[]> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      map(response => this.extractList(response))
    );
  }

  calculateForRide(rideId: string): Observable<CarbonApiRecord | null> {
    return this.http.post<any>(`${this.apiUrl}/rides/${rideId}/calculate`, {}).pipe(
      map(response => response?.data ?? response ?? null)
    );
  }

  private extractList(response: any): CarbonApiRecord[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  }
}
