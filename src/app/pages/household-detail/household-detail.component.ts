import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataService, Household } from '../../services/data.service';

@Component({
  selector: 'app-household-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './household-detail.component.html',
  styleUrls: ['./household-detail.component.scss'],
})
export class HouseholdDetailComponent implements OnInit {
  household: Household | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public data: DataService,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.household = this.data.getHouseholdById(id);
      } else {
        this.household = undefined;
      }
    });
  }

  getHeadOfHousehold(): string {
    if (!this.household) return 'N/A';
    const head = this.household.members.find(m => m.relationship === 'Head');
    return head ? head.name : this.household.members[0]?.name || 'N/A';
  }

  getResidentId(residentId: string): string | null {
    const resident = this.data.getResidentByResidentId(residentId);
    return resident?.id || null;
  }

  navigateToEdit(): void {
    if (!this.household?.id) return;
    const isAdminPath = this.router.url.startsWith('/admin');
    const base = isAdminPath ? '/admin' : '/staff';
    this.router.navigate([base, 'households', this.household.id, 'edit']);
  }

  navigateToResident(residentId: string): void {
    const resident = this.data.getResidentByResidentId(residentId);
    if (resident?.id) {
      const isAdminPath = this.router.url.startsWith('/admin');
      const base = isAdminPath ? '/admin' : '/staff';
      this.router.navigate([base, 'residents', resident.id]);
    }
  }

  navigateToHouseholds(): void {
    const isAdminPath = this.router.url.startsWith('/admin');
    const base = isAdminPath ? '/admin' : '/staff';
    this.router.navigate([base, 'households']);
  }
}
