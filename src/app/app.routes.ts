import { Routes } from '@angular/router';
import { AuthComponent } from './auth.component';
import { AuthService } from './auth.service';
import { OnboardingGuard } from './services/onboarding-guard.service';
import { AuthenticatedFeatureGuard, OwnerRouteGuard } from './services/role-access.guard';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

const ownerAuthGuard = () => {
	const auth = inject(AuthService);
	return auth.current ? true : inject(Router).createUrlTree(['/']);
};

const adminAuthGuard = () => {
	const auth = inject(AuthService);
	const hasToken = !!(localStorage.getItem('accessToken') || localStorage.getItem('refreshToken'));
	return auth.current?.role === 'admin' && hasToken ? true : inject(Router).createUrlTree(['/Kumaresh']);
};

const ownerGuard = () => inject(OwnerRouteGuard).canActivate();
const featureGuard = () => inject(AuthenticatedFeatureGuard).canActivate();

export const routes: Routes = [
	{ path: '', component: AuthComponent, pathMatch: 'full' },
	{ path: 'register', loadComponent: () => import('./registration-flow.component').then(m => m.RegistrationFlowComponent) },
	{ path: 'Kumaresh', loadComponent: () => import('./admin-login.component').then(m => m.AdminLoginComponent) },
	{ path: 'Kumaresh/dashboard', loadComponent: () => import('./admin-home.component').then(m => m.AdminHomeComponent), canActivate: [adminAuthGuard] },
	{ path: 'Kumaresh/subscriptions', loadComponent: () => import('./admin-module.component').then(m => m.AdminModuleComponent), data: { module: 'subscriptions' }, canActivate: [adminAuthGuard] },
	{ path: 'Kumaresh/users', loadComponent: () => import('./admin-module.component').then(m => m.AdminModuleComponent), data: { module: 'users' }, canActivate: [adminAuthGuard] },
	{ path: 'Kumaresh/rides', loadComponent: () => import('./admin-module.component').then(m => m.AdminModuleComponent), data: { module: 'rides' }, canActivate: [adminAuthGuard] },
	{ path: 'Kumaresh/parcels', loadComponent: () => import('./admin-module.component').then(m => m.AdminModuleComponent), data: { module: 'parcels' }, canActivate: [adminAuthGuard] },
	{ path: 'Kumaresh/tickets', loadComponent: () => import('./admin-module.component').then(m => m.AdminModuleComponent), data: { module: 'tickets' }, canActivate: [adminAuthGuard] },
	{ path: 'Kumaresh/didit', loadComponent: () => import('./admin-module.component').then(m => m.AdminModuleComponent), data: { module: 'didit' }, canActivate: [adminAuthGuard] },
	{ path: 'Kumaresh/rewards', loadComponent: () => import('./admin-rewards.component').then(m => m.AdminRewardsComponent), canActivate: [adminAuthGuard] },
	{ path: 'home', loadComponent: () => import('./carbon-dashboard.component').then(m => m.CarbonDashboardComponent), canActivate: [OnboardingGuard] },
	{ path: 'ride-search', loadComponent: () => import('./components/multi-stop-ride-search.component').then(m => m.MultiStopRideSearchComponent), canActivate: [OnboardingGuard] },
	{ path: 'support', loadComponent: () => import('./support.component').then(m => m.SupportComponent) },
	{ path: 'referrals', loadComponent: () => import('./referral-rewards.component').then(m => m.ReferralRewardsComponent) },
	{ path: 'debug/push', loadComponent: () => import('./debug-push.component').then(m => m.DebugPushComponent) },
	{ path: 'owner/register', redirectTo: 'register', pathMatch: 'full' },
	{ path: 'owner/verification-status', loadComponent: () => import('./verification-callback.component').then(m => m.VerificationCallbackComponent) },
	{ path: 'passenger/verification-status', loadComponent: () => import('./verification-callback.component').then(m => m.VerificationCallbackComponent) },
	{ path: 'Kumaresh/verifications', loadComponent: () => import('./admin-audit-list.component').then(m => m.AdminAuditListComponent), canActivate: [adminAuthGuard] },
	{ path: 'owner/plans', loadComponent: () => import('./subscription-plans.component').then(m => m.SubscriptionPlansComponent), canActivate: [ownerGuard] },
	{ path: 'owner/payment', loadComponent: () => import('./owner-payment.component').then(m => m.OwnerPaymentComponent), canActivate: [ownerGuard] },
	{ path: 'owner/dashboard', loadComponent: () => import('./carbon-dashboard.component').then(m => m.CarbonDashboardComponent), canActivate: [ownerGuard] },
	{ path: 'owner/operations', loadComponent: () => import('./owner-dashboard.component').then(m => m.OwnerDashboardComponent), canActivate: [ownerGuard] },
	{ path: 'owner/parcel-dashboard', loadComponent: () => import('./parcel-dashboard.component').then(m => m.ParcelDashboardComponent), canActivate: [ownerGuard] },
	{ path: 'owner/carbon-dashboard', loadComponent: () => import('./carbon-dashboard.component').then(m => m.CarbonDashboardComponent), canActivate: [ownerGuard] },
	{ path: 'parcel/dashboard', loadComponent: () => import('./parcel-dashboard.component').then(m => m.ParcelDashboardComponent), canActivate: [featureGuard] },
	{ path: 'parcel/request', loadComponent: () => import('./parcel-request.component').then(m => m.ParcelRequestComponent), canActivate: [featureGuard] },
	{ path: 'carbon/dashboard', loadComponent: () => import('./carbon-dashboard.component').then(m => m.CarbonDashboardComponent), canActivate: [featureGuard] },
	{ path: 'owner/my-rides', loadComponent: () => import('./owner-rides.component').then(m => m.OwnerRidesComponent), canActivate: [ownerGuard] },
	{ path: 'owner/create-ride', loadComponent: () => import('./components/multi-stop-ride-create.component').then(m => m.MultiStopRideCreateComponent), canActivate: [ownerGuard] },
	{ path: 'owner/requests', loadComponent: () => import('./owner-requests.component').then(m => m.OwnerRequestsComponent), canActivate: [ownerGuard] },
	{ path: 'parcel/tracking/:id', loadComponent: () => import('./parcel-tracking.component').then(m => m.ParcelTrackingComponent), canActivate: [featureGuard] },
	{ path: 'rides/create/multi-stop', redirectTo: 'owner/create-ride', pathMatch: 'full' },
	{ path: 'rides/search/multi-stop', redirectTo: 'ride-search', pathMatch: 'full' },
	{ path: 'rides/book/multi-stop', loadComponent: () => import('./components/multi-stop-booking.component').then(m => m.MultiStopBookingComponent) },
	{ path: 'bookings', loadComponent: () => import('./bookings.component').then(m => m.BookingsComponent) },
	{ path: 'ride/:id', loadComponent: () => import('./ride-detail.component').then(m => m.RideDetailComponent) },
    { path: 'profile', loadComponent: () => import('./passenger-profile.component').then(m => m.PassengerProfileComponent) },
	{ path: 'owner/profile', loadComponent: () => import('./owner-profile.component').then(m => m.OwnerProfileComponent) },
	{ path: 'owner/:id', loadComponent: () => import('./profile.component').then(m => m.ProfileComponent) },
	{ path: '**', redirectTo: '' }
];
