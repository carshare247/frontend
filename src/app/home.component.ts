import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MockDataService, Ride } from './mock-data.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { CarbonApiService } from './services/carbon-api.service';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Find your ride</h1>
        <p class="page-sub">Share journeys, save money, meet new people.</p>
      </div>
    </div>

    <!-- Multi-Stop Rides Section -->
    <section class="card mb-2" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
      <h3 style="color: white;">✨ Try Multi-Stop Rides</h3>
      <p style="color: rgba(255,255,255,0.9);">Search for rides with multiple stops and get better prices on shared journeys.</p>
      <button class="btn btn-primary" routerLink="/rides/search/multi-stop" style="background: white; color: #667eea; font-weight: 600; margin-top: 8px;">
        🚀 Search Multi-Stop Rides
      </button>
    </section>

    <section class="card mb-2">
      <h3>🔍 Search rides</h3>
      <div class="search-card">
          <div class="field">
            <label>From - State</label>
            <select [(ngModel)]="fromState" (change)="onFromStateChange()">
              <option value="">Select state</option>
              <option *ngFor="let s of states" [value]="s">{{ s }}</option>
            </select>
          </div>
          <div class="field">
            <label>From - District</label>
            <div style="position:relative">
              <input placeholder="Type district" [(ngModel)]="from" (input)="suggestFrom($any($event.target).value)" (focus)="suggestFrom(from || '')" />
              <ul *ngIf="fromSuggestions.length" class="suggestions">
                <li *ngFor="let s of fromSuggestions" (mousedown)="selectFrom(s)">{{ s }}</li>
              </ul>
            </div>
          </div>
          <div class="field">
            <label>To - State</label>
            <select [(ngModel)]="toState" (change)="onToStateChange()">
              <option value="">Select state</option>
              <option *ngFor="let s of states" [value]="s">{{ s }}</option>
            </select>
          </div>
          <div class="field">
            <label>To - District</label>
            <div style="position:relative">
              <input placeholder="Type district" [(ngModel)]="to" (input)="suggestTo($any($event.target).value)" (focus)="suggestTo(to || '')" />
              <ul *ngIf="toSuggestions.length" class="suggestions">
                <li *ngFor="let s of toSuggestions" (mousedown)="selectTo(s)">{{ s }}</li>
              </ul>
            </div>
          </div>
        <div class="field">
          <label>Date</label>
          <input type="date" [min]="today" [(ngModel)]="date" />
        </div>
        <div class="field">
          <label>Passengers</label>
          <input type="number" min="1" [(ngModel)]="passengers" />
        </div>
        <button class="btn btn-primary" (click)="search()">Search</button>
      </div>
    </section>

    <section class="impact-card mb-2">
      <div>
        <span class="impact-kicker">YOUR SHARED-MOBILITY IMPACT</span>
        <h3>Carbon impact</h3>
        <p>Live environmental savings calculated from your shared rides.</p>
      </div>
      <div class="impact-metrics">
        <div><strong>{{ carbonSummary.rides }}</strong><span>rides</span></div>
        <div><strong>{{ carbonSummary.distance }}</strong><span>km shared</span></div>
        <div><strong>{{ carbonSummary.co2 }}</strong><span>kg CO₂ reduced</span></div>
        <div><strong>{{ carbonSummary.fuel }}</strong><span>litres saved</span></div>
      </div>
      <p class="impact-empty" *ngIf="!carbonSummary.rides">Complete a shared ride to start building your impact history.</p>
    </section>

    <section class="results">
      <h3 *ngIf="searched">Available rides ({{ results.length }})</h3>
      <div *ngIf="searched && results.length === 0" class="card text-center muted">No rides found. Try changing your search.</div>
      <div *ngFor="let r of results" class="ride-card">
        <div class="ride-avatar">{{ (r.carModel || '?').charAt(0) }}</div>
        <div class="ride-content">
          <h4>{{ r.from }} <span class="muted">→</span> {{ r.to }}</h4>
          <div class="ride-meta">
            <span>📅 {{ r.date }}</span>
            <span>🕐 {{ r.startTime }} - {{ r.endTime }}</span>
            <span>💺 {{ r.seatsAvailable }} seats</span>
          </div>
          <div class="muted-small">🚗 {{ r.carModel }}</div>
        </div>
        <div class="ride-right">
          <div class="price-pill">₹{{ r.price }}</div>
          <span *ngIf="r.seatsAvailable < passengers" class="badge badge-danger">FULL</span>
          <a *ngIf="r.seatsAvailable >= passengers" [routerLink]="['/ride', r.id]" class="btn btn-primary btn-sm">View / Book</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    `.impact-card { display: grid; grid-template-columns: 1.25fr 2fr auto; gap: 20px; align-items: center; padding: 22px; border: 1px solid rgba(16,185,129,.18); border-radius: 18px; background: linear-gradient(120deg, #ecfdf5, #eff6ff); }
    .impact-kicker { color: #0f766e; font-size: .68rem; font-weight: 800; letter-spacing: .12em; }
    .impact-card h3 { margin: 6px 0 4px; color: #0f172a; }
    .impact-card p { margin: 0; color: #475569; }
    .impact-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .impact-metrics div { display: grid; gap: 4px; padding-left: 14px; border-left: 1px solid rgba(15,118,110,.16); }
    .impact-metrics strong { color: #0f172a; font-size: 1.3rem; }
    .impact-metrics span, .impact-empty { color: #475569; font-size: .76rem; }
    .impact-empty { max-width: 150px; }
    @media (max-width: 900px) { .impact-card { grid-template-columns: 1fr; } .impact-empty { max-width: none; } }
    @media (max-width: 560px) { .impact-metrics { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class HomeComponent {
  from = '';
  to = '';
  date = '';
  today = this.localDateKey();
  passengers = 1;
  results: Ride[] = [];
  searched = false;
  myBookings: Array<{ id: string; rideId: string; seats: number; status: string; ride?: Ride | undefined }> = [];
  carbonSummary = { rides: 0, distance: '0', co2: '0', fuel: '0' };
  

  constructor(private data: MockDataService, private router: Router, private auth: AuthService, private toast: ToastService, private carbonApi: CarbonApiService) {
    // ensure passenger-only access
    const s = this.auth.current;
    if (!s) {
      this.router.navigateByUrl('/');
    } else if (s.role !== 'passenger') {
      this.router.navigateByUrl('/owner/dashboard');
    }
    // do not show results until user searches; preload nothing
    this.searched = false;
    this.loadLocationData();
    this.loadCarbonImpact();
  }

  private loadCarbonImpact(): void {
    this.carbonApi.myFootprint().subscribe({
      next: rows => {
        this.carbonSummary = {
          rides: rows.length,
          distance: rows.reduce((sum, row) => sum + Number(row.distanceKm || 0), 0).toFixed(0),
          co2: rows.reduce((sum, row) => sum + Number(row.co2ReducedKg || 0), 0).toFixed(1),
          fuel: rows.reduce((sum, row) => sum + Number(row.fuelSavedLitres || 0), 0).toFixed(1)
        };
      },
      error: () => { this.carbonSummary = { rides: 0, distance: '0', co2: '0', fuel: '0' }; }
    });
  }

  states: string[] = [];
  fromState = '';
  toState = '';
  fromDistricts: string[] = [];
  toDistricts: string[] = [];

  fromSuggestions: string[] = [];
  toSuggestions: string[] = [];
  private _fromTimer: any;
  private _toTimer: any;

  loadLocationData() {
    this.data.getLocations().subscribe((items) => {
      const states = new Set<string>();
      const byState = new Map<string, string[]>();
      items.forEach((l) => {
        states.add(l.state);
        const arr = byState.get(l.state) || [];
        if (!arr.includes(l.district)) arr.push(l.district);
        byState.set(l.state, arr);
      });
      this.states = Array.from(states).sort();
      // store mapping in closures
      this._byState = byState;
    });
  }

  private _byState = new Map<string, string[]>();

  onFromStateChange() {
    this.fromDistricts = this._byState.get(this.fromState) || [];
  }

  onToStateChange() {
    this.toDistricts = this._byState.get(this.toState) || [];
  }

  suggestFrom(q: string) {
    clearTimeout(this._fromTimer);
    this._fromTimer = setTimeout(() => {
      const term = (q || '').trim();
      if (!term) { this.fromSuggestions = this._byState.get(this.fromState) || []; return; }
      this.data.getLocations(term, this.fromState || undefined).subscribe((items) => {
        this.fromSuggestions = Array.from(new Set(items.map(i => i.district))).slice(0, 10);
      });
    }, 220);
  }

  selectFrom(s: string) { this.from = s; this.fromSuggestions = []; }

  suggestTo(q: string) {
    clearTimeout(this._toTimer);
    this._toTimer = setTimeout(() => {
      const term = (q || '').trim();
      if (!term) { this.toSuggestions = this._byState.get(this.toState) || []; return; }
      this.data.getLocations(term, this.toState || undefined).subscribe((items) => {
        this.toSuggestions = Array.from(new Set(items.map(i => i.district))).slice(0, 10);
      });
    }, 220);
  }

  selectTo(s: string) { this.to = s; this.toSuggestions = []; }

  search() {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    // remember passenger count so booking page can reuse it and avoid asking twice
    localStorage.setItem('search_passengers', String(this.passengers || 1));
    this.data.getRides({ from: this.from, to: this.to, date: this.date, passengers: this.passengers || 1 }).subscribe((r) => {
      const currentOrFuture = r.filter(ride => ride.date >= todayKey);
      // Female-only rides are visible only when registration gender is female.
      const current = this.auth.current;
      if (current?.role === 'passenger' && current.gender?.toLowerCase() !== 'female') {
        this.results = currentOrFuture.filter((ride) => !ride.femaleOnly);
      } else {
        this.results = currentOrFuture;
      }
      this.searched = true;
    });
  }

  private localDateKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  loadMyBookings() {
    const s = this.auth.current;
    if (!s || s.role !== 'passenger') { this.myBookings = []; return; }
    const raw = localStorage.getItem('demo_bookings');
    const arr = raw ? JSON.parse(raw) : [];
    const mine = arr.filter((b: any) => b.userMobile === s.mobile);
    // resolve rides for each booking
    this.myBookings = [];
    mine.forEach((b: any) => {
      this.data.getRideById(b.rideId).subscribe((ride) => {
        this.myBookings.push({ id: b.id, rideId: b.rideId, seats: b.seats, status: b.status, ride });
      });
    });
  }

  cancelBooking(bookingId: string) {
    const reason = window.prompt('Enter a mandatory cancellation reason:')?.trim();
    if (!reason) {
      this.toast.show('Cancellation reason is required', 'warning');
      return;
    }
    const raw = localStorage.getItem('demo_bookings');
    const arr = raw ? JSON.parse(raw) : [];
    const filtered = arr.filter((b: any) => b.id !== bookingId);
    localStorage.setItem('demo_bookings', JSON.stringify(filtered));
    this.myBookings = this.myBookings.filter((m) => m.id !== bookingId);
    this.toast.show('Booking cancelled', 'success');
  }
}
