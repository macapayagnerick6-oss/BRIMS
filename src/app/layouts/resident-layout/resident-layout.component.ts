import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-resident-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, DatePipe],
  templateUrl: './resident-layout.component.html',
  styleUrls: ['./resident-layout.component.scss'],
})
export class ResidentLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('profileMenu') profileMenuRef!: ElementRef<HTMLElement>;
  isMobileMenuOpen = false;
  isProfileMenuOpen = false;
  currentTime = new Date();
  private timeInterval: any;

  constructor(public auth: AuthService, public theme: ThemeService, public router: Router) {}

  /** FAB shown on requests list; link to new request */
  get fabLink(): { link: string; label: string } | null {
    const url = this.router.url;
    if (url === '/resident/requests' || url.startsWith('/resident/requests?')) return { link: '/resident/request-certificate', label: 'New Request' };
    return null;
  }

  /** Hide profile + theme toggle on settings and request detail */
  get showTopRightUi(): boolean {
    const url = this.router.url;
    if (url.includes('/settings')) return false;
    if (url.startsWith('/resident/requests/') && url !== '/resident/requests') return false; // request detail
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
    { path: '/resident/dashboard', label: 'Dashboard', icon: '🔲' },
    { path: '/resident/profile', label: 'My Profile', icon: '👤' },
    { path: '/resident/request-certificate', label: 'Request Certificates', icon: '📄' },
    { path: '/resident/reports', label: 'Reports', icon: '📊' },
    { path: '/resident/requests', label: 'Requests', icon: '📋' },
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
