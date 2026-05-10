export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  business_name: string;
  phone: string;
  kra_pin: string;
  logo_url: string;
  primary_color: string;
  mpesa_number: string;
  mpesa_paybill: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  paypal_email: string;
  notification_email: string;
  whatsapp_alerts: boolean;
  email_alerts: boolean;
  daily_ops_sheet_time: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  user_id: string;
  group_id: string | null;
  name: string;
  title: string;
  type: string;
  building_name: string;
  unit_number: string;
  floor_level: string;
  location: string;
  address: string;
  county: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  nightly_rate: number;
  weekend_rate: number;
  monthly_rate: number;
  min_stay_nights: number;
  max_stay_nights: number;
  security_deposit: number;
  cleaning_fee: number;
  status: 'available' | 'occupied' | 'maintenance' | 'inactive';
  calendar_color: string;
  cover_photo: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  property_id: string;
  guest_id: string;
  check_in: string;
  check_out: string;
  nights: number;
  num_adults: number;
  num_children: number;
  nightly_rate: number;
  cleaning_fee: number;
  security_deposit: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  payment_status: 'unpaid' | 'partial' | 'paid';
  status: 'confirmed' | 'tentative' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  booking_source: string;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string;
  id_number: string;
  notes: string;
  tags: string[];
  created_at: string;
}

export interface PaymentLog {
  id: string;
  booking_id: string;
  user_id: string;
  property_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  mpesa_code: string;
  cash_receipt_number: string;
  card_last_four: string;
  bank_reference: string;
  paid_at: string;
  recorded_at: string;
  notes: string;
}

export interface Expense {
  id: string;
  user_id: string;
  property_id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  vendor: string;
  receipt_url: string;
  created_at: string;
}

export interface UnitMonthlyStat {
  id: string;
  property_id: string;
  user_id: string;
  year: number;
  month: number;
  total_revenue: number;
  total_bookings: number;
  booked_nights: number;
  available_nights: number;
  occupancy_rate: number;
  adr: number;
  revpar: number;
  avg_stay_length: number;
  total_guests: number;
  updated_at: string;
}
