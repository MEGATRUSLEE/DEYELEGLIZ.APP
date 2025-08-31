import type { Timestamp } from "firebase/firestore";

export interface Product {
  id: string;
  name: string;
  price: string;
  imageUrls: string[];
  category: string;
  description: string;
  vendorName: string;
  vendorCountry: string;
  vendorCity: string;
  userId: string;
  isAvailable?: boolean;
  views?: number;
  quantity?: number;
  createdAt?: Timestamp;
}

export interface Request {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  requesterWhatsapp: string;
  userId: string;
  userName: string;
  city: string;
  country: string;
  views?: number;
  proposalCount?: number;
  createdAt: Timestamp;
}
