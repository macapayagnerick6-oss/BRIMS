import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { DataService, Household } from '../../services/data.service';

@Component({
  selector: 'app-household-map',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './household-map.component.html',
  styleUrls: ['./household-map.component.scss'],
})
export class HouseholdMapComponent implements OnInit, AfterViewInit, OnDestroy {
  private map: L.Map | null = null;
  private markersLayer: L.LayerGroup | null = null;

  households: Household[] = [];
  missingCoordinatesCount = 0;

  searchTerm = '';
  selectedPurok = '';
  selectedStatusKey = '';
  selectedRiskKey = '';

  get totalHouseholdsCount(): number {
    return this.households.length;
  }

  get mappedHouseholdsCount(): number {
    return this.households.filter(
      (h) => typeof h.latitude === 'number' && typeof h.longitude === 'number'
    ).length;
  }

  get unmappedHouseholdsCount(): number {
    return this.households.filter(
      (h) => typeof h.latitude !== 'number' || typeof h.longitude !== 'number'
    ).length;
  }

  get hasLegend(): boolean {
    return this.statusLegend.length > 0 || this.riskLegend.length > 0;
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.searchTerm ||
      this.selectedPurok ||
      this.selectedStatusKey ||
      this.selectedRiskKey
    );
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedPurok = '';
    this.selectedStatusKey = '';
    this.selectedRiskKey = '';
    this.onFiltersChanged();
  }

  private readonly statusColorMap: Record<string, string> = {
    active: '#16a34a',
    inactive: '#6b7280',
    relocated: '#f97316',
    '4ps': '#2563eb',
    senior: '#f59e0b',
    pwd: '#a855f7',
  };

  private readonly riskColorMap: Record<string, string> = {
    flood_prone: '#ef4444',
    fire_risk: '#f97316',
    normal: '#22c55e',
  };

  // Default center – adjust to your barangay center as needed
  private readonly defaultCenter: L.LatLngExpression = [8.574, 124.776];
  private readonly defaultZoom = 16;

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.data.householdsObservable.subscribe((households) => {
      this.households = households;
      this.updateMarkers();
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.updateMarkers();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap(): void {
    if (this.map) return;

    this.map = L.map('household-map-container', {
      center: this.defaultCenter,
      zoom: this.defaultZoom,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
  }

  private updateMarkers(): void {
    if (!this.map || !this.households) return;

    const visibleHouseholds = this.getFilteredHouseholds();

    if (!this.markersLayer) {
      this.markersLayer = L.layerGroup().addTo(this.map);
    } else {
      this.markersLayer.clearLayers();
    }

    const bounds: L.LatLngExpression[] = [];
    this.missingCoordinatesCount = 0;

    for (const household of visibleHouseholds) {
      const { latitude, longitude } = household;
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        const position: L.LatLngExpression = [latitude, longitude];
        bounds.push(position);

        const { color, fillColor } = this.getMarkerColors(household);
        const marker = L.circleMarker(position, {
          radius: 8,
          weight: 2,
          color,
          fillColor,
          fillOpacity: 0.9,
        });

        marker.bindPopup(this.buildPopupContent(household), {
          autoClose: false,
          closeOnClick: false,
        });

        marker.addTo(this.markersLayer);
        marker.openPopup();
      } else {
        this.missingCoordinatesCount++;
      }
    }

    if (bounds.length && this.map) {
      const latLngBounds = L.latLngBounds(bounds);
      this.map.fitBounds(latLngBounds, { padding: [24, 24] });
    }
  }

  onFiltersChanged(): void {
    this.updateMarkers();
  }

  get purokOptions(): string[] {
    const set = new Set<string>();
    for (const h of this.households) {
      if (h.purok) {
        set.add(h.purok);
      }
    }
    return Array.from(set).sort();
  }

  get statusOptions() {
    const set = new Set<string>();
    for (const h of this.households) {
      if (h.status) {
        set.add(h.status.toLowerCase());
      }
    }
    return Array.from(set).map((key) => ({
      key,
      label: this.formatLabel(key),
    }));
  }

  get riskOptions() {
    const set = new Set<string>();
    for (const h of this.households) {
      if (h.riskLevel) {
        set.add(h.riskLevel.toLowerCase());
      }
    }
    return Array.from(set).map((key) => ({
      key,
      label: this.formatLabel(key),
    }));
  }

  get statusLegend() {
    const counts = new Map<string, number>();
    const households = this.getFilteredHouseholds();

    for (const h of households) {
      if (!h.status) continue;
      const key = h.status.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([key, count]) => ({
      key,
      label: this.formatLabel(key),
      color: this.statusColorMap[key] ?? '#2563eb',
      count,
    }));
  }

  get riskLegend() {
    const counts = new Map<string, number>();
    const households = this.getFilteredHouseholds();

    for (const h of households) {
      if (!h.riskLevel) continue;
      const key = h.riskLevel.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([key, count]) => ({
      key,
      label: this.formatLabel(key),
      color: this.riskColorMap[key] ?? '#22c55e',
      count,
    }));
  }

  get missingHouseholds() {
    return this.getFilteredHouseholds().filter(
      (h) => typeof h.latitude !== 'number' || typeof h.longitude !== 'number'
    );
  }

  private getFilteredHouseholds(): Household[] {
    let result = [...this.households];

    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      result = result.filter((h) => {
        const head =
          h.members.find((m) => m.relationship === 'Head') ?? h.members[0];
        const headName = head ? head.name.toLowerCase() : '';
        return (
          h.householdId.toLowerCase().includes(q) ||
          h.address.toLowerCase().includes(q) ||
          headName.includes(q)
        );
      });
    }

    if (this.selectedPurok) {
      result = result.filter((h) => h.purok === this.selectedPurok);
    }

    if (this.selectedStatusKey) {
      result = result.filter(
        (h) => (h.status || '').toLowerCase() === this.selectedStatusKey
      );
    }

    if (this.selectedRiskKey) {
      result = result.filter(
        (h) => (h.riskLevel || '').toLowerCase() === this.selectedRiskKey
      );
    }

    this.missingCoordinatesCount = result.filter(
      (h) => typeof h.latitude !== 'number' || typeof h.longitude !== 'number'
    ).length;

    return result;
  }

  private getMarkerColors(household: Household): { color: string; fillColor: string } {
    const statusKey = (household.status || '').toLowerCase();
    const riskKey = (household.riskLevel || '').toLowerCase();

    const fillColor = this.statusColorMap[statusKey] ?? '#3b82f6';
    const color = this.riskColorMap[riskKey] ?? '#2563eb';

    return { color, fillColor };
  }

  private formatLabel(key: string): string {
    return key
      .split(/[_\s]+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private buildPopupContent(household: Household): string {
    const head =
      household.members.find((m) => m.relationship === 'Head') ??
      household.members[0];

    const headName = head ? head.name : 'Unknown';
    const status = household.status || 'N/A';
    const purok = household.purok || 'N/A';

    return `
      <div>
        <strong>${household.householdId}</strong><br/>
        Head: ${headName}<br/>
        Address: ${household.address}<br/>
        Purok: ${purok}<br/>
        Status: ${status}
      </div>
    `;
  }
}

