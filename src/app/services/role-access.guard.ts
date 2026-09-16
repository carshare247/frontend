import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth.service';

@Injectable({ providedIn: 'root' })
export class OwnerRouteGuard implements CanActivate {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(): boolean | UrlTree {
    const session = this.auth.current;
    if (session?.role === 'owner') return true;
    return this.router.createUrlTree(['/home']);
  }
}

@Injectable({ providedIn: 'root' })
export class PassengerRouteGuard implements CanActivate {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(): boolean | UrlTree {
    const session = this.auth.current;
    if (session?.role === 'passenger') return true;
    return this.router.createUrlTree(['/']);
  }
}

@Injectable({ providedIn: 'root' })
export class AuthenticatedFeatureGuard implements CanActivate {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(): boolean | UrlTree {
    const role = this.auth.current?.role;
    if (role === 'owner' || role === 'passenger') return true;
    return this.router.createUrlTree(['/']);
  }
}
