import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService, Household } from '../../services/data.service';
import { Subscription } from 'rxjs';
import { LoadingStateComponent } from '../../shared/loading-state.component';

@Component({
  selector: 'app-households',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingStateComponent],
  templateUrl: './households.component.html',
  styleUrls: ['./households.component.scss'],
})
export class HouseholdsComponent implements OnInit, OnDestroy {
  constructor(public data: DataService) {}
  
  search = '';
  purok = '';
  isLoading = true;
  hasError = false;
  errorMessage = '';
  private subscription?: Subscription;
  private loadingTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    // Check if data is already loaded
    if (this.data.households.length > 0) {
      this.isLoading = false;
    }

    // Set a timeout to detect if data loading takes too long or fails
    this.loadingTimeout = setTimeout(() => {
      if (this.isLoading && this.data.households.length === 0) {
        this.hasError = true;
        this.errorMessage = 'Unable to load households data. Please check your connection and try again.';
        this.isLoading = false;
      }
    }, 10000); // 10 second timeout

    // Subscribe to households data to detect when it's loaded
    this.subscription = this.data.householdsObservable.subscribe({
      next: (households) => {
        if (this.loadingTimeout) {
          clearTimeout(this.loadingTimeout);
        }
        if (households.length > 0 || this.data.households.length > 0) {
          // Small delay to show loading state (makes it feel more responsive)
          setTimeout(() => {
            this.isLoading = false;
            this.hasError = false;
          }, 300);
        }
      },
      error: (error) => {
        if (this.loadingTimeout) {
          clearTimeout(this.loadingTimeout);
        }
        this.hasError = true;
        this.isLoading = false;
        this.errorMessage = error?.message || 'An error occurred while loading households. Please try again later.';
        console.error('Error loading households:', error);
      }
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
  }

  retryLoad(): void {
    this.hasError = false;
    this.errorMessage = '';
    this.isLoading = true;
    // Trigger a reload by checking the data service again
    // The subscription will handle the update
    setTimeout(() => {
      if (this.data.households.length === 0) {
        this.hasError = true;
        this.errorMessage = 'Unable to load households data. Please refresh the page.';
        this.isLoading = false;
      }
    }, 5000);
  }

  get filteredHouseholds(): Household[] {
    // Only show active (non-archived) households in the main list
    let result = [...this.data.getActiveHouseholds()];
    
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