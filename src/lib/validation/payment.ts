import { z } from 'zod';

export const paymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking is required'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['mpesa', 'cash', 'bank_transfer', 'cheque', 'card']),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.string().min(1, 'Payment date is required'),
});

export const invoiceSchema = z.object({
  bookingId: z.string().min(1, 'Booking is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string().optional(),
  includePaymentTerms: z.boolean().default(true),
});

export const paymentFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  bookingId: z.string().optional(),
  paymentMethod: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type PaymentFilterInput = z.infer<typeof paymentFilterSchema>;
