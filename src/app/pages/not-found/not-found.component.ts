import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
})
export class NotFoundComponent {
  constructor(
    private location: Location,
    private router: Router,
  ) {}

  goBack(): void {
    // If user opened the 404 page directly, there may be no useful history entry.
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigateByUrl('/login');
  }
}
