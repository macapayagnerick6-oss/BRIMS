import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-staff-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, DatePipe],
  templateUrl: './staff-layout.component.html',
  styleUrls: ['./staff-layout.component.scss'],
})
export class StaffLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('profileMenu') profileMenuRef!: ElementRef<HTMLElement>;
  isMobileMenuOpen = false;
  isProfileMenuOpen = false;
  currentTime = new Date();
  private timeInterval: any;

  constructor(public auth: AuthService, public theme: ThemeService, public router: Router) {}

  /** FAB shown on list pages; link to add resident or add household */
  get fabLink(): { link: string; label: string } | null {
    const url = this.router.url;
    if (url === '/staff/residents' || url.startsWith('/staff/residents?')) return { link: '/staff/residents/add', label: 'Add Resident' };
    if (url === '/staff/households' || url.startsWith('/staff/households?')) return { link: '/staff/households/add', label: 'Add Household' };
    return null;
  }

  /** Hide profile + theme toggle on forms, settings, resident profile, request detail, QR scanner, edit household */
  get showTopRightUi(): boolean {
    const url = this.router.url;
    if (url.startsWith('/staff/households/map')) return false; // maximize map space
    if (url.includes('/settings')) return false;
    if (url.includes('/residents/add') || url.includes('/households/add')) return false;
    if (url.includes('/households/') && url.includes('/edit')) return false; // edit household form
    if (url.includes('/qr-scanner')) return false;
    if (/^\/staff\/residents\/[^/]+$/.test(url)) return false; // resident profile
    if (url.startsWith('/staff/requests/') && url !== '/staff/requests') return false; // request detail
    return true;
  }

  ngOnInit() {
    // Update time every second
    this.timeInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  navItems = [
    // Overview of everything: counts, alerts, activity, quick stats.
    { path: '/staff/dashboard', label: 'Dashboard', icon: '🔲' },
    // Fast daily action – attendance, resident verification, or entry logs.
    { path: '/staff/qr-scanner', label: 'QR Scanner', icon: '📷' },
    // Barangay certificates, clearances, complaints, etc.
    { path: '/staff/requests', label: 'Requests', icon: '📋' },
    // Main database of people.
    { path: '/staff/residents', label: 'Residents', icon: '👥' },
    // Grouped data under residents.
    { path: '/staff/households', label: 'Households', icon: '🏠' },
    // Printable records, summaries, monthly outputs.
    { path: '/staff/reports', label: 'Reports', icon: '📊' },
    // Notifications, reminders, announcements.
    { path: '/staff/sms', label: 'SMS & Email', icon: '📨' },
    // Staff accounts, permissions.
    { path: '/staff/users', label: 'Users & Roles', icon: '👤' },
    // System activity tracking (admin-only, lowest frequency).
    { path: '/staff/audit-log', label: 'Audit Log', icon: '📜' },
  ];

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  closeProfileMenu() {
    this.isProfileMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.profileMenuRef?.nativeElement && !this.profileMenuRef.nativeElement.contains(event.target as Node)) {
      this.closeProfileMenu();
    }
  }

  logout() {
    this.auth.logout();
    window.location.href = '/login';
  }
}
