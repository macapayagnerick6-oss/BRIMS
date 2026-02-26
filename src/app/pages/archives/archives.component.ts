import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService, Resident, Household, CertificateRequest, SystemUser } from '../../services/data.service';

@Component({
  selector: 'app-archives',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './archives.component.html',
  styleUrls: ['./archives.component.scss'],
})
export class ArchivesComponent {
  constructor(public data: DataService) {}

  activeTab: 'residents' | 'households' | 'requests' | 'users' = 'residents';

  // Filters
  residentSearch = '';
  residentPurok = '';
  residentArchivedFrom = '';
  residentArchivedTo = '';

  householdSearch = '';
  householdPurok = '';

  requestSearch = '';
  requestStatus = '';
  requestArchivedFrom = '';
  requestArchivedTo = '';

  userSearch = '';
  userRole = '';

  setActiveTab(tab: 'residents' | 'households' | 'requests' | 'users') {
    this.activeTab = tab;
  }

  // --- Residents ---

  get archivedResidents(): Resident[] {
    let list = this.data.getArchivedResidents();

    if (this.residentSearch) {
      const s = this.residentSearch.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(s) ||
        r.residentId.toLowerCase().includes(s) ||
        (r.purok?.toLowerCase().includes(s) ?? false),
      );
    }

    if (this.residentPurok) {
      list = list.filter(r => r.purok === this.residentPurok);
    }

    if (this.residentArchivedFrom) {
      const from = new Date(this.residentArchivedFrom).getTime();
      list = list.filter(r => r.archivedAt && new Date(r.archivedAt).getTime() >= from);
    }

    if (this.residentArchivedTo) {
      const to = new Date(this.residentArchivedTo).getTime();
      list = list.filter(r => r.archivedAt && new Date(r.archivedAt).getTime() <= to);
    }

    return list;
  }

  restoreResident(r: Resident): void {
    this.data.unarchiveResident(r.id);
  }

  // --- Households ---

  get archivedHouseholds(): Household[] {
    let list = this.data.getArchivedHouseholds();

    if (this.householdSearch) {
      const s = this.householdSearch.toLowerCase();
      list = list.filter(h =>
        h.householdId.toLowerCase().includes(s) ||
        h.address.toLowerCase().includes(s),
      );
    }

    if (this.householdPurok) {
      list = list.filter(h => h.purok === this.householdPurok);
    }

    return list;
  }

  restoreHousehold(h: Household): void {
    this.data.updateHousehold(h.id, { archived: false, archivedAt: undefined });
  }

  // --- Requests ---

  get archivedRequests(): CertificateRequest[] {
    let list = this.data.getArchivedRequests();

    if (this.requestSearch) {
      const s = this.requestSearch.toLowerCase();
      list = list.filter(r =>
        r.type.toLowerCase().includes(s) ||
        r.purpose.toLowerCase().includes(s) ||
        (r.residentId?.toLowerCase().includes(s) ?? false),
      );
    }

    if (this.requestStatus) {
      list = list.filter(r => r.status === this.requestStatus);
    }

    if (this.requestArchivedFrom) {
      const from = new Date(this.requestArchivedFrom).getTime();
      list = list.filter(r => r.archivedAt && new Date(r.archivedAt).getTime() >= from);
    }

    if (this.requestArchivedTo) {
      const to = new Date(this.requestArchivedTo).getTime();
      list = list.filter(r => r.archivedAt && new Date(r.archivedAt).getTime() <= to);
    }

    return list;
  }

  restoreRequest(r: CertificateRequest): void {
    this.data.unarchiveRequest(r.id);
  }

  // --- Users (staff/admin only in this view) ---

  get archivedUsers(): SystemUser[] {
    let list = this.data.getArchivedUsers().filter(u => {
      const roleLower = u.role.toLowerCase();
      return roleLower === 'admin' || roleLower === 'staff';
    });

    if (this.userSearch) {
      const s = this.userSearch.toLowerCase();
      list = list.filter(u =>
        u.name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s),
      );
    }

    if (this.userRole) {
      list = list.filter(u => u.role === this.userRole);
    }

    return list;
  }

  restoreUser(u: SystemUser): void {
    this.data.unarchiveUser(u.id);
  }
}

