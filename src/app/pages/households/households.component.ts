import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService, Household } from '../../services/data.service';

@Component({
  selector: 'app-households',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './households.component.html',
  styleUrls: ['./households.component.scss'],
})
export class HouseholdsComponent {
  constructor(public data: DataService) {}
  
  households = this.data.households;
  search = '';
  purok = '';

  get filteredHouseholds(): Household[] {
    let result = [...this.households];
    
    if (this.search) {
      const searchLower = this.search.toLowerCase();
      result = result.filter(h => 
        h.householdId.toLowerCase().includes(searchLower) ||
        h.address.toLowerCase().includes(searchLower) ||
        this.getHeadOfHousehold(h).toLowerCase().includes(searchLower)
      );
    }
    
    if (this.purok) {
      result = result.filter(h => h.purok === this.purok);
    }
    
    return result;
  }

  getHeadOfHousehold(household: Household): string {
    const head = household.members.find(m => m.relationship === 'Head');
    return head ? head.name : household.members[0]?.name || 'N/A';
  }
}
