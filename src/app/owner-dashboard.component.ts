import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MockDataService, Owner, Ride } from './mock-data.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { CarbonApiService } from './services/carbon-api.service';

interface Booking {
  id: string;
  rideId: string;
  userMobile: string;
  seats: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  cancellationReason?: string;
  cancellationNote?: string;
  cancelledBy?: string;
  cancelledAt?: string;
}

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Owner Dashboard</h1>
        <p class="page-sub">Manage your rides and respond to booking requests.</p>
      </div>
    </div>

    <section class="card mb-2">
      <h3>Welcome to your dashboard</h3>
      <p class="muted">Use the menu to access My Rides and Booking Requests.</p>
      
      <!-- Quick Actions -->
      <div class="quick-actions" style="margin-top: 16px; display: flex; gap: 12px; flex-wrap: wrap;">
        <button class="btn btn-secondary" routerLink="/owner/create-ride" style="background: #3498db; color: white;">
          ✨ Create Ride
        </button>
      </div>
    </section>

    <section class="impact-strip">
      <div>
        <span class="impact-kicker">LIVE IMPACT</span>
        <h3>Shared-ride carbon savings</h3>
        <p class="muted">Calculated from your completed ride contributions.</p>
      </div>
      <div class="impact-metrics">
        <div><strong>{{ carbonSummary.rides }}</strong><span>rides</span></div>
        <div><strong>{{ carbonSummary.distance }}</strong><span>km shared</span></div>
        <div><strong>{{ carbonSummary.co2 }}</strong><span>kg CO₂ reduced</span></div>
        <div><strong>{{ carbonSummary.fuel }}</strong><span>litres saved</span></div>
      </div>
      <div class="impact-empty" *ngIf="!carbonSummary.rides">Impact data will appear after a ride is calculated.</div>
    </section>

    <!-- Include create ride form here for quick access -->
     <!-- <app-owner-create-ride></app-owner-create-ride> -->
  `,
  styles: [`
    .impact-strip { display: grid; grid-template-columns: 1.2fr 2fr auto; gap: 20px; align-items: center; margin-top: 18px; padding: 22px; border: 1px solid rgba(16,185,129,.18); border-radius: 18px; background: linear-gradient(120deg, #ecfdf5, #eff6ff); }
    .impact-kicker { color: #0f766e; font-size: .7rem; font-weight: 800; letter-spacing: .12em; }
    .impact-strip h3 { margin: 5px 0; color: #0f172a; }
    .impact-strip p { margin: 0; }
    .impact-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .impact-metrics div { display: grid; gap: 4px; padding-left: 14px; border-left: 1px solid rgba(15,118,110,.16); }
    .impact-metrics strong { color: #0f172a; font-size: 1.35rem; }
    .impact-metrics span, .impact-empty { color: #475569; font-size: .78rem; }
    .impact-empty { max-width: 150px; }
    @media (max-width: 900px) { .impact-strip { grid-template-columns: 1fr; } .impact-empty { max-width: none; } }
    @media (max-width: 560px) { .impact-metrics { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class OwnerDashboardComponent {
  owners: Owner[] = [];
  allRides: Ride[] = [];
  selectedOwnerId = '';
  from = '';
  to = '';
  date = '';
  startTime = '';
  endTime = '';
  seats = 1;
  price = 0;
  carModel = '';
  bookings: Booking[] = [];
  carbonSummary = { rides: 0, distance: '0', co2: '0', fuel: '0' };

  constructor(private data: MockDataService, private auth: AuthService, private toast: ToastService, private carbonApi: CarbonApiService) {
    this.load();
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

  focusCreate() {
    // scroll to top where the create card is located
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  load() {
    this.data.getOwners().subscribe((o) => {
      const s = this.auth.current;
      if (s && s.role === 'owner' && (s as any).ownerId) {
        const match = o.find((x) => x.id === (s as any).ownerId);
        this.owners = match ? [match] : [];
        this.selectedOwnerId = (s as any).ownerId;
      } else {
        this.owners = o;
      }
    });
    this.loadLocal();
  }

  loadLocal() {
    this.data.loadAll().subscribe((d) => {
      const localRaw = localStorage.getItem('demo_rides');
      const local = localRaw ? JSON.parse(localRaw) : [];
      this.allRides = [...(d.rides || []), ...local];
      // if current user is owner, show only their rides
      const s = this.auth.current;
      if (s && s.role === 'owner' && (s as any).ownerId) {
        this.allRides = this.allRides.filter((r) => r.ownerId === (s as any).ownerId);
      }
      if (!this.selectedOwnerId && this.owners.length) this.selectedOwnerId = this.owners[0].id;
      const bookingsRaw = localStorage.getItem('demo_bookings');
      const allBookings: Booking[] = bookingsRaw ? JSON.parse(bookingsRaw) : [];
      // show only bookings related to this owner's rides
      const rideIds = new Set(this.allRides.map((r) => r.id));
      this.bookings = allBookings.filter((b) => rideIds.has(b.rideId));
    });
  }

  createRide() {
    if (!this.selectedOwnerId) { this.toast.show('Select owner', 'warning'); return; }
    const ride: Ride = {
      id: 'ride-' + Date.now(),
      ownerId: this.selectedOwnerId,
      from: this.from,
      to: this.to,
      date: this.date,
      startTime: this.startTime,
      endTime: this.endTime,
      price: this.price,
      carModel: this.carModel,
      seatsAvailable: this.seats
    };
    const raw = localStorage.getItem('demo_rides');
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(ride);
    localStorage.setItem('demo_rides', JSON.stringify(arr));
    this.from = this.to = this.date = this.startTime = this.endTime = this.carModel = '';
    this.seats = 1; this.price = 0;
    this.loadLocal();
    this.toast.show('Ride created', 'success');
  }

  getOwnerName(id: string) { return this.owners.find((o) => o.id === id)?.name || id; }
  getRideFrom(id: string) { return this.allRides.find((x) => x.id === id)?.from || ''; }
  getRideTo(id: string) { return this.allRides.find((x) => x.id === id)?.to || ''; }

  respond(bookingId: string, action: 'accepted' | 'rejected') {
    const raw = localStorage.getItem('demo_bookings');
    const arr: Booking[] = raw ? JSON.parse(raw) : [];
    const b = arr.find((x) => x.id === bookingId);
    if (!b) return;
    b.status = action;
    localStorage.setItem('demo_bookings', JSON.stringify(arr));
    this.loadLocal();
    this.toast.show('Booking ' + action, 'success');
  }

}
