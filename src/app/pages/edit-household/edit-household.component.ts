import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataService, Household, HouseholdMember, Resident } from '../../services/data.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-edit-household',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './edit-household.component.html',
  styleUrls: ['./edit-household.component.scss'],
})
export class EditHouseholdComponent implements OnInit, AfterViewInit, OnDestroy {
  householdId: string = '';
  household: Household | undefined;
  address = '';
  purok = '';
  selectedHeadResidentId: string = '';
  additionalMembers: { residentId: string; relationship: string }[] = [];
  submitted = false;
  error = '';

  // Map / location state
  latitude: number | null = null;
  longitude: number | null = null;

  private map: L.Map | null = null;
  private marker: L.CircleMarker | null = null;

  // Default center – align with barangay center / household map
  private readonly defaultCenter: L.LatLngExpression = [8.574, 124.776];
  private readonly defaultZoom = 17;

  readonly RELATIONSHIP_OPTIONS = ['Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Grandfather', 'Grandmother', 'Other'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private data: DataService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.householdId = id;
        this.household = this.data.getHouseholdById(id);
        if (this.household) {
          this.address = this.household.address;
          this.purok = this.household.purok;
          this.latitude = this.household.latitude ?? null;
          this.longitude = this.household.longitude ?? null;
          const head = this.household.members.find(m => m.relationship === 'Head');
          if (head) {
            const headResident = this.data.getResidentByResidentId(head.residentId);
            this.selectedHeadResidentId = headResident?.id ?? '';
          }
          const others = this.household.members.filter(m => m.relationship !== 'Head');
          this.additionalMembers = others.map(m => {
            const r = this.data.getResidentByResidentId(m.residentId);
            return { residentId: r?.id ?? '', relationship: m.relationship };
          });
          if (this.additionalMembers.length === 0) {
            this.additionalMembers = [{ residentId: '', relationship: '' }];
          }
        }
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    // If household already had coordinates, show marker
    this.updateMarker();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.marker = null;
  }

  /** Residents not in other households (so they can be assigned), or already in this household */
  get availableResidents(): Resident[] {
    return this.data.residents.filter(r => {
      const inOtherHousehold = this.data.households.some(
        h => h.id !== this.householdId && h.members.some(m => m.residentId === r.residentId)
      );
      return !inOtherHousehold;
    });
  }

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
    if (!this.household) return;
    if (!this.address?.trim() || !this.purok || !this.selectedHeadResidentId) {
      this.error = 'Please fill in all required fields (Address, Purok, Head of Household)';
      return;
    }

    const headResident = this.data.getResidentById(this.selectedHeadResidentId);
    if (!headResident) {
      this.error = 'Selected head of household not found';
      return;
    }

    const headMember: HouseholdMember = {
      residentId: headResident.residentId,
      name: headResident.name,
      age: headResident.age,
      gender: headResident.gender,
      relationship: 'Head',
      birthdate: headResident.birthdate,
      civilStatus: headResident.civilStatus,
    };

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

    this.data.updateHousehold(this.householdId, {
      address: this.address.trim(),
      purok: this.purok,
      headId: this.selectedHeadResidentId,
      members,
      // Persist selected coordinates (if any)
      latitude: this.latitude ?? null,
      longitude: this.longitude ?? null,
    });

    this.submitted = true;
    this.error = '';
    setTimeout(() => {
      this.router.navigate(['/staff/households', this.householdId]);
    }, 1500);
  }

  reset() {
    if (this.household) {
      this.address = this.household.address;
      this.purok = this.household.purok;
      const head = this.household.members.find(m => m.relationship === 'Head');
      if (head) {
        const headResident = this.data.getResidentByResidentId(head.residentId);
        this.selectedHeadResidentId = headResident?.id ?? '';
      }
      const others = this.household.members.filter(m => m.relationship !== 'Head');
      this.additionalMembers = others.map(m => {
        const r = this.data.getResidentByResidentId(m.residentId);
        return { residentId: r?.id ?? '', relationship: m.relationship };
      });
      if (this.additionalMembers.length === 0) {
        this.additionalMembers = [{ residentId: '', relationship: '' }];
      }
    }
    this.submitted = false;
    this.error = '';

    // Reset coordinates back to stored household values
    if (this.household) {
      this.latitude = this.household.latitude ?? null;
      this.longitude = this.household.longitude ?? null;
    } else {
      this.latitude = null;
      this.longitude = null;
    }
    this.updateMarker();
  }

  /**
   * Initialize Leaflet map for selecting household location
   */
  private initMap(): void {
    if (this.map) return;

    this.map = L.map('edit-household-map', {
      center: this.defaultCenter,
      zoom: this.defaultZoom,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => this.onMapClick(e));

    setTimeout(() => {
      this.map?.invalidateSize();
      // Re-center to existing coordinates if present
      this.updateMarker();
    }, 0);
  }

  private onMapClick(e: L.LeafletMouseEvent): void {
    this.latitude = e.latlng.lat;
    this.longitude = e.latlng.lng;
    this.updateMarker();
  }

  private updateMarker(): void {
    if (!this.map) return;

    if (this.latitude == null || this.longitude == null) {
      // No coordinates: remove marker and reset view
      if (this.marker) {
        this.map.removeLayer(this.marker);
        this.marker = null;
      }
      this.map.setView(this.defaultCenter, this.defaultZoom);
      return;
    }

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
