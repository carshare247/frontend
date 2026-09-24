import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ParcelApiService } from './services/parcel-api.service';
import { ToastService } from './toast.service';
import { LocationService } from './services/location.service';
import { GeoLocation } from './models/geo-location.model';

@Component({
  selector: 'app-parcel-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="request-shell">
      <header class="request-hero">
        <div>
          <span class="eyebrow">PARCEL REQUEST</span>
          <h1>Send a parcel with this ride</h1>
          <p>{{ pickupAddress }} <span>to</span> {{ dropAddress }}</p>
        </div>
        <span class="ride-chip">{{ ownerName || 'Parcel-enabled ride' }}</span>
      </header>

      <form class="request-card" (ngSubmit)="submit()">
        <div class="section-heading"><span>01</span><div><h2>Route confirmation</h2><p>Confirm the pickup and drop points for this ride.</p></div></div>
        <div class="field-grid">
          <label>Pickup location<input [(ngModel)]="pickupAddress" name="pickupAddress" readonly /></label>
          <label>Drop location<input [(ngModel)]="dropAddress" name="dropAddress" readonly /></label>
        </div>

        <div class="section-heading"><span>02</span><div><h2>Parcel details</h2><p>Give the carrier enough information to handle it safely.</p></div></div>
        <div class="field-grid">
          <label>Category<select [(ngModel)]="form.category" name="category"><option value="DOCUMENTS">Documents</option><option value="ELECTRONICS">Electronics</option><option value="CLOTHING">Clothing</option><option value="FRAGILE">Fragile</option><option value="MEDICAL">Medical</option><option value="OTHER">Other</option></select></label>
          <label>Weight in kg<input type="number" min="0" step="0.1" [(ngModel)]="form.weightKg" name="weightKg" required /></label>
          <label>Receiver name<input [(ngModel)]="form.receiverName" name="receiverName" required /></label>
          <label>Receiver mobile<input type="tel" [(ngModel)]="form.receiverMobile" name="receiverMobile" required /></label>
          <label>Declared value <small>optional</small><input type="number" min="0" [(ngModel)]="form.value" name="value" /></label>
          <label class="wide">Instructions<textarea [(ngModel)]="form.instructions" name="instructions" rows="3" placeholder="Handling or pickup notes"></textarea></label>
        </div>
        <label class="check-row"><input type="checkbox" [(ngModel)]="form.fragile" name="fragile" /> This parcel is fragile</label>
        <div class="actions"><a routerLink="/ride-search" class="btn btn-secondary">Back</a><button class="btn btn-primary" type="submit" [disabled]="submitting">{{ submitting ? 'Sending...' : 'Send request to owner' }}</button></div>
      </form>
    </main>
  `,
  styles: [`
    .request-shell { max-width: 860px; margin: 0 auto; display: grid; gap: 18px; padding: 16px; }
    .request-hero { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; padding: 24px; border-radius: 20px; background: linear-gradient(135deg, #ecfdf5, #eff6ff); border: 1px solid rgba(16,185,129,.18); }
    .eyebrow { color: #0f766e; font-size: .7rem; font-weight: 800; letter-spacing: .12em; }
    h1 { margin: 8px 0; color: #0f172a; font-size: clamp(1.7rem, 5vw, 2.4rem); } p { color: #64748b; margin: 0; } p span { color: #94a3b8; margin: 0 6px; }
    .ride-chip { padding: 8px 12px; border-radius: 999px; background: rgba(37,99,235,.1); color: #1d4ed8; font-size: .75rem; font-weight: 700; }
    .request-card { display: grid; gap: 22px; padding: 24px; background: white; border: 1px solid rgba(148,163,184,.16); border-radius: 20px; box-shadow: 0 12px 28px rgba(15,23,42,.06); }
    .section-heading { display: flex; gap: 12px; align-items: flex-start; }.section-heading > span { color: #2563eb; font-weight: 800; }.section-heading h2 { margin: 0 0 4px; color: #0f172a; font-size: 1.05rem; }.section-heading p { font-size: .82rem; }
    .field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }.field-grid label { display: grid; gap: 7px; color: #475569; font-size: .78rem; font-weight: 700; }.field-grid small { font-weight: 500; color: #94a3b8; }.field-grid input, .field-grid select, .field-grid textarea { width: 100%; box-sizing: border-box; border: 1px solid rgba(148,163,184,.24); border-radius: 12px; padding: 12px; background: #f8fafc; color: #0f172a; font: inherit; }.field-grid textarea { resize: vertical; }.wide { grid-column: 1 / -1; }.check-row { display: flex; gap: 8px; align-items: center; color: #475569; font-weight: 600; font-size: .85rem; }.actions { display: flex; justify-content: flex-end; gap: 10px; }
    @media (max-width: 600px) { .request-shell { padding: 10px; gap: 12px; }.request-hero { display: grid; gap: 12px; padding: 18px; border-radius: 16px; }.request-hero h1 { font-size: 1.55rem; }.request-card { padding: 18px; border-radius: 16px; gap: 18px; }.field-grid { grid-template-columns: 1fr; }.wide { grid-column: auto; }.actions { display: grid; grid-template-columns: 1fr 1.6fr; }.actions .btn { min-height: 44px; } }
  `]
})
export class ParcelRequestComponent implements OnInit {
  rideId = '';
  pickupAddress = '';
  dropAddress = '';
  ownerName = '';
  submitting = false;
  form = { category: 'OTHER', weightKg: null as number | null, receiverName: '', receiverMobile: '', value: null as number | null, instructions: '', fragile: false };

  constructor(private route: ActivatedRoute, private router: Router, private parcelApi: ParcelApiService, private toast: ToastService) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.rideId = params.get('rideId') || '';
    this.pickupAddress = params.get('pickupAddress') || '';
    this.dropAddress = params.get('dropAddress') || '';
    this.ownerName = params.get('ownerName') || '';
  }

  submit(): void {
    if (!this.rideId || !this.pickupAddress || !this.dropAddress) { this.toast.show('Ride route details are missing', 'error'); return; }
    this.submitting = true;
    this.parcelApi.createParcel({
      rideId: this.rideId, pickupAddress: this.pickupAddress, dropAddress: this.dropAddress,
      category: this.form.category, weightKg: this.form.weightKg, receiverName: this.form.receiverName,
      receiverMobile: this.form.receiverMobile, value: this.form.value, specialInstructions: this.form.instructions,
      fragile: this.form.fragile
    }).subscribe({
      next: () => { this.submitting = false; this.toast.show('Parcel request sent to the ride owner', 'success'); void this.router.navigate(['/parcel/dashboard']); },
      error: err => { this.submitting = false; this.toast.show(err.error?.message || 'Unable to send parcel request', 'error'); }
    });
  }
}
