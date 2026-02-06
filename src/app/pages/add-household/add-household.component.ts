import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService, Household, HouseholdMember, Resident } from '../../services/data.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-add-household',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-household.component.html',
  styleUrls: ['./add-household.component.scss'],
})
export class AddHouseholdComponent implements AfterViewInit, OnDestroy {
  constructor(
    private data: DataService,
    private router: Router
  ) {}

  household: Partial<Household> = {
    address: '',
    purok: '',
    headId: '',
  };

  // Map / location state
  latitude: number | null = null;
  longitude: number | null = null;

  private map: L.Map | null = null;
  private marker: L.CircleMarker | null = null;

  // Default center – align with barangay center / household map
  private readonly defaultCenter: L.LatLngExpression = [8.574, 124.776];
  private readonly defaultZoom = 17;

  selectedHeadResidentId: string = '';
  additionalMembers: { residentId: string; relationship: string }[] = [];
  submitted = false;
  error = '';

  readonly RELATIONSHIP_OPTIONS = ['Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Grandfather', 'Grandmother', 'Other'];

  get availableResidents(): Resident[] {
    // Get residents who are not already in a household
    const residentsInHouseholds = new Set<string>();
    this.data.households.forEach(h => {
      h.members.forEach(m => residentsInHouseholds.add(m.residentId));
    });
    return this.data.residents.filter(r => !residentsInHouseholds.has(r.residentId));
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.marker = null;
  }

  /** Residents available for additional members: not head, not already chosen in another row (row.residentId = internal id) */
  getAvailableResidentsForMember(rowIndex: number): Resident[] {
    const headId = this.selectedHeadResidentId;
    return this.availableResidents.filter(
      r => r.id !== headId && !this.additionalMembers.some((m, j) => j !== rowIndex && m.residentId === r.id)
    );
  }

  addMemberRow() {
    this.additionalMembers.push({ residentId: '', relationship: '' });
  }

  removeMemberRow(index: number) {
    this.additionalMembers.splice(index, 1);
  }

  submit() {
    // Validate required fields
    if (!this.household.address || !this.household.purok || !this.selectedHeadResidentId) {
      this.error = 'Please fill in all required fields (Address, Purok, Head of Household)';
      return;
    }

    // Find the selected head resident
    const headResident = this.data.residents.find(r => r.id === this.selectedHeadResidentId);
    if (!headResident) {
      this.error = 'Selected head of household not found';
      return;
    }

    // Generate household ID
    const existingIds = this.data.households.map(h => {
      const match = h.householdId.match(/HH-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    const nextIdNum = maxId + 1;
    const householdId = `HH-${String(nextIdNum).padStart(3, '0')}`;
    const nextId = `h${this.data.households.length + 1}`;

    // Create head member
    const headMember: HouseholdMember = {
      residentId: headResident.residentId,
      name: headResident.name,
      age: headResident.age,
      gender: headResident.gender,
      relationship: 'Head',
      birthdate: headResident.birthdate,
      civilStatus: headResident.civilStatus,
    };

    // Build additional members (row.residentId holds internal id from dropdown)
    const members: HouseholdMember[] = [headMember];
    for (const row of this.additionalMembers) {
      if (!row.residentId || !row.relationship) continue;
      const resident = this.data.getResidentById(row.residentId);
      if (resident) {
        members.push({
          residentId: resident.residentId,
          name: resident.name,
          age: resident.age,
          gender: resident.gender,
          relationship: row.relationship,
          birthdate: resident.birthdate,
          civilStatus: resident.civilStatus,
        });
      }
    }

    // Create new household
    const newHousehold: Household = {
      id: nextId,
      householdId: householdId,
      headId: this.selectedHeadResidentId,
      address: this.household.address!,
      purok: this.household.purok!,
      // Coordinates are optional; only set if user clicked on the map
      latitude: this.latitude ?? null,
      longitude: this.longitude ?? null,
      members,
    };

    // Add to data service
    this.data.addHousehold(newHousehold);
    
    this.submitted = true;
    this.error = '';

    // Redirect to households list after 1.5 seconds
    setTimeout(() => {
      this.router.navigate(['/staff/households']);
    }, 1500);
  }

  reset() {
    this.household = {
      address: '',
      purok: '',
      headId: '',
    };
    this.selectedHeadResidentId = '';
    this.additionalMembers = [];
    this.submitted = false;
    this.error = '';
    this.clearLocation();
  }

  /**
   * Initialize Leaflet map for selecting household location
   */
  private initMap(): void {
    if (this.map) return;

    // Match container id from template
    this.map = L.map('add-household-map', {
      center: this.defaultCenter,
      zoom: this.defaultZoom,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => this.onMapClick(e));

    // Ensure proper sizing after initial render
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 0);
  }

  private onMapClick(e: L.LeafletMouseEvent): void {
    this.latitude = e.latlng.lat;
    this.longitude = e.latlng.lng;
    this.updateMarker();
  }

  private updateMarker(): void {
    if (!this.map || this.latitude == null || this.longitude == null) return;

    const position: L.LatLngExpression = [this.latitude, this.longitude];

    if (this.marker) {
      this.marker.setLatLng(position);
    } else {
      this.marker = L.circleMarker(position, {
        radius: 8,
        weight: 2,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.9,
      }).addTo(this.map);
    }

    this.map.setView(position, this.defaultZoom);
  }

  clearLocation(): void {
    this.latitude = null;
    this.longitude = null;
    if (this.map && this.marker) {
      this.map.removeLayer(this.marker);
    }
    this.marker = null;
  }
}
