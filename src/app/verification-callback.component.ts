import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription, startWith, switchMap } from 'rxjs';
import { DiditVerificationService, VerificationRole, VerificationStatus } from './services/didit-verification.service';

@Component({
  selector: 'app-verification-callback',
  standalone: true,
  imports: [CommonModule],
  template: `<section class="card verification-status">
    <h1>Identity verification</h1>
    <p *ngIf="status === 'INITIATED' || status === 'UNDER_REVIEW'">Your verification is being reviewed. This page will update automatically.</p>
    <p *ngIf="status === 'APPROVED'" class="success">Identity verified successfully.</p>
    <p *ngIf="status === 'REJECTED'" class="error">Identity verification was declined. Start again to retry.</p>
    <button class="btn btn-primary" *ngIf="status === 'REJECTED'" (click)="retry()">Verify again</button>
    <button class="btn btn-secondary" (click)="continueToDashboard()">Continue</button>
  </section>`,
  styles: [`.verification-status{max-width:560px;margin:40px auto;text-align:center}.success{color:#15803d}.error{color:#b91c1c}`]
})
export class VerificationCallbackComponent implements OnDestroy {
  status: VerificationStatus = 'NOT_STARTED';
  private role: VerificationRole = 'PASSENGER';
  private poll?: Subscription;
  constructor(private route: ActivatedRoute, private didit: DiditVerificationService, private router: Router) {
    const params = this.route.snapshot.queryParamMap;
    this.role = (params.get('role') || (this.router.url.startsWith('/owner') ? 'OWNER' : 'PASSENGER')) as VerificationRole;
    const callbackStatus = params.get('status');
    if (callbackStatus) this.status = this.mapStatus(callbackStatus);
    this.poll = interval(5000).pipe(startWith(0), switchMap(() => this.didit.getStatus())).subscribe({ next: result => this.status = result.status, error: () => {} });
  }
  private mapStatus(status: string): VerificationStatus {
    const normalized = status.toLowerCase().replace(/[_-]/g, ' ');
    if (normalized === 'approved' || normalized === 'verified') return 'APPROVED';
    if (normalized === 'declined' || normalized === 'rejected') return 'REJECTED';
    return 'UNDER_REVIEW';
  }
  retry() { this.didit.createSession(this.role).subscribe(({ verificationUrl }) => { void this.didit.openVerification(verificationUrl); }); }
  continueToDashboard() { this.router.navigateByUrl(this.role === 'OWNER' ? '/owner/dashboard' : '/home'); }
  ngOnDestroy() { this.poll?.unsubscribe(); }
}
