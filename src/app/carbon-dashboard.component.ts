import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarbonApiService } from './services/carbon-api.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-carbon-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="carbon-shell">
      <header class="page-header carbon-hero">
        <div>
          <p class="eyebrow">IMPACT TRACKER</p>
          <h1 class="page-title">Carbon footprint dashboard</h1>
          <p class="page-sub">Measure the environmental value generated through every shared trip.</p>
        </div>
        <div class="hero-actions">
          <a *ngIf="auth.current?.role === 'passenger'" routerLink="/ride-search" class="btn btn-primary">Search ride</a>
          <a *ngIf="auth.current?.role === 'owner'" routerLink="/owner/create-ride" class="btn btn-primary">Create ride</a>
        </div>
      </header>

      <section class="summary-grid">
        <article class="summary-card">
          <span class="label">Total rides shared</span>
          <strong>{{ summary.ridesShared }}</strong>
          <small>+18 from last month</small>
        </article>
        <article class="summary-card">
          <span class="label">Distance shared</span>
          <strong>{{ summary.distance }}</strong>
          <small>Across active carpools</small>
        </article>
        <article class="summary-card">
          <span class="label">Fuel saved</span>
          <strong>{{ summary.fuelSaved }}</strong>
          <small>Equivalent to 1,160 kg CO₂ avoided</small>
        </article>
        <article class="summary-card">
          <span class="label">Trees equivalent</span>
          <strong>{{ summary.treesEquivalent }}</strong>
          <small>Oxygen impact score 91/100</small>
        </article>
      </section>

      <section class="panel-grid">
        <div class="panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow dark">Environmental score</p>
              <h3>Impact trend</h3>
            </div>
            <span class="badge green" *ngIf="recentTrips.length">Live data</span>
          </div>
          <div class="chart-bars" aria-label="Carbon chart" *ngIf="recentTrips.length; else noCarbonData">
            <span class="bar" *ngFor="let trip of recentTrips; let index = index" [style.height.%]="barHeight(index)"></span>
          </div>
          <ng-template #noCarbonData><div class="empty-state">No carbon calculations are available yet. Complete a shared ride to start your impact history.</div></ng-template>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow dark">Achievement</p>
              <h3>Badges earned</h3>
            </div>
          </div>
          <div class="badge-list">
            <div class="badge-item" *ngIf="recentTrips.length; else noBadges">
              <span class="badge-icon">Impact</span>
              <div><strong>Shared mobility contributor</strong><small>Based on your recorded ride impact</small></div>
            </div>
            <ng-template #noBadges><div class="empty-state">Achievements will appear after your first calculated ride.</div></ng-template>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow dark">Ride impact</p>
            <h3>Recent trip contributions</h3>
          </div>
          <span class="muted-label">Account impact</span>
        </div>

        <div class="impact-table">
          <div class="impact-head">
            <span>Ride</span>
            <span>Distance</span>
            <span>CO₂ reduced</span>
            <span>Fuel saved</span>
            <span>Impact</span>
          </div>
          <div class="impact-row" *ngFor="let trip of recentTrips">
            <span>{{ trip.ride }}</span>
            <span>{{ trip.distance }}</span>
            <span>{{ trip.co2 }}</span>
            <span>{{ trip.fuel }}</span>
            <span><em class="impact-badge" [ngClass]="trip.impact.toLowerCase() === 'high' ? 'high' : 'medium'">{{ trip.impact }}</em></span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .carbon-shell { display: grid; gap: 22px; }
      .carbon-hero { background: linear-gradient(135deg, rgba(34,197,94,0.1), rgba(14,116,144,0.08)); border: 1px solid rgba(34,197,94,0.14); border-radius: 20px; padding: 24px; }
      .hero-actions { display: flex; gap: 10px; align-items: center; }
      .eyebrow { text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.7rem; font-weight: 700; color: #166534; margin: 0 0 6px; }
      .eyebrow.dark { color: #475569; }
      .summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
      .summary-card { background: white; border: 1px solid rgba(148,163,184,0.14); border-radius: 18px; padding: 18px; display: grid; gap: 8px; box-shadow: 0 10px 24px rgba(15,23,42,0.04); }
      .summary-card .label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
      .summary-card strong { font-size: clamp(1.2rem, 2vw, 1.8rem); color: #0f172a; overflow-wrap: anywhere; }
      .summary-card small { color: #475569; }
      .panel-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 18px; }
      .panel { background: white; border: 1px solid rgba(148,163,184,0.12); border-radius: 20px; padding: 20px; box-shadow: 0 10px 24px rgba(15,23,42,0.04); }
      .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
      .badge.green { display: inline-flex; align-items: center; justify-content: center; padding: 6px 10px; border-radius: 999px; background: rgba(34,197,94,0.12); color: #166534; font-weight: 700; font-size: 0.72rem; }
      .chart-bars { height: 200px; display: flex; align-items: end; justify-content: space-between; gap: 12px; padding: 18px 10px 0; background: linear-gradient(180deg, rgba(22,163,74,0.06), rgba(14,116,144,0.03)); border-radius: 16px; }
      .bar { width: 100%; background: linear-gradient(180deg, #22c55e, #0ea5e9); border-radius: 12px 12px 0 0; display: block; min-height: 30px; }
      .b1 { background: linear-gradient(180deg, #bbf7d0, #16a34a); }
      .b2 { background: linear-gradient(180deg, #a7f3d0, #22c55e); }
      .b3 { background: linear-gradient(180deg, #86efac, #4ade80); }
      .b4 { background: linear-gradient(180deg, #99f6e4, #14b8a6); }
      .b5 { background: linear-gradient(180deg, #7dd3fc, #0ea5e9); }
      .b6 { background: linear-gradient(180deg, #bfdbfe, #3b82f6); }
      .badge-list { display: grid; gap: 12px; }
      .badge-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 14px; background: #f8fafc; border: 1px solid rgba(148,163,184,0.12); }
      .badge-icon { width: 42px; height: 42px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #dcfce7, #dbeafe); font-size: 1.2rem; }
      .badge-item strong { display: block; font-size: 0.92rem; }
      .badge-item small { color: #64748b; }
      .impact-table { display: grid; gap: 12px; }
      .impact-head, .impact-row { display: grid; grid-template-columns: 1.8fr 0.9fr 1fr 1fr 0.7fr; gap: 12px; align-items: center; }
      .impact-head { color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.68rem; font-weight: 700; padding: 0 6px; }
      .impact-row { padding: 14px 6px; border-top: 1px solid rgba(148,163,184,0.12); }
      .impact-row > span { overflow-wrap: anywhere; }
      .impact-badge { display: inline-flex; align-items: center; justify-content: center; padding: 5px 8px; border-radius: 999px; font-style: normal; font-weight: 700; font-size: 0.68rem; }
      .impact-badge.high { background: rgba(34,197,94,0.12); color: #166534; }
      .impact-badge.medium { background: rgba(251,191,36,0.12); color: #92400e; }
      .mini-link { color: #2563eb; font-weight: 600; text-decoration: none; }
      @media (max-width: 900px) { .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .panel-grid { grid-template-columns: 1fr; } }
      @media (max-width: 640px) {
        .carbon-shell { gap: 14px; }
        .carbon-hero { display: grid; gap: 12px; padding: 18px; border-radius: 16px; }
        .hero-actions { display: grid; width: 100%; }
        .hero-actions .btn { width: 100%; text-align: center; min-height: 44px; }
        .summary-grid { grid-template-columns: 1fr; }
        .summary-card { padding: 14px; border-radius: 14px; }
        .summary-card strong { font-size: 1.45rem; }
        .panel { padding: 16px; border-radius: 16px; }
        .impact-head { display: none; }
        .impact-row { grid-template-columns: 1fr; padding: 12px 0; }
        .badge-item { align-items: flex-start; }
        .chart-bars { height: 150px; gap: 8px; padding: 12px 8px 0; }
        .bar { min-height: 20px; }
      }
    `
  ]
})
export class CarbonDashboardComponent implements OnInit {
  summary = {
    ridesShared: 0,
    distance: '0 km',
    fuelSaved: '0 L',
    treesEquivalent: '0'
  };

  recentTrips: Array<{ ride: string; distance: string; co2: string; fuel: string; impact: string }> = [];

  constructor(private carbonApi: CarbonApiService, public auth: AuthService) {}

  ngOnInit(): void {
    this.carbonApi.myFootprint().subscribe({
      next: (rows) => {
        if (!rows?.length) return;
        const totalDistance = rows.reduce((sum, row) => sum + Number(row.distanceKm || 0), 0);
        const totalFuel = rows.reduce((sum, row) => sum + Number(row.fuelSavedLitres || 0), 0);
        const totalCo2 = rows.reduce((sum, row) => sum + Number(row.co2ReducedKg || 0), 0);
        const totalTrees = rows.reduce((sum, row) => sum + Number(row.treesEquivalent || 0), 0);

        this.summary = {
          ridesShared: rows.length,
          distance: `${Math.round(totalDistance)} km`,
          fuelSaved: `${Number(totalFuel).toFixed(0)} L`,
          treesEquivalent: `${Math.round(totalTrees)}`
        };

        this.recentTrips = rows.slice(0, 3).map((row, index) => ({
          ride: `Trip ${index + 1}`,
          distance: `${row.distanceKm ?? 0} km`,
          co2: `${row.co2ReducedKg ?? 0} kg`,
          fuel: `${row.fuelSavedLitres ?? 0} L`,
          impact: Number(row.environmentalScore ?? 0) > 75 ? 'High' : 'Medium'
        }));
      },
      error: () => {
        this.summary = { ridesShared: 0, distance: '0 km', fuelSaved: '0 L', treesEquivalent: '0' };
      }
    });
  }

  barHeight(index: number): number {
    return Math.min(92, 42 + ((index + 1) * 13));
  }
}
