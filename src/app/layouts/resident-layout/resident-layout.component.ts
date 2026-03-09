import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-resident-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, DatePipe],
  templateUrl: './resident-layout.component.html',
  styleUrls: ['./resident-layout.component.scss'],
})
export class ResidentLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
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

  /** FAB shown on requests list; link to new request */
  get fabLink(): { link: string; label: string } | null {
    const url = this.router.url;
    if (url === '/resident/requests' || url.startsWith('/resident/requests?')) return { link: '/resident/request-certificate', label: 'New Request' };
    return null;
  }

  /** Always show profile + theme toggle (including on resident settings/accounts). */
  get showTopRightUi(): boolean {
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

  navItems = [
    { path: '/resident/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/resident/profile', label: 'My Profile', icon: 'profile' },
    { path: '/resident/request-certificate', label: 'Request Certificates', icon: 'certificate' },
    { path: '/resident/reports', label: 'Reports', icon: 'reports' },
    { path: '/resident/requests', label: 'Requests', icon: 'requests' },
  ];

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
