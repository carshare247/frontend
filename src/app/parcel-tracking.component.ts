import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ParcelApiService } from './services/parcel-api.service';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-parcel-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="tracking-shell">
      <header class="page-header tracking-hero">
        <div>
          <p class="eyebrow">LIVE STATUS</p>
          <h1 class="page-title">Parcel tracking</h1>
          <p class="page-sub">Route progress and OTP checkpoint validation for every parcel delivery.</p>
        </div>
        <a routerLink="/owner/parcel-dashboard" class="btn btn-secondary">Back to dashboard</a>
      </header>

      <section class="summary-grid" *ngIf="summary">
        <article class="summary-card">
          <span class="label">Parcel ID</span>
          <strong>{{ summary.id || parcelId }}</strong>
        </article>
        <article class="summary-card">
          <span class="label">Current stage</span>
          <strong>{{ summary.status || 'In transit' }}</strong>
        </article>
        <article class="summary-card">
          <span class="label">ETA</span>
          <strong>{{ summary.eta || '1h 12m' }}</strong>
        </article>
        <article class="summary-card">
          <span class="label">Status</span>
          <strong>{{ summary.progressLabel || 'On route' }}</strong>
        </article>
      </section>

      <section class="panel-grid">
        <div class="panel map-panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow dark">Journey</p>
              <h3>Route progress</h3>
            </div>
            <span class="status-pill">{{ summary?.status || 'In transit' }}</span>
          </div>

          <div class="route-map" aria-label="Parcel route map">
            <div class="map-road"></div>
            <div class="marker pickup">Pickup</div>
            <div class="marker destination">Destination</div>
            <div class="route-vehicle">🚐</div>
          </div>

          <div class="stage-timeline" aria-label="Parcel delivery stages">
            <div class="stage" *ngFor="let stage of stages; let index = index" [class.completed]="isStageCompleted(index)" [class.current]="isCurrentStage(index)" [class.upcoming]="!isStageCompleted(index) && !isCurrentStage(index)">
              <div class="stage-marker"><span>{{ isStageCompleted(index) ? '✓' : index + 1 }}</span></div>
              <div class="stage-copy">
                <strong>{{ stage.label }}</strong>
                <small>{{ isCurrentStage(index) ? 'Current stage' : isStageCompleted(index) ? 'Completed' : 'Upcoming' }}</small>
              </div>
            </div>
          </div>
        </div>

        <div class="panel info-panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow dark">CHECKPOINT ACTIVITY</p>
              <h3>Verification history</h3>
            </div>
            <span class="status-pill">{{ statusLabel }}</span>
          </div>

          <div class="current-checkpoint">
            <span class="current-dot"></span>
            <div><small>Current parcel status</small><strong>{{ statusLabel }}</strong></div>
          </div>

          <ul class="checkpoints" *ngIf="events?.length; else emptyState">
            <li *ngFor="let event of events; let index = index" [class.active]="index === 0">
              <span class="point" [class.point-active]="index === 0"></span>
              <div>
                <strong>{{ event.message || formatStatus(event.status) || 'Tracking update' }}</strong>
                <small>{{ formatDate(event.trackedAt) }}</small>
              </div>
            </li>
          </ul>

          <ng-template #emptyState>
            <div class="empty-state">Tracking events are being prepared for this parcel.</div>
          </ng-template>
        </div>
      </section>

      <section class="panel verification-panel" *ngIf="summary && ['REQUESTED', 'ACCEPTED', 'PICKUP_OTP_GENERATED'].includes(summary.status)">
        <div class="panel-header">
          <div>
            <p class="eyebrow dark">Pickup checkpoint</p>
            <h3>Confirm parcel handover</h3>
          </div>
          <span class="status-pill">6-digit code</span>
        </div>
        <p class="verification-copy">Ask the carrier for the pickup OTP, then enter it here when handing over the parcel.</p>
        <form class="otp-form" (ngSubmit)="verifyPickup()">
          <input [(ngModel)]="pickupOtp" name="pickupOtp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="Enter pickup OTP" aria-label="Pickup OTP" />
          <button class="btn btn-primary" type="submit" [disabled]="verifyingPickup || pickupOtp.length !== 6">{{ verifyingPickup ? 'Checking...' : 'Verify pickup' }}</button>
        </form>
      </section>

      <section class="panel verification-panel" *ngIf="summary?.status === 'DELIVERY_OTP_GENERATED'">
        <div class="panel-header">
          <div>
            <p class="eyebrow dark">Delivery checkpoint</p>
            <h3>Confirm final handover</h3>
          </div>
          <span class="status-pill">6-digit code</span>
        </div>
        <p class="verification-copy">Enter the delivery OTP to complete this parcel delivery.</p>
        <form class="otp-form" (ngSubmit)="verifyDelivery()">
          <input [(ngModel)]="deliveryOtp" name="deliveryOtp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="Enter delivery OTP" aria-label="Delivery OTP" />
          <button class="btn btn-primary" type="submit" [disabled]="verifyingDelivery || deliveryOtp.length !== 6">{{ verifyingDelivery ? 'Checking...' : 'Verify delivery' }}</button>
        </form>
      </section>
    </div>
  `,
  styles: [
    `
      .tracking-shell { display: grid; gap: 22px; }
      .tracking-hero { background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(16,185,129,0.08)); border: 1px solid rgba(59,130,246,0.12); border-radius: 20px; padding: 24px; }
      .eyebrow { text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.72rem; font-weight: 800; color: #1d4ed8; margin: 0 0 6px; }
      .eyebrow.dark { color: #475569; }
      .summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
      .summary-card { background: white; border: 1px solid rgba(148,163,184,0.12); border-radius: 18px; padding: 18px; display: grid; gap: 8px; }
      .summary-card .label { text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-size: 0.72rem; }
      .summary-card strong { color: #0f172a; font-size: clamp(1rem, 2vw, 1.2rem); overflow-wrap: anywhere; }
      .panel-grid { display: grid; grid-template-columns: 1.25fr 0.75fr; gap: 18px; }
      .panel { background: white; border: 1px solid rgba(148,163,184,0.12); border-radius: 20px; padding: 20px; box-shadow: 0 10px 24px rgba(15,23,42,0.04); }
      .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
      .status-pill { display: inline-flex; align-items: center; justify-content: center; padding: 6px 10px; border-radius: 999px; background: rgba(34,197,94,0.12); color: #166534; font-size: 0.7rem; font-weight: 700; }
      .route-map { position: relative; height: 220px; border-radius: 18px; background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%); overflow: hidden; border: 1px solid rgba(148,163,184,0.16); }
      .map-road { position: absolute; left: 8%; right: 8%; top: 50%; height: 8px; transform: translateY(-50%); background: linear-gradient(90deg, #0ea5e9, #22c55e); border-radius: 999px; box-shadow: 0 10px 25px rgba(14,165,233,0.2); }
      .marker { position: absolute; padding: 8px 10px; border-radius: 999px; font-size: 0.68rem; font-weight: 700; }
      .marker.pickup { left: 12%; top: 18%; background: rgba(34,197,94,0.12); color: #166534; }
      .marker.destination { right: 11%; bottom: 18%; background: rgba(59,130,246,0.12); color: #1d4ed8; }
      .route-vehicle { position: absolute; left: 46%; top: 42%; transform: translate(-50%, -50%); font-size: 2.2rem; animation: moveVehicle 2.8s ease-in-out infinite alternate; }
      @keyframes moveVehicle { from { left: 38%; } to { left: 62%; } }
      .stage-timeline { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 0; margin: 22px 4px 2px; }
      .stage { position: relative; display: grid; justify-items: center; gap: 8px; min-width: 0; text-align: center; }
      .stage:not(:last-child)::after { content: ''; position: absolute; top: 13px; left: calc(50% + 13px); width: calc(100% - 26px); height: 3px; background: #e2e8f0; }
      .stage.completed:not(:last-child)::after { background: #22c55e; }
      .stage-marker { position: relative; z-index: 1; display: grid; place-items: center; width: 26px; height: 26px; border: 3px solid #e2e8f0; border-radius: 50%; background: white; color: #94a3b8; font-size: .65rem; font-weight: 800; }
      .stage.completed .stage-marker { border-color: #22c55e; background: #22c55e; color: white; }
      .stage.current .stage-marker { border-color: #2563eb; background: #eff6ff; color: #2563eb; box-shadow: 0 0 0 5px rgba(37,99,235,.12); }
      .stage-copy { display: grid; gap: 3px; max-width: 90px; }
      .stage-copy strong { color: #334155; font-size: .68rem; line-height: 1.2; overflow-wrap: anywhere; }
      .stage.current .stage-copy strong { color: #1d4ed8; }
      .stage-copy small { color: #94a3b8; font-size: .62rem; line-height: 1.2; }
      .checkpoints { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
      .checkpoints li { display: flex; gap: 12px; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid rgba(148,163,184,0.12); }
      .checkpoints li.active strong { color: #1d4ed8; }
      .checkpoints strong, .checkpoints small { overflow-wrap: anywhere; }
      .point { width: 10px; height: 10px; border-radius: 50%; background: #cbd5e1; margin-top: 4px; }
      .point-active { background: #2563eb; box-shadow: 0 0 0 4px rgba(59,130,246,0.12); }
      .checkpoints strong { display: block; margin-bottom: 4px; }
      .checkpoints small { color: #64748b; }
      .empty-state { padding: 16px; border-radius: 14px; background: #f8fafc; color: #475569; border: 1px dashed rgba(148,163,184,0.25); }
      .current-checkpoint { display: flex; gap: 10px; align-items: center; padding: 12px; margin-bottom: 8px; border: 1px solid rgba(37,99,235,.14); border-radius: 12px; background: #eff6ff; }
      .current-checkpoint div { display: grid; gap: 3px; }
      .current-checkpoint small { color: #64748b; font-size: .68rem; }
      .current-checkpoint strong { color: #1d4ed8; font-size: .9rem; }
      .current-dot { width: 10px; height: 10px; flex: 0 0 auto; border-radius: 50%; background: #2563eb; box-shadow: 0 0 0 5px rgba(37,99,235,.12); }
      .verification-panel { display: grid; gap: 10px; }
      .verification-copy { margin: -8px 0 4px; color: #475569; }
      .otp-form { display: flex; gap: 10px; max-width: 520px; }
      .otp-form input { flex: 1; min-width: 0; border: 1px solid rgba(148,163,184,.28); border-radius: 12px; padding: 12px 14px; font: inherit; letter-spacing: .18em; }
      @media (max-width: 900px) { .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .panel-grid { grid-template-columns: 1fr; } }
      @media (max-width: 820px) {
        .summary-grid { grid-template-columns: 1fr 1fr; }
      }
      @media (max-width: 640px) {
        .tracking-shell { gap: 14px; }
        .tracking-hero { display: grid; gap: 12px; padding: 18px; border-radius: 16px; }
        .tracking-hero .btn { width: 100%; min-height: 44px; }
        .summary-grid { grid-template-columns: 1fr; }
        .panel { padding: 16px; border-radius: 16px; }
        .route-map { height: 180px; }
        .stage-timeline { grid-template-columns: repeat(3, minmax(0, 1fr)); row-gap: 18px; }
        .stage-copy { max-width: 80px; }
        .otp-form { display: grid; max-width: none; }
        .otp-form .btn { min-height: 44px; }
      }
    `
  ]
})
export class ParcelTrackingComponent implements OnInit {
  parcelId = '';
  summary: any = null;
  events: any[] = [];
  pickupOtp = '';
  deliveryOtp = '';
  verifyingPickup = false;
  verifyingDelivery = false;
  readonly stages = [
    { status: 'REQUESTED', label: 'Request created' },
    { status: 'ACCEPTED', label: 'Carrier accepted' },
    { status: 'PICKUP_OTP_GENERATED', label: 'Pickup OTP' },
    { status: 'IN_TRANSIT', label: 'In transit' },
    { status: 'DELIVERY_OTP_GENERATED', label: 'Delivery OTP' },
    { status: 'DELIVERED', label: 'Delivered' }
  ];

  get statusLabel(): string {
    return this.formatStatus(this.summary?.status || 'REQUESTED');
  }

  constructor(private route: ActivatedRoute, private parcelApi: ParcelApiService, private toast: ToastService) {}

  ngOnInit(): void {
    this.parcelId = this.route.snapshot.paramMap.get('id') || '';
    this.load();
  }

  private load(): void {
    if (!this.parcelId) return;

    this.parcelApi.trackParcel(this.parcelId).subscribe({
      next: (list) => {
        this.events = Array.isArray(list) ? list : [];
        this.summary = {
          id: this.parcelId,
          status: this.normalizeStatus(this.events[0]?.status || 'IN_TRANSIT'),
          eta: '1h 12m',
          progressLabel: 'On route'
        };
      },
      error: () => {
        this.events = [];
        this.summary = { id: this.parcelId, status: 'Awaiting sync', eta: 'Pending', progressLabel: 'Syncing' };
      }
    });
  }

  verifyPickup(): void {
    if (this.pickupOtp.length !== 6 || this.verifyingPickup) return;
    this.verifyingPickup = true;
    this.parcelApi.verifyPickupOtp(this.parcelId, this.pickupOtp).subscribe({
      next: response => {
        this.verifyingPickup = false;
        if (response?.data === true || response === true) {
          this.toast.show('Pickup verified. Parcel handover confirmed.', 'success');
          this.pickupOtp = '';
          this.load();
        } else {
          this.toast.show('Incorrect pickup OTP. Please try again.', 'error');
        }
      },
      error: err => {
        this.verifyingPickup = false;
        this.toast.show(err.error?.message || 'Unable to verify pickup OTP', 'error');
      }
    });
  }

  verifyDelivery(): void {
    if (this.deliveryOtp.length !== 6 || this.verifyingDelivery) return;
    this.verifyingDelivery = true;
    this.parcelApi.verifyDeliveryOtp(this.parcelId, this.deliveryOtp).subscribe({
      next: response => {
        this.verifyingDelivery = false;
        if (response?.data === true || response === true) {
          this.toast.show('Delivery verified. Parcel marked as delivered.', 'success');
          this.deliveryOtp = '';
          this.load();
        } else {
          this.toast.show('Incorrect delivery OTP. Please try again.', 'error');
        }
      },
      error: err => {
        this.verifyingDelivery = false;
        this.toast.show(err.error?.message || 'Unable to verify delivery OTP', 'error');
      }
    });
  }

  isCurrentStage(index: number): boolean {
    return index === this.currentStageIndex;
  }

  isStageCompleted(index: number): boolean {
    return index < this.currentStageIndex;
  }

  private get currentStageIndex(): number {
    const status = String(this.summary?.status || 'REQUESTED').toUpperCase();
    const index = this.stages.findIndex(stage => stage.status === this.normalizeStatus(status));
    return index >= 0 ? index : 0;
  }

  private normalizeStatus(status: string): string {
    return ['PICKED_UP', 'NEAR_DESTINATION'].includes(String(status).toUpperCase()) ? 'IN_TRANSIT' : String(status).toUpperCase();
  }

  formatStatus(status: string): string {
    return String(status || '').toLowerCase().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  formatDate(value: string): string {
    if (!value) return 'Updated recently';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  }
}
