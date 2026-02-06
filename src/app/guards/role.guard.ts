import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser;
  
  // Helper function to find role data in route tree
  const findRoleInRoute = (route: ActivatedRouteSnapshot | null): string | undefined => {
    if (!route) return undefined;
    if (route.data && route.data['role']) {
      return route.data['role'] as string;
    }
    // Check parent routes recursively
    return findRoleInRoute(route.parent);
  };
  
  const route = router.routerState.snapshot.root;
  const role = findRoleInRoute(route.firstChild);
  
  if (!role || user?.role === role) return true;
  const base = user?.role === 'staff' ? '/staff' : '/resident';
  router.navigate([base]);
  return false;
};
