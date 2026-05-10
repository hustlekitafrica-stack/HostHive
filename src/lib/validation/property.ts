import { z } from 'zod';

export const propertyBasicSchema = z.object({
  name: z.string().min(2, 'Property name is required'),
  type: z.enum(['apartment', 'house', 'villa', 'studio', 'townhouse', 'other']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(5, 'Location is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),
  postalCode: z.string().optional(),
});

export const propertyPricingSchema = z.object({
  basePrice: z.coerce.number().min(100, 'Base price must be at least 100'),
  currency: z.string().default('KES'),
  cleaningFee: z.coerce.number().min(0, 'Cleaning fee cannot be negative').optional(),
  securityDeposit: z.coerce.number().min(0, 'Security deposit cannot be negative').optional(),
  minStay: z.coerce.number().min(1, 'Minimum stay must be at least 1 night'),
  maxGuests: z.coerce.number().min(1, 'Maximum guests must be at least 1'),
});

export const propertyAmenitiesSchema = z.object({
  amenities: z.array(z.string()).min(1, 'Select at least one amenity'),
});

export const propertyBedsSchema = z.object({
  beds: z.array(
    z.object({
      roomName: z.string().min(1, 'Room name is required'),
      bedType: z.enum(['single', 'double', 'queen', 'king', 'bunk']),
      quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
    })
  ).min(1, 'Add at least one bed'),
});

export const propertyPhotosSchema = z.object({
  photos: z.array(z.instanceof(File)).min(1, 'Upload at least one photo'),
});

export const propertyRulesSchema = z.object({
  checkInTime: z.string().default('14:00'),
  checkOutTime: z.string().default('11:00'),
  smokingAllowed: z.boolean().default(false),
  petsAllowed: z.boolean().default(false),
  partiesAllowed: z.boolean().default(false),
  rules: z.string().optional(),
});

export const propertyContactSchema = z.object({
  contactName: z.string().min(2, 'Contact name is required'),
  contactPhone: z.string().min(9, 'Valid phone number is required'),
  contactEmail: z.string().email('Valid email is required'),
});

export const propertyGroupSchema = z.object({
  groupId: z.string().optional(),
  groupName: z.string().optional(),
});

export const propertySeasonalSchema = z.object({
  seasonalPricing: z.array(
    z.object({
      name: z.string().min(1, 'Season name is required'),
      startDate: z.string(),
      endDate: z.string(),
      price: z.coerce.number().min(100, 'Price must be at least 100'),
    })
  ).optional(),
});

export type PropertyBasicInput = z.infer<typeof propertyBasicSchema>;
export type PropertyPricingInput = z.infer<typeof propertyPricingSchema>;
export type PropertyAmenitiesInput = z.infer<typeof propertyAmenitiesSchema>;
export type PropertyBedsInput = z.infer<typeof propertyBedsSchema>;
export type PropertyPhotosInput = z.infer<typeof propertyPhotosSchema>;
export type PropertyRulesInput = z.infer<typeof propertyRulesSchema>;
export type PropertyContactInput = z.infer<typeof propertyContactSchema>;
export type PropertyGroupInput = z.infer<typeof propertyGroupSchema>;
export type PropertySeasonalInput = z.infer<typeof propertySeasonalSchema>;
