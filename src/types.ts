export interface Farm {
  id: string;
  ownerId: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  size: number;
  cropType: string;
  createdAt: any;
}

export interface SensorReading {
  id: string;
  farmId: string;
  timestamp: any;
  moisture: number;
  temperature: number;
  humidity: number;
}

export interface AIReport {
  id: string;
  farmId: string;
  imageUrl: string;
  findings: string;
  status: 'pending' | 'completed' | 'error';
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'farmer' | 'expert' | 'admin';
}
