import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-staff-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, DatePipe],
  templateUrl: './staff-layout.component.html',
  styleUrls: ['./staff-layout.component.scss'],
})
export class StaffLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('profileMenu') profileMenuRef!: ElementRef<HTMLElement>;
  @ViewChild('contentScroll') contentScrollRef!: ElementRef<HTMLElement>;
  isMobileMenuOpen = false;
  isProfileMenuOpen = false;
  showBackToTop = false;
  currentTime = new Date();
  private timeInterval: any;
  private routerSub?: Subscription;

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    public router: Router,
    private alert: AlertService,
  ) {}

  /** Hide mobile hamburger on QR scanner, add forms, household map, resident profile, and request details */
  get showMobileMenuToggle(): boolean {
    const url = this.router.url;
    if (url.startsWith('/staff/households/map')) return false;
    if (/^\/staff\/residents\/[^/]+$/.test(url)) return false; // resident profile
    if (url.startsWith('/staff/requests/') && url !== '/staff/requests') return false;
    if (url.includes('/qr-scanner')) return false;
    if (url.includes('/residents/add')) return false;
    if (url.includes('/households/add')) return false;
    return true;
  }

  /** FAB shown on list pages; link to add resident or add household */
  get fabLink(): { link: string; label: string } | null {
    const url = this.router.url;
    if (url === '/staff/residents' || url.startsWith('/staff/residents?')) return { link: '/staff/residents/add', label: 'Add Resident' };
    if (url === '/staff/households' || url.startsWith('/staff/households?')) return { link: '/staff/households/add', label: 'Add Household' };
    return null;
  }

  /** Hide profile + theme toggle on forms, resident profile, request detail, QR scanner, edit household */
  get showTopRightUi(): boolean {
    const url = this.router.url;
    if (url.startsWith('/staff/households/map')) return false; // maximize map space
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
    // Hide back-to-top when route changes
    this.routerSub = this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
      this.showBackToTop = false;
      setTimeout(() => this.updateBackToTopVisibility(), 0);
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.updateBackToTopVisibility(), 0);
  }

  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
    this.routerSub?.unsubscribe();
    // Clean up body class when component is destroyed
    if (typeof document !== 'undefined') {
      document.body.classList.remove('sidebar-open');
    }
  }

  staffNavItems = [
    { path: '/staff/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/staff/profile', label: 'My Profile', icon: 'profile' },
    { path: '/staff/qr-scanner', label: 'QR Scanner', icon: 'qr' },
    { path: '/staff/requests', label: 'Requests', icon: 'requests' },
    { path: '/staff/residents', label: 'Residents', icon: 'residents' },
    { path: '/staff/households', label: 'Households', icon: 'households' },
    { path: '/staff/reports', label: 'Reports', icon: 'reports' },
  ];
  adminNavItems = [
    { path: '/admin/users', label: 'Users & Roles', icon: 'users' },
    { path: '/admin/sms', label: 'SMS & Email', icon: 'sms' },
    { path: '/admin/audit-log', label: 'Audit Log', icon: 'audit' },
  ];
  get navItems() {
    const isAdmin = this.auth.currentUser?.role === 'admin';
    return isAdmin ? [...this.staffNavItems, ...this.adminNavItems] : this.staffNavItems;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.updateBodyClass();
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.updateBodyClass();
  }

  private updateBodyClass() {
    if (typeof document !== 'undefined') {
      if (this.isMobileMenuOpen) {
        document.body.classList.add('sidebar-open');
      } else {
        document.body.classList.remove('sidebar-open');
      }
    }
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

  async logout() {
    const result = await this.alert.confirm({
      title: 'Logout',
      text: 'Are you sure you want to logout?',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel',
      icon: 'warning',
    });

    if (result.isConfirmed) {
      this.auth.logout();
      this.router.navigate(['/login']);
      this.alert.successToast('Logged out', 'You have been logged out.', 1000);
    }
  }

  onContentScroll() {
    this.updateBackToTopVisibility();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.updateBackToTopVisibility();
  }

  private updateBackToTopVisibility() {
    const el = this.contentScrollRef?.nativeElement;
    const contentScrolled = el ? el.scrollTop > 300 : false;
    const windowScrolled = typeof window !== 'undefined' && window.scrollY > 300;
    this.showBackToTop = contentScrolled || windowScrolled;
  }

  scrollToTop() {
    const el = this.contentScrollRef?.nativeElement;
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
