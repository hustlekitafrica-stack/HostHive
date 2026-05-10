import { z } from 'zod';

export const bookingSchema = z.object({
  guestId: z.string().min(1, 'Guest is required'),
  propertyId: z.string().min(1, 'Property is required'),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
  numAdults: z.coerce.number().min(1, 'At least 1 adult required'),
  numChildren: z.coerce.number().min(0, 'Children count cannot be negative'),
  totalAmount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  status: z.enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled']),
  source: z.enum(['airbnb', 'booking', 'direct', 'other']),
  notes: z.string().optional(),
});

export const bookingStatusUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled']),
  notes: z.string().optional(),
});

export const bookingFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  propertyId: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
});

export const guestSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(9, 'Valid phone number is required'),
  country: z.string().optional(),
  notes: z.string().optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
export type BookingStatusUpdateInput = z.infer<typeof bookingStatusUpdateSchema>;
export type BookingFilterInput = z.infer<typeof bookingFilterSchema>;
export type GuestInput = z.infer<typeof guestSchema>;
