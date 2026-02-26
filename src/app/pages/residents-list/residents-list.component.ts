import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService, Resident } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-residents-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './residents-list.component.html',
  styleUrls: ['./residents-list.component.scss'],
})
export class ResidentsListComponent {
  constructor(public data: DataService, public auth: AuthService) {}
  
  search = '';
  gender = '';
  age = '';
  purok = '';

  get filteredResidents() {
    // Start from active (non-archived) residents only
    let result = [...this.data.getActiveResidents()];

    // Filter by search (name or residentId)
    if (this.search) {
      const searchLower = this.search.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(searchLower) ||
        r.residentId.toLowerCase().includes(searchLower)
      );
    }

    // Filter by gender
    if (this.gender) {
      result = result.filter(r => r.gender === this.gender);
    }

    // Filter by age range
    if (this.age) {
      if (this.age === '0-17') {
        result = result.filter(r => r.age >= 0 && r.age <= 17);
      } else if (this.age === '18-59') {
        result = result.filter(r => r.age >= 18 && r.age <= 59);
      } else if (this.age === '60+') {
        result = result.filter(r => r.age >= 60);
      }
    }

    // Filter by purok
    if (this.purok) {
      result = result.filter(r => r.purok === this.purok);
    }

    return result;
  }

  /** Only admins can archive residents. */
  get canArchiveResidents(): boolean {
    return this.auth.currentUser?.role === 'admin';
  }

  async archiveResident(resident: Resident): Promise<void> {
    if (!this.canArchiveResidents) return;
    const result = await Swal.fire({
      title: 'Archive resident?',
      text: `Archive resident "${resident.name}" (${resident.residentId})? They will move to Archives and be hidden from the main list.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, archive',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    this.data.archiveResident(resident.id, 'Archived by admin from Residents list');
    await Swal.fire({
      title: 'Archived',
      text: 'The resident has been moved to Archives.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    });
  }
}
