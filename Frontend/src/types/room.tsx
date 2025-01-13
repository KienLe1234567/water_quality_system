export interface Room {
  id: number;
  name: string;
  description: string;
  image_2d: string;
  image_3d: string;
  price: number;
  feature_ids: number[];
  badge_ids: number[];
  status: string;
  from_date: Date;
  to_date: Date;
  features: Feature[];
  badges: Badge[];
}
export interface Booking {
  user_id: number;
  room_id: number;
  check_in: Date;
  check_out: Date;
  total_price: number;
  status: string;
  guest_name: string;
  guest_contact_number: string;
  guest_email: string;
  number_of_guests: number;
  id: number;
  created_at: string;
  updated_at: any;
  deleted_at: any;
}

export interface BookingListDto {
  data: Booking[];
  total_count: number;
  has_more: boolean;
  page: number;
  items_per_page: number;
}
export interface Feature {
  name: string;
  description: string;
  id: number;
}
export interface Badge {
  name: string;
  description: string;
  id: number;
}
export interface RoomDto {
  data: Room[];
  total_count: number;
  has_more: boolean;
  page: number;
  items_per_page: number;
}
