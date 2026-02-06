import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
  {
    path: 'staff',
    canActivate: [authGuard, roleGuard],
    data: { role: 'staff' },
    loadComponent: () => import('./layouts/staff-layout/staff-layout.component').then(m => m.StaffLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/staff-dashboard/staff-dashboard.component').then(m => m.StaffDashboardComponent) },
      { path: 'residents', loadComponent: () => import('./pages/residents-list/residents-list.component').then(m => m.ResidentsListComponent) },
      { path: 'residents/add', loadComponent: () => import('./pages/add-resident/add-resident.component').then(m => m.AddResidentComponent) },
      { path: 'residents/:id', loadComponent: () => import('./pages/resident-profile/resident-profile.component').then(m => m.ResidentProfileComponent) },
      { path: 'households', loadComponent: () => import('./pages/households/households.component').then(m => m.HouseholdsComponent) },
      { path: 'households/map', loadComponent: () => import('./pages/household-map/household-map.component').then(m => m.HouseholdMapComponent) },
      { path: 'households/add', loadComponent: () => import('./pages/add-household/add-household.component').then(m => m.AddHouseholdComponent) },
      { path: 'households/:id/edit', loadComponent: () => import('./pages/edit-household/edit-household.component').then(m => m.EditHouseholdComponent) },
      { path: 'households/:id', loadComponent: () => import('./pages/household-detail/household-detail.component').then(m => m.HouseholdDetailComponent) },
      { path: 'reports', loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent) },
      { path: 'requests/:id', loadComponent: () => import('./pages/request-detail/request-detail.component').then(m => m.RequestDetailComponent) },
      { path: 'requests', loadComponent: () => import('./pages/requests/requests.component').then(m => m.RequestsComponent) },
      { path: 'qr-scanner', loadComponent: () => import('./pages/qr-scanner/qr-scanner.component').then(m => m.QrScannerComponent) },
      { path: 'users', loadComponent: () => import('./pages/users-roles/users-roles.component').then(m => m.UsersRolesComponent) },
      { path: 'sms', loadComponent: () => import('./pages/admin-sms-broadcast/admin-sms-broadcast.component').then(m => m.AdminSmsBroadcastComponent) },
      { path: 'email', loadComponent: () => import('./pages/admin-email-broadcast/admin-email-broadcast.component').then(m => m.AdminEmailBroadcastComponent) },
      { path: 'audit-log', loadComponent: () => import('./pages/audit-log/audit-log.component').then(m => m.AuditLogComponent) },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },
    ],
  },
  {
    path: 'resident',
    canActivate: [authGuard, roleGuard],
    data: { role: 'resident' },
    loadComponent: () => import('./layouts/resident-layout/resident-layout.component').then(m => m.ResidentLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/resident-dashboard/resident-dashboard.component').then(m => m.ResidentDashboardComponent) },
      { path: 'profile', loadComponent: () => import('./pages/my-profile/my-profile.component').then(m => m.MyProfileComponent) },
      { path: 'request-certificate', loadComponent: () => import('./pages/request-certificate/request-certificate.component').then(m => m.RequestCertificateComponent) },
      { path: 'reports', loadComponent: () => import('./pages/resident-reports/resident-reports.component').then(m => m.ResidentReportsComponent) },
      { path: 'requests/:id', loadComponent: () => import('./pages/resident-request-detail/resident-request-detail.component').then(m => m.ResidentRequestDetailComponent) },
      { path: 'requests', loadComponent: () => import('./pages/my-requests/my-requests.component').then(m => m.MyRequestsComponent) },
      { path: 'settings', loadComponent: () => import('./pages/resident-settings/resident-settings.component').then(m => m.ResidentSettingsComponent) },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
