import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { OwnerRouteGuard } from './role-access.guard';
import { AuthService } from '../auth.service';

describe('OwnerRouteGuard', () => {
  let guard: OwnerRouteGuard;
  let router: Router;
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OwnerRouteGuard,
        {
          provide: Router,
          useValue: { createUrlTree: (commands: any[]) => new UrlTree() }
        },
        {
          provide: AuthService,
          useValue: { current: null }
        }
      ]
    });

    guard = TestBed.inject(OwnerRouteGuard);
    router = TestBed.inject(Router);
    auth = TestBed.inject(AuthService);
  });

  it('allows access to owners only', () => {
    (auth as any).current = { role: 'owner', id: 'u1' };
    expect(guard.canActivate()).toBeTrue();
  });

  it('redirects passengers away from owner-only pages', () => {
    (auth as any).current = { role: 'passenger', id: 'u2' };
    const result = guard.canActivate();
    expect(result).toEqual(router.createUrlTree(['/home']));
  });
});
