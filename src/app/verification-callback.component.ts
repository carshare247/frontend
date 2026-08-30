import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription, startWith, switchMap } from 'rxjs';
import { DiditVerificationService, VerificationRole, VerificationStatus } from './services/didit-verification.service';
import { OnboardingStateService } from './services/onboarding-state.service';
import { normalizeVerificationStatus } from './services/verification-state';

@Component({
  selector: 'app-verification-callback',
  standalone: true,
  imports: [CommonModule],
  template: `<section class="card verification-status">
    <div class="status-icon" [ngClass]="statusClass">{{ status === 'APPROVED' ? '✓' : status === 'REJECTED' ? '!' : '⏳' }}</div>
    <h1>{{ title }}</h1>
    <p class="lead" [ngClass]="statusClass">{{ description }}</p>

    <div class="actions" *ngIf="status === 'REJECTED' || status === 'APPROVED'">
      <button class="btn btn-primary" *ngIf="status === 'REJECTED'" (click)="retry()">Retry verification</button>
      <button class="btn btn-secondary" *ngIf="status === 'APPROVED'" (click)="continueToDashboard()">Continue</button>
    </div>

    <p class="muted" *ngIf="status === 'INITIATED' || status === 'UNDER_REVIEW'">
      Your application is being reviewed. This page will refresh automatically until verification is completed.
    </p>
  </section>`,
  styles: [`.verification-status{max-width:560px;margin:40px auto;text-align:center;padding:32px 24px;border-radius:18px}.status-icon{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:2rem;font-weight:800}.status-icon.pending{background:#fef3c7;color:#92400e}.status-icon.success{background:#dcfce7;color:#166534}.status-icon.error{background:#fee2e2;color:#991b1b}.lead{font-size:1.02rem;line-height:1.6;margin:0}.lead.pending{color:#92400e}.lead.success{color:#166534}.lead.error{color:#991b1b}.actions{display:flex;justify-content:center;gap:12px;margin-top:20px}.muted{margin-top:18px;color:#64748b;font-size:0.9rem}`]
})
export class VerificationCallbackComponent implements OnDestroy {
  status: VerificationStatus = 'NOT_STARTED';
  private role: VerificationRole = 'PASSENGER';
  private poll?: Subscription;

  get title(): string {
    if (this.status === 'APPROVED') return 'Identity verified';
    if (this.status === 'REJECTED') return 'Verification rejected';
    return 'Identity verification in progress';
  }

  get description(): string {
    if (this.status === 'APPROVED') return 'Your identity has been approved. You can continue to the next step.';
    if (this.status === 'REJECTED') return 'Your identity verification was declined. Please retry with a valid submission.';
    return 'We are checking your verification details. Please wait while your profile is reviewed.';
  }

  get statusClass(): 'pending' | 'success' | 'error' {
    if (this.status === 'APPROVED') return 'success';
    if (this.status === 'REJECTED') return 'error';
    return 'pending';
  }

  constructor(
    private route: ActivatedRoute,
    private didit: DiditVerificationService,
    private router: Router,
    private onboarding: OnboardingStateService,
  ) {
    const params = this.route.snapshot.queryParamMap;
    this.role = (params.get('role') || (this.router.url.startsWith('/owner') ? 'OWNER' : 'PASSENGER')) as VerificationRole;
    const callbackStatus = params.get('status');
    if (callbackStatus) this.status = this.mapStatus(callbackStatus);
    this.onboarding.markDiditStatus(this.status);
    this.poll = interval(5000).pipe(startWith(0), switchMap(() => this.didit.getStatus())).subscribe({
      next: result => {
        this.status = normalizeVerificationStatus(result.status);
        this.onboarding.markDiditStatus(this.status);
      },
      error: () => {}
    });
  }

  private mapStatus(status: string): VerificationStatus {
    const normalized = status.toLowerCase().replace(/[_-]/g, ' ');
    if (normalized === 'approved' || normalized === 'verified') return 'APPROVED';
    if (normalized === 'declined' || normalized === 'rejected') return 'REJECTED';
    return 'UNDER_REVIEW';
  }

  retry() {
    this.didit.createSession(this.role).subscribe(({ verificationUrl }) => { void this.didit.openVerification(verificationUrl); });
  }

  continueToDashboard() {
    if (this.status !== 'APPROVED') return;
    this.router.navigateByUrl(this.role === 'OWNER' ? '/owner/dashboard' : '/home');
  }

  ngOnDestroy() { this.poll?.unsubscribe(); }
}
