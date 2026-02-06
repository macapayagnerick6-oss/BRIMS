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

  resident: Partial<Resident> = {
    name: '',
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

  submit() {
    // Validate required fields
    if (!this.resident.name || !this.resident.age || !this.resident.gender || !this.resident.purok) {
      this.error = 'Please fill in all required fields (Name, Age, Gender, Purok)';
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

    // Create new resident
    const newResident: Resident = {
      id: nextId,
      residentId: residentId,
      name: this.resident.name!,
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
      this.router.navigate(['/staff/residents']);
    }, 1500);
  }

  reset() {
    this.resident = {
      name: '',
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
