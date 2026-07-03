import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';

import * as L from 'leaflet';

export interface AddressMapSelection {
  address: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-address-map',
  imports: [],
  templateUrl: './address-map.html',
  styleUrl: './address-map.css',
})
export class AddressMap implements AfterViewInit, OnChanges {
  private static nextMapId = 0;
  private readonly defaultLocation: L.LatLngExpression = [-12.0464, -77.0428];

  @Input() addressQuery = '';
  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;
  @Input() mapId = `address-map-${AddressMap.nextMapId++}`;

  @Output() addressSelected = new EventEmitter<AddressMapSelection>();

  private map!: L.Map;
  private marker!: L.Marker;
  private searchTimeout!: ReturnType<typeof setTimeout>;
  private mapReady = false;

  ngAfterViewInit(): void {
    const initialLocation: L.LatLngExpression = this.hasCoordinates
      ? [this.latitude!, this.longitude!]
      : this.defaultLocation;

    const markerIcon = L.icon({
      iconUrl: '/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    this.map = L.map(this.mapId).setView(initialLocation, this.hasCoordinates ? 16 : 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.marker = L.marker(initialLocation, { icon: markerIcon }).addTo(this.map);

    this.mapReady = true;

    this.map.on('click', async (event: L.LeafletMouseEvent) => {
      const lat = event.latlng.lat;
      const lng = event.latlng.lng;

      this.marker.setLatLng([lat, lng]);
      this.map.setView([lat, lng], 16);

      const address = await this.reverseGeocode(lat, lng);

      if (address) {
        this.addressSelected.emit({ address, latitude: lat, longitude: lng });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mapReady) {
      return;
    }

    if (changes['latitude'] || changes['longitude']) {
      this.syncMarkerWithCoordinates();
    }

    if (!changes['addressQuery']) {
      return;
    }

    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchAddress();
    }, 800);
  }

  private async searchAddress(): Promise<void> {
    const query = this.addressQuery.trim();

    if (query.length < 4) {
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
      );

      const results = await response.json();

      if (!results.length) {
        return;
      }

      const lat = Number(results[0].lat);
      const lon = Number(results[0].lon);
      const address = results[0].display_name || query;

      this.map.setView([lat, lon], 16);
      this.marker.setLatLng([lat, lon]);
      this.addressSelected.emit({ address, latitude: lat, longitude: lon });
    } catch (error) {
      console.error('Error buscando dirección:', error);
    }
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );

      const data = await response.json();

      return data.display_name || '';
    } catch (error) {
      console.error('Error obteniendo dirección:', error);
      return '';
    }
  }

  private get hasCoordinates(): boolean {
    return Number.isFinite(this.latitude) && Number.isFinite(this.longitude);
  }

  private syncMarkerWithCoordinates(): void {
    if (!this.hasCoordinates) {
      this.marker.setLatLng(this.defaultLocation);
      this.map.setView(this.defaultLocation, 13);
      return;
    }

    const coordinates: L.LatLngExpression = [this.latitude!, this.longitude!];
    this.marker.setLatLng(coordinates);
    this.map.setView(coordinates, 16);
  }
}
