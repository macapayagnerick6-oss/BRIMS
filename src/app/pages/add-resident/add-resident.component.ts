import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService, Resident } from '../../services/data.service';

@Component({
  selector: 'app-add-resident',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-resident.component.html',
  styleUrls: ['./add-resident.component.scss'],
})
export class AddResidentComponent {
  constructor(
    private data: DataService,
    private router: Router
  ) {}

  resident: Partial<Resident> & { firstName?: string; middleName?: string; lastName?: string } = {
    firstName: '',
    middleName: '',
    lastName: '',
    age: undefined,
    gender: '',
    purok: '',
    birthdate: '',
    placeOfBirth: '',
    birthCertificateNumber: '',
    bloodType: '',
    civilStatus: '',
    nationality: '',
    contact: '',
    email: '',
    password: '',
    address: '',
  };

  submitted = false;
  error = '';

  /** Resolve residents list URL so "Back to Residents" works from both admin and staff. */
  get residentsListUrl(): string {
    const base = this.router.url.startsWith('/admin') ? '/admin' : '/staff';
    return `${base}/residents`;
  }

  submit() {
    // Validate required fields
    if (!this.resident.firstName?.trim() || !this.resident.lastName?.trim() || !this.resident.age || !this.resident.gender || !this.resident.purok) {
      this.error = 'Please fill in all required fields (First name, Last name, Age, Gender, Purok)';
      return;
    }
    if (!this.resident.email || !this.resident.password) {
      this.error = 'Please fill in login credentials (Email and Password) for resident portal access.';
      return;
    }

    // Generate resident ID
    const existingIds = this.data.residents.map(r => {
      const match = r.residentId.match(/BRGY-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 1000;
    const nextIdNum = maxId + 1;
    const residentId = `BRGY-${nextIdNum}`;
    const nextId = (this.data.residents.length + 1).toString();

    // Build full name from first, optional middle, and last name
    const fullName = [this.resident.firstName!.trim(), this.resident.middleName?.trim(), this.resident.lastName!.trim()]
      .filter(Boolean)
      .join(' ');

    // Create new resident
    const newResident: Resident = {
      id: nextId,
      residentId: residentId,
      name: fullName,
      age: this.resident.age!,
      gender: this.resident.gender!,
      purok: this.resident.purok!,
      birthdate: this.resident.birthdate || undefined,
      placeOfBirth: this.resident.placeOfBirth || undefined,
      birthCertificateNumber: this.resident.birthCertificateNumber || undefined,
      bloodType: this.resident.bloodType || undefined,
      civilStatus: this.resident.civilStatus || undefined,
      nationality: this.resident.nationality || undefined,
      contact: this.resident.contact || undefined,
      email: this.resident.email || undefined,
      password: this.resident.password || undefined,
      address: this.resident.address || undefined,
    };

    // Add to data service
    this.data.addResident(newResident);
    
    this.submitted = true;
    this.error = '';

    // Redirect to residents list after 1.5 seconds
    setTimeout(() => {
      const isAdminPath = this.router.url.startsWith('/admin');
      const base = isAdminPath ? '/admin' : '/staff';
      this.router.navigate([base, 'residents']);
    }, 1500);
  }

  reset() {
    this.resident = {
      firstName: '',
      middleName: '',
      lastName: '',
      age: undefined,
      gender: '',
      purok: '',
      birthdate: '',
      placeOfBirth: '',
      birthCertificateNumber: '',
      bloodType: '',
      civilStatus: '',
      nationality: '',
      contact: '',
      email: '',
      password: '',
      address: '',
    };
    this.submitted = false;
    this.error = '';
  }
}
