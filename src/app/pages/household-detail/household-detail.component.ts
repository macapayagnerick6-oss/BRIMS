import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService, Household } from '../../services/data.service';

@Component({
  selector: 'app-household-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './household-detail.component.html',
  styleUrls: ['./household-detail.component.scss'],
})
export class HouseholdDetailComponent implements OnInit {
  household: Household | undefined;

  constructor(
    private route: ActivatedRoute,
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
}
