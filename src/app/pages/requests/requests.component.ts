import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './requests.component.html',
  styles: ['.muted { color: var(--color-text-muted); } .table { margin-top: 1rem; }'],
})
export class RequestsComponent {
  constructor(public data: DataService) {}
  requests = this.data.requests;
}
