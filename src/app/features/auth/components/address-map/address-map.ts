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

@Component({
  selector: 'app-address-map',
  imports: [],
  templateUrl: './address-map.html',
  styleUrl: './address-map.css',
})
export class AddressMap implements AfterViewInit, OnChanges {
  @Input() addressQuery = '';
  @Output() addressSelected = new EventEmitter<string>();

  private map!: L.Map;
  private marker!: L.Marker;
  private searchTimeout!: ReturnType<typeof setTimeout>;
  private mapReady = false;

  ngAfterViewInit(): void {
    const defaultLocation: L.LatLngExpression = [-12.0464, -77.0428];

    const markerIcon = L.icon({
      iconUrl: '/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    this.map = L.map('map').setView(defaultLocation, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.marker = L.marker(defaultLocation, { icon: markerIcon }).addTo(this.map);

    this.mapReady = true;

    this.map.on('click', async (event: L.LeafletMouseEvent) => {
      const lat = event.latlng.lat;
      const lng = event.latlng.lng;

      this.marker.setLatLng([lat, lng]);
      this.map.setView([lat, lng], 16);

      const address = await this.reverseGeocode(lat, lng);

      if (address) {
        this.addressSelected.emit(address);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['addressQuery'] || !this.mapReady) {
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

      this.map.setView([lat, lon], 16);
      this.marker.setLatLng([lat, lon]);
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
}
