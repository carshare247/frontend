import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ParcelApiService } from './services/parcel-api.service';
import { ToastService } from './toast.service';
import { AuthService } from './auth.service';
import { LocationService } from './services/location.service';
import { GeoLocation } from './models/geo-location.model';

interface ParcelRequestItem {
  id: string;
  status: string;
  pickup: string;
  drop: string;
  category: string;
  value: string;
  eta: string;
  fee: string;
  owner: string;
  receiverName?: string;
  receiverMobile?: string;
  description?: string;
  specialInstructions?: string;
  weightKg?: number | string;
  fragile?: boolean;
}

@Component({
  selector: 'app-parcel-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="parcel-shell" [class.owner-mode]="isOwner">
      <header class="page-header parcel-hero">
        <div>
          <p class="eyebrow">{{ isOwner ? 'CARRIER WORKSPACE' : 'SERVICE EXTENSION' }}</p>
          <h1 class="page-title">{{ isOwner ? 'Carry parcels on your route' : 'Parcel delivery' }}</h1>
          <p class="page-sub">{{ isOwner ? 'Review parcel requests that match your active journeys.' : 'Route-based parcel shipping built around active carpool journeys.' }}</p>
        </div>
        <button *ngIf="!isOwner" class="btn btn-primary" type="button" (click)="focusRequest()">+ Request parcel</button>
        <a *ngIf="isOwner" class="btn btn-primary" routerLink="/owner/my-rides">View my routes</a>
      </header>

      <section class="stat-grid">
        <article class="stat-card accent-green">
          <span class="stat-label">{{ isOwner ? 'Incoming requests' : 'Active parcels' }}</span>
          <strong>{{ activeParcelCount }}</strong>
          <small>{{ isOwner ? 'Waiting for your review' : 'From your parcel requests' }}</small>
        </article>
        <article class="stat-card accent-indigo">
          <span class="stat-label">{{ isOwner ? 'Accepted parcels' : 'Completed today' }}</span>
          <strong>{{ deliveredParcelCount }}</strong>
          <small>{{ isOwner ? 'Ready for pickup coordination' : 'Successfully delivered' }}</small>
        </article>
        <article class="stat-card accent-amber">
          <span class="stat-label">Avg. ETA</span>
          <strong>{{ averageEta }}</strong>
          <small>{{ isOwner ? 'Based on accepted routes' : 'From assigned deliveries' }}</small>
        </article>
        <article class="stat-card accent-rose">
          <span class="stat-label">Delivery fees</span>
          <strong>{{ deliveryFees }}</strong>
          <small>{{ isOwner ? 'Potential delivery earnings' : 'Recorded on your parcels' }}</small>
        </article>
      </section>

      <section class="panel-grid">
        <div *ngIf="!isOwner" class="panel panel-large" id="parcel-request-form">
          <div class="panel-header">
            <div>
              <p class="eyebrow dark">Create request</p>
              <h3>Send parcel</h3>
            </div>
          </div>

          <form class="parcel-form" (ngSubmit)="submitRequest()">
            <div class="field-row two-up">
              <div class="field">
                <label>Pickup address</label>
                <div class="location-autocomplete">
                  <input [(ngModel)]="form.pickupAddress" name="pickupAddress" placeholder="Search pickup location" autocomplete="off" (input)="searchLocation('pickup', form.pickupAddress)" (focus)="searchLocation('pickup', form.pickupAddress)" />
                  <div class="location-suggestions" *ngIf="activeLocationField === 'pickup' && pickupSuggestions.length">
                    <button type="button" *ngFor="let location of pickupSuggestions" (mousedown)="selectLocation('pickup', location)">{{ location.displayName }}</button>
                  </div>
                </div>
              </div>
              <div class="field">
                <label>Drop address</label>
                <div class="location-autocomplete">
                  <input [(ngModel)]="form.dropAddress" name="dropAddress" placeholder="Search drop location" autocomplete="off" (input)="searchLocation('drop', form.dropAddress)" (focus)="searchLocation('drop', form.dropAddress)" />
                  <div class="location-suggestions" *ngIf="activeLocationField === 'drop' && dropSuggestions.length">
                    <button type="button" *ngFor="let location of dropSuggestions" (mousedown)="selectLocation('drop', location)">{{ location.displayName }}</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="field-row two-up">
              <div class="field">
                <label>Category</label>
                <select [(ngModel)]="form.category" name="category">
                  <option value="ELECTRONICS">Electronics</option>
                  <option value="DOCUMENTS">Documents</option>
                  <option value="CLOTHING">Clothing</option>
                  <option value="FRAGILE">Fragile</option>
                  <option value="MEDICAL">Medical</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div class="field">
                <label>Weight</label>
                <input type="number" min="0" step="0.1" [(ngModel)]="form.weight" name="weight" placeholder="2.4" />
              </div>
            </div>

            <div class="field-row two-up">
              <div class="field">
                <label>Receiver name</label>
                <input [(ngModel)]="form.receiverName" name="receiverName" placeholder="Rajesh Kumar" />
              </div>
              <div class="field">
                <label>Receiver mobile</label>
                <input [(ngModel)]="form.receiverMobile" name="receiverMobile" placeholder="+91 98765 43210" />
              </div>
            </div>

            <div class="field-row two-up">
              <div class="field">
                <label>Declared value <span class="field-hint">optional · for protection</span></label>
                <input type="number" min="0" step="0.01" [(ngModel)]="form.value" name="value" placeholder="Approximate value" />
              </div>
            </div>

            <div class="field-row two-up">
              <div class="field full-width">
                <label>Special instructions</label>
                <textarea [(ngModel)]="form.instructions" name="instructions" rows="3" placeholder="Handle carefully, no stacking, pickup before 8:00 PM"></textarea>
              </div>
            </div>

            <div class="inline-actions">
              <label class="check-row"><input type="checkbox" [(ngModel)]="form.fragile" name="fragile" /> Fragile parcel</label>
              <button class="btn btn-primary" type="submit">Create request</button>
            </div>
          </form>
        </div>

        <div class="panel" [class.owner-match-panel]="isOwner">
          <div class="panel-header">
            <div>
              <p class="eyebrow dark">{{ isOwner ? 'INCOMING REQUESTS' : 'MATCH ENGINE' }}</p>
              <h3>{{ isOwner ? 'Parcel requests near your routes' : 'Route matches' }}</h3>
            </div>
            <span class="pill success">{{ isOwner ? (matches.length + ' requests') : 'Smart match' }}</span>
          </div>

          <div class="empty-state" *ngIf="loading">Loading parcel requests...</div>
          <div class="empty-state error-state" *ngIf="!loading && loadError">{{ loadError }}</div>
          <div class="match-list" *ngIf="!loading && !loadError && matches.length; else noMatches">
            <div class="match-item" *ngFor="let item of matches">
              <div class="route-line">
                <span class="dot start"></span>
                <span class="route-track"></span>
                <span class="dot end"></span>
              </div>
              <div class="match-copy">
                <strong>{{ item.pickup }}</strong>
                <small>to {{ item.drop }}</small>
                <div class="meta-row">
                  <span>{{ item.category }}</span>
                  <span>{{ item.eta }}</span>
                  <span *ngIf="isOwner && item.owner">{{ item.owner }}</span>
                </div>
              </div>
              <div class="match-side">
                <span class="pill neutral">{{ isOwner ? 'Review' : item.status }}</span>
                <strong>{{ item.fee }}</strong>
                <ng-container *ngIf="isOwner">
                  <button class="btn btn-ghost btn-sm" type="button" (click)="viewParcel(item)">View details</button>
                  <button *ngIf="item.status.toUpperCase() === 'REQUESTED'" class="btn btn-primary btn-sm" type="button" (click)="acceptParcel(item.id)">Accept</button>
                  <button *ngIf="item.status.toUpperCase() === 'REQUESTED'" class="btn btn-secondary btn-sm" type="button" (click)="rejectParcel(item.id)">Decline</button>
                  <button *ngIf="['ACCEPTED', 'PICKUP_OTP_GENERATED'].includes(item.status.toUpperCase())" class="btn btn-primary btn-sm" type="button" (click)="generatePickupOtp(item.id)">{{ item.status.toUpperCase() === 'PICKUP_OTP_GENERATED' ? 'Regenerate pickup OTP' : 'Generate pickup OTP' }}</button>
                  <button *ngIf="['PICKED_UP', 'IN_TRANSIT'].includes(item.status.toUpperCase())" class="btn btn-primary btn-sm" type="button" (click)="generateDeliveryOtp(item.id)">Generate delivery OTP</button>
                </ng-container>
              </div>
            </div>
          </div>
          <ng-template #noMatches>
            <div *ngIf="!loading && !loadError" class="empty-state">
              <strong>{{ isOwner ? 'Your incoming requests will appear here' : 'No route matches yet' }}</strong>
              <span>{{ isOwner ? 'When a passenger sends a parcel for one of your rides, review it here and accept or decline it.' : 'Create a request and we will show eligible journeys here.' }}</span>
            </div>
          </ng-template>
        </div>
      </section>

      <section class="panel details-panel" *ngIf="isOwner && selectedParcel">
        <div class="panel-header">
          <div>
            <p class="eyebrow dark">REQUEST DETAILS</p>
            <h3>{{ selectedParcel.pickup }} to {{ selectedParcel.drop }}</h3>
          </div>
          <button class="btn btn-ghost btn-sm" type="button" (click)="selectedParcel = null">Close</button>
        </div>
        <div class="details-grid">
          <div><span>Status</span><strong>{{ selectedParcel.status }}</strong></div>
          <div><span>Category</span><strong>{{ selectedParcel.category }}</strong></div>
          <div><span>Receiver</span><strong>{{ selectedParcel.receiverName || 'Not provided' }}</strong></div>
          <div><span>Receiver mobile</span><strong>{{ selectedParcel.receiverMobile || 'Not provided' }}</strong></div>
          <div><span>Weight</span><strong>{{ selectedParcel.weightKg || 'Not provided' }}{{ selectedParcel.weightKg ? ' kg' : '' }}</strong></div>
          <div><span>Fragile</span><strong>{{ selectedParcel.fragile ? 'Yes' : 'No' }}</strong></div>
          <div class="detail-wide"><span>Instructions</span><strong>{{ selectedParcel.specialInstructions || selectedParcel.description || 'No special instructions' }}</strong></div>
        </div>
        <div class="details-actions" *ngIf="['ACCEPTED', 'PICKUP_OTP_GENERATED'].includes(selectedParcel.status.toUpperCase())">
          <span>Pickup OTP expired or needs to be shared again?</span>
          <button class="btn btn-primary btn-sm" type="button" (click)="generatePickupOtp(selectedParcel.id)">Regenerate pickup OTP</button>
        </div>
      </section>

      <section *ngIf="!isOwner" class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow dark">Carrier activity</p>
            <h3>Parcel requests</h3>
          </div>
          <span class="muted-label">Live from your account</span>
        </div>

        <div class="request-table">
          <div class="table-head">
            <span>Route</span>
            <span>Carrier</span>
            <span>ETA</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          <div class="table-row" *ngFor="let row of requests">
            <span>{{ row.pickup }} → {{ row.drop }}</span>
            <span>{{ row.owner }}</span>
            <span>{{ row.eta }}</span>
            <span><em class="status-badge" [ngClass]="row.status.toLowerCase()">{{ row.status }}</em></span>
            <span>
              <a [routerLink]="['/parcel/tracking', row.id]" class="mini-link">Track</a>
            </span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .parcel-shell { display: grid; gap: 20px; }
      .parcel-hero { background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.08)); border: 1px solid rgba(16,185,129,0.1); padding: 24px; border-radius: 20px; }
      .eyebrow { text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.7rem; font-weight: 700; color: #0f766e; margin: 0 0 6px; }
      .eyebrow.dark { color: #475569; }
      .stat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
      .stat-card { background: white; border: 1px solid rgba(148,163,184,0.15); border-radius: 18px; padding: 18px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04); display: grid; gap: 8px; }
      .stat-card strong { font-size: 1.8rem; line-height: 1; color: #0f172a; }
      .stat-card small { color: #475569; }
      .stat-label { color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; }
      .accent-green { background: linear-gradient(135deg, #f0fdf4, #ffffff); }
      .accent-indigo { background: linear-gradient(135deg, #eef2ff, #ffffff); }
      .accent-amber { background: linear-gradient(135deg, #fff7ed, #ffffff); }
      .accent-rose { background: linear-gradient(135deg, #fff1f2, #ffffff); }
      .panel-grid { display: grid; grid-template-columns: 1.3fr 0.9fr; gap: 18px; }
      .panel { background: white; border: 1px solid rgba(148,163,184,0.12); border-radius: 20px; padding: 20px; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04); }
      .panel-large { min-height: 100%; }
      .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
      .parcel-form { display: grid; gap: 16px; }
      .field-row { display: grid; gap: 12px; }
      .two-up { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .field { display: grid; gap: 8px; }
      .field.full-width { grid-column: 1 / -1; }
      .field label { font-size: 0.8rem; color: #475569; font-weight: 600; }
      .field-hint { color: #94a3b8; font-size: .68rem; font-weight: 500; }
      .field input, .field select, .field textarea { background: #f8fafc; border: 1px solid rgba(148,163,184,0.22); border-radius: 12px; padding: 12px 14px; color: #0f172a; min-height: 44px; }
      .location-autocomplete { position: relative; }
      .location-suggestions { position: absolute; z-index: 20; top: calc(100% + 5px); left: 0; right: 0; display: grid; gap: 2px; padding: 5px; background: #fff; border: 1px solid rgba(99,102,241,.18); border-radius: 12px; box-shadow: 0 12px 28px rgba(15,23,42,.16); }
      .location-suggestions button { padding: 10px 11px; border: 0; border-radius: 8px; background: transparent; color: #1e293b; text-align: left; font: inherit; font-size: .78rem; cursor: pointer; }
      .location-suggestions button:hover { background: #eef2ff; color: #3730a3; }
      .field textarea { resize: vertical; }
      .inline-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .check-row { display: inline-flex; align-items: center; gap: 8px; color: #475569; font-weight: 600; }
      .match-list { display: grid; gap: 14px; }
      .match-item { display: grid; grid-template-columns: 34px 1fr auto; gap: 12px; align-items: center; background: #f8fafc; border: 1px solid rgba(148,163,184,0.12); border-radius: 14px; padding: 12px; }
      .route-line { display: flex; align-items: center; justify-content: center; flex-direction: column; height: 52px; }
      .dot { width: 10px; height: 10px; border-radius: 50%; display: block; }
      .dot.start { background: #16a34a; }
      .dot.end { background: #2563eb; }
      .route-track { width: 2px; height: 36px; background: linear-gradient(180deg, #16a34a, #2563eb); display: block; }
      .match-copy { display: grid; gap: 4px; min-width: 0; }
      .match-copy strong { font-size: 0.95rem; overflow-wrap: anywhere; }
      .match-copy small { color: #64748b; overflow-wrap: anywhere; }
      .meta-row { display: flex; gap: 8px; flex-wrap: wrap; color: #475569; font-size: 0.72rem; }
      .match-side { display: grid; align-items: center; justify-items: end; gap: 8px; }
      .match-side > * { max-width: 100%; }
      .pill { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 5px 10px; font-size: 0.68rem; font-weight: 700; }
      .pill.success { background: rgba(34,197,94,0.12); color: #166534; }
      .pill.neutral { background: rgba(99,102,241,0.12); color: #3730a3; }
      .request-table { display: grid; gap: 12px; }
      .table-head, .table-row { display: grid; grid-template-columns: 2fr 1fr 0.8fr 0.9fr 0.7fr; gap: 12px; align-items: center; }
      .table-head { color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.68rem; font-weight: 700; padding: 0 8px; }
      .table-row { padding: 14px 8px; border-top: 1px solid rgba(148,163,184,0.14); }
      .table-row > span { overflow-wrap: anywhere; }
      .status-badge { display: inline-flex; align-items: center; justify-content: center; padding: 6px 10px; border-radius: 999px; font-size: 0.7rem; font-style: normal; font-weight: 700; }
      .status-badge.accepted { background: rgba(34,197,94,0.12); color: #166534; }
      .status-badge.pending { background: rgba(251,191,36,0.12); color: #92400e; }
      .status-badge.in-transit { background: rgba(59,130,246,0.12); color: #1d4ed8; }
      .status-badge.delivered { background: rgba(99,102,241,0.12); color: #3730a3; }
      .mini-link { color: #2563eb; text-decoration: none; font-weight: 600; }
      .owner-mode .owner-match-panel { grid-column: 1 / -1; }
      .owner-mode .owner-match-panel .match-item { min-height: 92px; }
      .details-panel { border-color: rgba(99,102,241,.2); }
      .details-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
      .details-grid div { display: grid; gap: 4px; padding: 12px; background: #f8fafc; border-radius: 12px; }
      .details-grid span, .details-actions span { color: #64748b; font-size: .72rem; }
      .details-grid strong { color: #0f172a; overflow-wrap: anywhere; }
      .detail-wide { grid-column: 1 / -1; }
      .details-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(148,163,184,.16); }
      @media (max-width: 900px) { .stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .panel-grid { grid-template-columns: 1fr; } }
      @media (max-width: 640px) {
        .parcel-shell { gap: 14px; }
        .parcel-hero { display: grid; gap: 14px; padding: 18px; border-radius: 16px; }
        .parcel-hero .page-title { font-size: 25px; line-height: 1.1; }
        .parcel-hero .page-sub { font-size: 13px; line-height: 1.45; }
        .parcel-hero .btn { width: 100%; min-height: 44px; }
        .owner-mode .parcel-hero { gap: 8px; padding: 14px 16px; border-radius: 14px; }
        .owner-mode .parcel-hero .eyebrow { font-size: .62rem; margin-bottom: 2px; }
        .owner-mode .parcel-hero .page-title { font-size: 21px; line-height: 1.12; }
        .owner-mode .parcel-hero .page-sub { font-size: 12px; line-height: 1.3; }
        .owner-mode .parcel-hero .btn { min-height: 38px; padding: 9px 14px; }
        .stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .stat-card { min-width: 0; padding: 14px; border-radius: 14px; gap: 6px; }
        .stat-card strong { font-size: 1.35rem; overflow-wrap: anywhere; }
        .stat-card small { font-size: .7rem; line-height: 1.25; }
        .panel { padding: 16px; border-radius: 16px; }
        .panel-header { align-items: flex-start; gap: 10px; }
        .panel-header h3 { font-size: 1rem; line-height: 1.25; }
        .match-list { gap: 10px; }
        .match-item { grid-template-columns: 26px minmax(0, 1fr); gap: 10px; padding: 12px 10px; }
        .match-side { grid-column: 2; display: grid; justify-items: stretch; width: 100%; }
        .match-side .btn { width: 100%; min-height: 38px; }
        .meta-row { gap: 6px; }
        .details-grid { grid-template-columns: 1fr; }
        .details-actions { align-items: flex-start; flex-direction: column; }
        .two-up { grid-template-columns: 1fr; }
        .table-head { display: none; }
        .table-row { grid-template-columns: 1fr; padding: 12px 0; }
        .inline-actions { flex-direction: column; align-items: flex-start; }
        .inline-actions .btn { width: 100%; }
      }
    `
  ]
})
export class ParcelDashboardComponent implements OnInit {
  form = {
    pickupAddress: '',
    dropAddress: '',
    category: 'OTHER',
    weight: '',
    receiverName: '',
    receiverMobile: '',
    value: '',
    instructions: '',
    fragile: false
  };

  matches: ParcelRequestItem[] = [];

  requests: ParcelRequestItem[] = [];
  selectedParcel: ParcelRequestItem | null = null;
  loading = true;
  loadError = '';

  private get visibleParcels(): ParcelRequestItem[] { return this.isOwner ? this.matches : this.requests; }
  get activeParcelCount(): number {
    return this.isOwner
      ? this.visibleParcels.filter(row => row.status.toUpperCase() === 'REQUESTED').length
      : this.visibleParcels.filter(row => !['DELIVERED', 'REJECTED'].includes(row.status.toUpperCase())).length;
  }
  get deliveredParcelCount(): number {
    return this.isOwner
      ? this.visibleParcels.filter(row => ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERY_OTP_GENERATED'].includes(row.status.toUpperCase())).length
      : this.visibleParcels.filter(row => row.status.toUpperCase() === 'DELIVERED').length;
  }
  get averageEta(): string { return this.visibleParcels.length ? `${Math.round(this.visibleParcels.reduce((sum, row) => sum + (parseInt(row.eta, 10) || 0), 0) / this.visibleParcels.length)} min` : 'No data'; }
  get deliveryFees(): string { return this.visibleParcels.length ? `₹${this.visibleParcels.reduce((sum, row) => sum + (parseFloat(row.fee.replace(/[^0-9.]/g, '')) || 0), 0).toFixed(0)}` : '₹0'; }

  focusRequest(): void { document.getElementById('parcel-request-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  submitRequest(): void {
    this.parcelApi.createParcel({
      pickupAddress: this.form.pickupAddress,
      dropAddress: this.form.dropAddress,
      category: this.form.category,
      description: this.form.instructions,
      weightKg: this.form.weight ? Number(this.form.weight) : undefined,
      receiverName: this.form.receiverName,
      receiverMobile: this.form.receiverMobile,
      value: this.form.value ? Number(this.form.value) : undefined,
      specialInstructions: this.form.instructions,
      fragile: this.form.fragile,
    }).subscribe({
      next: () => {
        this.toast.show('Parcel request created successfully', 'success');
        this.form = { pickupAddress: '', dropAddress: '', category: 'OTHER', weight: '', receiverName: '', receiverMobile: '', value: '', instructions: '', fragile: false };
        this.loadParcels();
      },
      error: () => this.toast.show('Unable to create parcel request right now', 'error')
    });
  }

  pickupSuggestions: GeoLocation[] = [];
  dropSuggestions: GeoLocation[] = [];
  activeLocationField: 'pickup' | 'drop' | null = null;
  private locationSearchTimers: Partial<Record<'pickup' | 'drop', ReturnType<typeof setTimeout>>> = {};

  searchLocation(field: 'pickup' | 'drop', value: string): void {
    this.activeLocationField = field;
    const query = String(value || '').trim();
    if (this.locationSearchTimers[field]) clearTimeout(this.locationSearchTimers[field]);
    if (query.length < 2) {
      if (field === 'pickup') this.pickupSuggestions = [];
      else this.dropSuggestions = [];
      return;
    }
    this.locationSearchTimers[field] = setTimeout(() => {
      this.locationService.search(query).subscribe({
        next: locations => { if (field === 'pickup') this.pickupSuggestions = locations; else this.dropSuggestions = locations; },
        error: () => { if (field === 'pickup') this.pickupSuggestions = []; else this.dropSuggestions = []; }
      });
    }, 250);
  }

  selectLocation(field: 'pickup' | 'drop', location: GeoLocation): void {
    const value = location.displayName || location.city || location.district || '';
    if (field === 'pickup') { this.form.pickupAddress = value; this.pickupSuggestions = []; }
    else { this.form.dropAddress = value; this.dropSuggestions = []; }
    this.activeLocationField = null;
  }

  viewParcel(parcel: ParcelRequestItem): void {
    this.selectedParcel = parcel;
    setTimeout(() => document.querySelector('.details-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  }

  acceptParcel(parcelId: string): void {
    this.parcelApi.acceptParcel(parcelId).subscribe({
      next: () => { this.toast.show('Parcel accepted. Generate pickup OTP when the sender arrives.', 'success'); this.loadParcels(); },
      error: err => this.toast.show(err.error?.message || 'Unable to accept parcel', 'error')
    });
  }

  generatePickupOtp(parcelId: string): void {
    this.parcelApi.generatePickupOtp(parcelId).subscribe({
      next: response => {
        const code = response?.data || response;
        this.toast.show(`New pickup OTP: ${code}`, 'success');
        this.loadParcels();
      },
      error: err => this.toast.show(err.error?.message || 'Unable to generate pickup OTP', 'error')
    });
  }

  generateDeliveryOtp(parcelId: string): void {
    this.parcelApi.generateDeliveryOtp(parcelId).subscribe({
      next: response => this.toast.show(`Delivery OTP: ${response?.data || response}`, 'success'),
      error: err => this.toast.show(err.error?.message || 'Unable to generate delivery OTP', 'error')
    });
  }

  rejectParcel(parcelId: string): void {
    this.parcelApi.rejectParcel(parcelId).subscribe({
      next: () => { this.toast.show('Parcel request declined', 'info'); this.loadParcels(); },
      error: err => this.toast.show(err.error?.message || 'Unable to decline parcel', 'error')
    });
  }

  constructor(private parcelApi: ParcelApiService, private toast: ToastService, private auth: AuthService, private locationService: LocationService) {}

  get isOwner(): boolean { return this.auth.current?.role === 'owner'; }

  ngOnInit(): void { this.loadParcels(); }

  private loadParcels(): void {
    this.loading = true;
    this.loadError = '';
    const applyRows = (rows: any[]): void => {
        const mapped = (rows || []).map((r: any) => r.pickup && r.drop ? r : ({
          id: r.id || r.parcelId || 'parcel',
          status: r.status || 'Pending',
          pickup: r.pickupAddress || 'Pickup',
          drop: r.dropAddress || 'Drop',
          category: r.category || 'General',
          value: r.value ? `₹${r.value}` : '₹0',
          eta: r.estimatedDeliveryMinutes ? `${Math.max(1, Math.round(r.estimatedDeliveryMinutes / 60))}h` : 'Awaiting match',
          fee: r.deliveryFee ? `₹${r.deliveryFee}` : '₹0',
          owner: r.owner?.name || r.owner || 'Carrier pending',
          receiverName: r.receiverName,
          receiverMobile: r.receiverMobile,
          description: r.description,
          specialInstructions: r.specialInstructions,
          weightKg: r.weightKg,
          fragile: r.fragile
        }));
        if (this.isOwner) this.matches = mapped;
        else this.requests = mapped;
    };
    if (this.isOwner) {
      this.parcelApi.matchingParcels().subscribe({
        next: rows => { applyRows(rows); this.loading = false; },
        error: err => { this.loading = false; this.loadError = err.error?.message || 'Incoming requests could not be loaded.'; }
      });
      this.parcelApi.ownerParcels().subscribe({
        next: rows => {
          const existingIds = new Set(this.matches.map(row => row.id));
          applyRows([...this.matches, ...(rows || []).filter((row: any) => !existingIds.has(row.id))]);
        }
      });
      return;
    }
    this.parcelApi.myParcels().subscribe({
      next: rows => { applyRows(rows); this.loading = false; },
      error: err => { this.loading = false; this.requests = []; this.loadError = err.error?.message || 'Parcel requests could not be loaded.'; }
    });
  }
}
