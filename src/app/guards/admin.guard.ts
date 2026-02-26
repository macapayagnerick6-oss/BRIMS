import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard for routes that require Admin role (e.g. Users & Roles, Audit Log, Settings).
 * Use on child routes with data: { requiredRole: 'admin' } so Staff cannot access.
 */
export const adminGuard = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const requiredRole = route.data['requiredRole'] as string | undefined;
  if (requiredRole !== 'admin') return true; // not an admin-only route
  if (auth.currentUser?.role === 'admin') return true;
  router.navigate([auth.currentUser?.role === 'staff' ? '/staff' : '/login']);
  return false;
};
