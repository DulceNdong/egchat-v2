import type { MapCoord } from '../../data/mitaxiPlaces';

export interface MiTaxiMapProps {
  userLocation: MapCoord | null;
  destLocation: MapCoord | null;
  driverLocation?: MapCoord | null;
  showNearby?: boolean;
  accentColor?: string;
}
