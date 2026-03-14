export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type RegistrationStatus = 'confirmed' | 'cancelled';
export type EventCategory = 'Sports' | 'Arts' | 'Academic' | 'Tech' | 'Cultural' | 'Social';

export interface User {
  id: number;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  isActive?: boolean;
  latestRegistrationDate?: string | null;
  avatar: string | null;
  bio: string | null;
  phone: string | null;
  joinedDate: string; // ISO date string
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string; // ISO date string
  time: string; // HH:MM
  location: string;
  capacity: number;
  registeredCount: number;
  createdBy: number; // admin user id
  createdAt: string;
  isActive: boolean;
}

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  registeredAt: string; // ISO date string
  status: RegistrationStatus;
}

export interface EventFormData {
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  time: string;
  location: string;
  capacity: number;
}
