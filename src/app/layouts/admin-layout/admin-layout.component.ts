import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, DatePipe],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
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

  /** Hide mobile hamburger on QR scanner + add resident/household forms */
  get showMobileMenuToggle(): boolean {
    const url = this.router.url;
    if (url.includes('/qr-scanner')) return false;
    if (url.includes('/residents/add')) return false;
    if (url.includes('/households/add')) return false;
    return true;
  }

  /**
   * Control visibility of the fixed top-right UI (theme toggle + profile).
   *
   * We hide it on:
   * - settings pages
   * - QR scanner
   * - resident / household add forms
   * - household edit form
   * - resident profile detail
   * - request detail pages
   *
   * This mirrors the behavior in the staff layout so forms like
   * "Add Resident" and "Add Household" don't show the top bar.
   */
  get showTopRightUi(): boolean {
    const url = this.router.url;
    if (url.startsWith('/admin/households/map')) return false;
    if (url.includes('/residents/add') || url.includes('/households/add')) return false;
    if (url.includes('/households/') && url.includes('/edit')) return false;
    if (url.includes('/qr-scanner')) return false;
    if (/^\/admin\/residents\/[^/]+$/.test(url)) return false; // resident profile
    if (url.startsWith('/admin/requests/') && url !== '/admin/requests') return false; // request detail
    return true;
  }

  ngOnInit() {
    this.timeInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
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

  /** Same order as staff layout: operations first, then admin-only. */
  navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard', exact: true },
    { path: '/admin/profile', label: 'My Profile', icon: 'profile', exact: true },
    { path: '/admin/qr-scanner', label: 'QR Scanner', icon: 'qr', exact: true },
    { path: '/admin/requests', label: 'Requests', icon: 'requests', exact: false },
    { path: '/admin/residents', label: 'Residents', icon: 'residents', exact: false },
    { path: '/admin/households', label: 'Households', icon: 'households', exact: false },
    { path: '/admin/reports', label: 'Reports', icon: 'reports', exact: true },
    { path: '/admin/users', label: 'Users & Roles', icon: 'users', exact: true },
    { path: '/admin/sms', label: 'SMS & Email', icon: 'sms', exact: true },
    { path: '/admin/audit-log', label: 'Audit Log', icon: 'audit', exact: true },
    { path: '/admin/archives', label: 'Archives', icon: 'archives', exact: true },
  ];

  /** FAB shown on admin list pages; link to add resident or add household */
  get fabLink(): { link: string; label: string } | null {
    const url = this.router.url;
    if (url === '/admin/residents' || url.startsWith('/admin/residents?')) {
      return { link: '/admin/residents/add', label: 'Add Resident' };
    }
    if (url === '/admin/households' || url.startsWith('/admin/households?')) {
      return { link: '/admin/households/add', label: 'Add Household' };
    }
    return null;
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
