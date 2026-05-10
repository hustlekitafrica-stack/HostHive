import { z } from 'zod';

export const expenseSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  vendor: z.string().optional(),
  propertyId: z.string().optional(),
  paymentMethod: z.enum(['cash', 'mpesa', 'bank_transfer', 'cheque']),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export const expenseCategorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  icon: z.string().optional(),
  color: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export const expenseFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categoryId: z.string().optional(),
  propertyId: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  paymentMethod: z.string().optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
export type ExpenseCategoryInput = z.infer<typeof expenseCategorySchema>;
export type ExpenseFilterInput = z.infer<typeof expenseFilterSchema>;
