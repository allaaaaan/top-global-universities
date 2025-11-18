export interface Location {
  city: string;
  country: string;
}

export interface University {
  id: string;
  rank: number;
  name: string;
  shortName: string;
  location: Location;
  description: string;
  majors: string[];
}

