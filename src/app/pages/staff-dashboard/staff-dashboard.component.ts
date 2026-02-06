import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService, CertificateRequest } from '../../services/data.service';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './staff-dashboard.component.html',
  styleUrls: ['./staff-dashboard.component.scss'],
})
export class StaffDashboardComponent {
  constructor(public data: DataService) {}
  
  stats = this.data.getStats();
  
  get recentRequests(): CertificateRequest[] {
    // Get the most recent requests, prioritizing pending and for review
    const sorted = [...this.data.requests].sort((a, b) => {
      // Prioritize by status: For Review > Pending > Approved
      const statusPriority: Record<CertificateRequest['status'], number> = { 
        'For Review': 3, 
        'Pending': 2, 
        'Approved': 1,
        'Rejected': 0
      };
      const priorityDiff = statusPriority[b.status] - statusPriority[a.status];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by date (most recent first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    return sorted.slice(0, 6); // Show up to 6 recent requests
  }
}
