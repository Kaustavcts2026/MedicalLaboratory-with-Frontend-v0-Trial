import { Component, OnInit, OnDestroy, AfterViewInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import * as L from 'leaflet';

// Fix for Leaflet default icon path in bundled apps
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:      [25, 41],
  iconAnchor:    [12, 41],
  popupAnchor:   [1, -34],
  shadowSize:    [41, 41],
});

export interface MapPickerResult {
  address: string;
  lat: number;
  lng: number;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

@Component({
  selector: 'app-address-map-picker',
  templateUrl: './address-map-picker.component.html',
  styleUrls: ['./address-map-picker.component.scss']
})
export class AddressMapPickerComponent implements OnInit, AfterViewInit, OnDestroy {
  private map!: L.Map;
  private marker?: L.Marker;

  searchQuery = '';
  searchResults: NominatimResult[] = [];
  selectedAddress = '';
  isSearching = false;

  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<AddressMapPickerComponent>,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public initialAddress: string
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 3) { this.searchResults = []; return of([]); }
        this.isSearching = true;
        return this.http.get<NominatimResult[]>(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        ).pipe(catchError(() => of([])));
      })
    ).subscribe(results => {
      this.isSearching = false;
      this.searchResults = results as NominatimResult[];
    });
  }

  ngAfterViewInit(): void {
    // Small delay so the dialog finishes rendering before Leaflet measures the container
    setTimeout(() => this.initMap(), 150);
  }

  private initMap(): void {
    this.map = L.map('map-container', { zoomControl: true }).setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.placeMarker(e.latlng.lat, e.latlng.lng);
      this.reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
  }

  onSearchInput(): void {
    this.search$.next(this.searchQuery);
  }

  selectResult(r: NominatimResult): void {
    this.searchResults = [];
    this.searchQuery = r.display_name;
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    this.placeMarker(lat, lng);
    this.selectedAddress = r.display_name;
    this.map.setView([lat, lng], 15);
  }

  private placeMarker(lat: number, lng: number): void {
    if (this.marker) this.map.removeLayer(this.marker);
    this.marker = L.marker([lat, lng]).addTo(this.map);
  }

  private reverseGeocode(lat: number, lng: number): void {
    this.http.get<{ display_name: string }>(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en' } }
    ).pipe(catchError(() => of(null))).subscribe(res => {
      if (res) {
        this.selectedAddress = res.display_name;
        this.searchQuery = res.display_name;
      }
    });
  }

  confirm(): void {
    if (this.selectedAddress) {
      this.dialogRef.close(this.selectedAddress);
    }
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) this.map.remove();
  }
}
