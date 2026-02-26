import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService, CertificateRequest } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './my-requests.component.html',
  styleUrls: ['./my-requests.component.scss'],
})
export class MyRequestsComponent {
  // Filter and search signals
  statusFilter = signal<string>('all');
  searchQuery = signal<string>('');
  sortBy = signal<'date' | 'type' | 'status'>('date');
  sortOrder = signal<'asc' | 'desc'>('desc');

  constructor(
    public data: DataService,
    public auth: AuthService
  ) {}

  /** Requests for the current logged-in resident only. */
  get allRequests(): CertificateRequest[] {
    const user = this.auth.currentUser;
    if (!user || user.role !== 'resident') return [];
    const resident = this.data.getResidentById(user.id);
    return this.data.getRequestsByResidentId(resident?.residentId ?? '');
  }

  // Computed filtered and sorted requests
  filteredRequests = computed(() => {
    let filtered = [...this.allRequests];

    // Filter by status
    if (this.statusFilter() !== 'all') {
      filtered = filtered.filter(r => r.status === this.statusFilter());
    }

    // Filter by search query
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      filtered = filtered.filter(r =>
        r.type.toLowerCase().includes(query) ||
        r.purpose.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy()) {
        case 'date':
          // Simple date comparison (in real app, parse dates properly)
          comparison = a.date.localeCompare(b.date);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return this.sortOrder() === 'asc' ? comparison : -comparison;
    });

    return filtered;
  });

  // Statistics
  stats = computed(() => {
    const requests = this.allRequests;
    return {
      total: requests.length,
      approved: requests.filter(r => r.status === 'Approved').length,
      pending: requests.filter(r => r.status === 'Pending').length,
      forReview: requests.filter(r => r.status === 'For Review').length,
      rejected: requests.filter(r => r.status === 'Rejected').length,
    };
  });

  // Methods
  setStatusFilter(status: string) {
    this.statusFilter.set(status);
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  setSort(field: 'date' | 'type' | 'status') {
    if (this.sortBy() === field) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortOrder.set('desc');
    }
  }

  getStatusBadgeClass(status: string): string {
    if (status === 'Approved') return 'badge--success';
    if (status === 'Pending' || status === 'For Review' || status === 'Rejected') return 'badge--warning';
    return '';
  }

  getStatusIcon(status: string): string {
    if (status === 'Approved') return '✓';
    if (status === 'Pending') return '⏳';
    if (status === 'For Review') return '👁';
    if (status === 'Rejected') return '✗';
    return '📄';
  }
}
