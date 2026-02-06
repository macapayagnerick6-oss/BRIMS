import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-residents-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './residents-list.component.html',
  styleUrls: ['./residents-list.component.scss'],
})
export class ResidentsListComponent {
  constructor(public data: DataService) {}
  
  search = '';
  gender = '';
  age = '';
  purok = '';

  get filteredResidents() {
    let result = [...this.data.residents];

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
}
