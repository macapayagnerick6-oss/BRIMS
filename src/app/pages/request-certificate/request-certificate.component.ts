import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-request-certificate',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './request-certificate.component.html',
  styleUrls: ['./request-certificate.component.scss'],
})
export class RequestCertificateComponent {
  constructor(
    public data: DataService,
    private auth: AuthService,
  ) {}
  docType = 'Barangay Clearance';
  purpose = '';
  /** Only requests for the current logged-in resident. */
  get requests() {
    const user = this.auth.currentUser;
    if (!user || user.role !== 'resident') return [];
    const resident = this.data.getResidentById(user.id);
    return this.data.getRequestsByResidentId(resident?.residentId ?? '');
  }
  submitted = false;

  submit() {
    this.submitted = true;
    this.purpose = '';
  }
}
