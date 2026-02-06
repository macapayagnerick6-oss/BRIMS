import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DataService } from '../../services/data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit, OnDestroy {
  activeTab: string = 'residents';

  private subscriptions = new Subscription();

  // Chart data objects are kept as fields so they
  // don't get recreated on every change detection cycle.
  public residentPurokBarData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [],
  };

  public ageGroupLineData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [],
  };

  public householdPurokBarData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [],
  };

  public requestTypeBarData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [],
  };

  constructor(public data: DataService) {}

  ngOnInit(): void {
    // Initial build in case data is already loaded
    this.updateResidentCharts();
    this.updateHouseholdCharts();
    this.updateRequestCharts();

    // Rebuild chart data only when underlying data actually changes
    this.subscriptions.add(
      this.data.residentsObservable.subscribe(() => {
        this.updateResidentCharts();
      }),
    );

    this.subscriptions.add(
      this.data.householdsObservable.subscribe(() => {
        this.updateHouseholdCharts();
      }),
    );

    this.subscriptions.add(
      this.data.requestsObservable.subscribe(() => {
        this.updateRequestCharts();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Shared chart options
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#4b5563',
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.25)',
        },
        ticks: {
          precision: 0,
        },
      },
    },
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#4b5563',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.25)',
        },
        ticks: {
          precision: 0,
        },
      },
    },
  };

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  // Resident Statistics
  getResidentStats() {
    const residents = this.data.residents;
    const total = residents.length;
    const male = residents.filter(r => r.gender === 'Male').length;
    const female = residents.filter(r => r.gender === 'Female').length;
    const senior = residents.filter(r => r.age >= 60).length;
    const adult = residents.filter(r => r.age >= 18 && r.age < 60).length;
    const minor = residents.filter(r => r.age < 18).length;

    // Purok distribution
    const purokCounts: { [key: string]: number } = {};
    residents.forEach(r => {
      purokCounts[r.purok] = (purokCounts[r.purok] || 0) + 1;
    });

    return {
      total,
      male,
      female,
      senior,
      adult,
      minor,
      purokCounts
    };
  }

  getResidentPuroks() {
    const stats = this.getResidentStats();
    return Object.keys(stats.purokCounts).map(purok => ({
      name: purok,
      count: stats.purokCounts[purok],
      percentage: (stats.purokCounts[purok] / stats.total * 100).toFixed(1)
    }));
  }

  // Household Statistics
  getHouseholdStats() {
    const households = this.data.households;
    const total = households.length;
    const totalMembers = households.reduce((sum, h) => sum + h.members.length, 0);
    const avgMembers = total > 0 ? (totalMembers / total).toFixed(1) : 0;

    // Purok distribution
    const purokCounts: { [key: string]: number } = {};
    households.forEach(h => {
      purokCounts[h.purok] = (purokCounts[h.purok] || 0) + 1;
    });

    return {
      total,
      totalMembers,
      avgMembers,
      purokCounts
    };
  }

  getHouseholdPuroks() {
    const stats = this.getHouseholdStats();
    return Object.keys(stats.purokCounts).map(purok => ({
      name: purok,
      count: stats.purokCounts[purok],
      percentage: (stats.purokCounts[purok] / stats.total * 100).toFixed(1)
    }));
  }

  // Certificate Request Statistics
  getRequestStats() {
    const requests = this.data.requests;
    const total = requests.length;
    const approved = requests.filter(r => r.status === 'Approved').length;
    const pending = requests.filter(r => r.status === 'Pending').length;
    const forReview = requests.filter(r => r.status === 'For Review').length;

    // Type distribution
    const typeCounts: { [key: string]: number } = {};
    requests.forEach(r => {
      typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
    });

    return {
      total,
      approved,
      pending,
      forReview,
      typeCounts
    };
  }

  getRequestTypes() {
    const stats = this.getRequestStats();
    return Object.keys(stats.typeCounts).map(type => ({
      name: type,
      count: stats.typeCounts[type],
      percentage: (stats.typeCounts[type] / stats.total * 100).toFixed(1)
    }));
  }

  // Build / refresh chart data for residents tab
  private updateResidentCharts(): void {
    const puroks = this.getResidentPuroks();
    this.residentPurokBarData = {
      labels: puroks.map(p => p.name),
      datasets: [
        {
          data: puroks.map(p => p.count),
          label: 'Residents',
          backgroundColor: '#3b82f6',
          borderRadius: 6,
        },
      ],
    };

    const stats = this.getResidentStats();
    const labels = ['Minors (<18)', 'Adults (18-59)', 'Senior Citizens (60+)'];
    const values = [stats.minor, stats.adult, stats.senior];

    this.ageGroupLineData = {
      labels,
      datasets: [
        {
          data: values,
          label: 'Age Groups',
          fill: false,
          tension: 0.3,
          borderColor: '#6366f1',
          backgroundColor: '#6366f1',
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#6366f1',
          pointRadius: 4,
        },
      ],
    };
  }

  // Build / refresh chart data for households tab
  private updateHouseholdCharts(): void {
    const puroks = this.getHouseholdPuroks();
    this.householdPurokBarData = {
      labels: puroks.map(p => p.name),
      datasets: [
        {
          data: puroks.map(p => p.count),
          label: 'Households',
          backgroundColor: '#22c55e',
          borderRadius: 6,
        },
      ],
    };
  }

  // Build / refresh chart data for requests tab
  private updateRequestCharts(): void {
    const types = this.getRequestTypes();
    this.requestTypeBarData = {
      labels: types.map(t => t.name),
      datasets: [
        {
          data: types.map(t => t.count),
          label: 'Requests',
          backgroundColor: '#f97316',
          borderRadius: 6,
        },
      ],
    };
  }

  getDemographicPuroks() {
    const residentStats = this.getResidentStats();
    const householdStats = this.getHouseholdStats();
    const puroks = new Set([...Object.keys(residentStats.purokCounts), ...Object.keys(householdStats.purokCounts)]);
    
    return Array.from(puroks).map(purok => ({
      name: purok,
      residents: residentStats.purokCounts[purok] || 0,
      households: householdStats.purokCounts[purok] || 0,
      avgMembers: householdStats.purokCounts[purok] 
        ? ((residentStats.purokCounts[purok] || 0) / householdStats.purokCounts[purok]).toFixed(1)
        : '-'
    }));
  }
}
