import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ParcelApiRecord {
  id?: string;
  parcelId?: string;
  pickupAddress?: string;
  dropAddress?: string;
  category?: string;
  status?: string;
  description?: string;
  value?: number | string;
  deliveryFee?: number | string;
  receiverName?: string;
  receiverMobile?: string;
  owner?: { id?: string; name?: string } | string | null;
  ride?: { id?: string; owner?: { id?: string; name?: string } } | null;
  estimatedDeliveryMinutes?: number;
  createdAt?: string;
  specialInstructions?: string;
  fragile?: boolean;
  weightKg?: number | string;
}

@Injectable({ providedIn: 'root' })
export class ParcelApiService {
  private readonly apiUrl = `${environment.apiBaseUrl}/parcels`;

  constructor(private http: HttpClient) {}

  myParcels(): Observable<ParcelApiRecord[]> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      map(response => this.extractList(response))
    );
  }

  matchingParcels(): Observable<ParcelApiRecord[]> {
    return this.http.get<any>(`${this.apiUrl}/matches`).pipe(
      map(response => this.extractList(response))
    );
  }

  ownerParcels(): Observable<ParcelApiRecord[]> {
    return this.http.get<any>(`${this.apiUrl}/owner`).pipe(map(response => this.extractList(response)));
  }

  trackParcel(parcelId: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/${parcelId}/track`).pipe(
      map(response => this.extractList(response))
    );
  }

  createParcel(payload: Record<string, any>): Observable<any> {
    const params = new HttpParams({ fromObject: this.normalizePayload(payload) });
    return this.http.post<any>(this.apiUrl, null, { params });
  }

  acceptParcel(parcelId: string, rideId?: string): Observable<any> {
    const params = rideId ? new HttpParams().set('rideId', rideId) : undefined;
    return this.http.post<any>(`${this.apiUrl}/${parcelId}/accept`, null, params ? { params } : {});
  }

  rejectParcel(parcelId: string, reason = 'Owner declined the parcel request'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${parcelId}/reject`, null, { params: new HttpParams().set('reason', reason) });
  }

  generatePickupOtp(parcelId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${parcelId}/pickup-otp`, null);
  }

  verifyPickupOtp(parcelId: string, code: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${parcelId}/pickup-otp/verify`, null, {
      params: new HttpParams().set('code', code)
    });
  }

  generateDeliveryOtp(parcelId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${parcelId}/delivery-otp`, null);
  }

  verifyDeliveryOtp(parcelId: string, code: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${parcelId}/delivery-otp/verify`, null, {
      params: new HttpParams().set('code', code)
    });
  }

  private extractList(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.content)) return response.content;
    return [];
  }

  private normalizePayload(payload: Record<string, any>): Record<string, string> {
    const normalized: Record<string, string> = {};
    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      normalized[key] = String(value);
    });
    return normalized;
  }
}
