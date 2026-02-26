import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Recursively find role or requiredRole in route tree (current route first, then parent). */
function findInRoute(route: ActivatedRouteSnapshot | null, key: 'role' | 'requiredRole'): string | undefined {
  if (!route) return undefined;
  if (route.data && route.data[key]) return route.data[key] as string;
  return findInRoute(route.parent, key);
}

/** Get the deepest requiredRole in the tree (the active child route). */
function findRequiredRole(route: ActivatedRouteSnapshot | null): string | undefined {
  if (!route) return undefined;
  if (route.firstChild) {
    const child = findRequiredRole(route.firstChild);
    if (child) return child;
  }
  return route.data?.['requiredRole'] as string | undefined;
}

export const roleGuard = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser;
  // Use the state we're navigating TO (state), not current URL (router.routerState.snapshot)
  const root = state.root;
  const firstChild = root.firstChild;

  const requiredRole = findRequiredRole(firstChild ?? root);
  const areaRole = findInRoute(firstChild ?? root, 'role');

  // If this route requires admin, only admin can access
  if (requiredRole === 'admin') {
    if (user?.role === 'admin') return true;
    router.navigate(['/staff']);
    return false;
  }

  // Admin area: only admin
  if (areaRole === 'admin') {
    if (user?.role === 'admin') return true;
    router.navigate(['/staff']);
    return false;
  }

  // Staff area: allow both staff and admin (admin has all features)
  if (areaRole === 'staff') {
    if (user?.role === 'admin' || user?.role === 'staff') return true;
    router.navigate(['/resident']);
    return false;
  }

  // Resident area
  if (areaRole === 'resident') {
    if (user?.role === 'resident') return true;
    router.navigate(['/staff']);
    return false;
  }

  router.navigate(['/login']);
  return false;
};
