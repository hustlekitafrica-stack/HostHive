import { bookingSchema } from '@/lib/validation/booking';
import { expenseSchema } from '@/lib/validation/expense';
import { paymentSchema } from '@/lib/validation/payment';

describe('Validation Schemas', () => {
  describe('Booking Schema', () => {
    it('should validate correct booking data', () => {
      const validBooking = {
        guestId: 'guest_123',
        propertyId: 'prop_123',
        checkInDate: '2025-06-10',
        checkOutDate: '2025-06-15',
        numAdults: 2,
        numChildren: 1,
        totalAmount: 25000,
        status: 'confirmed',
        source: 'airbnb',
      };

      const result = bookingSchema.safeParse(validBooking);
      expect(result.success).toBe(true);
    });

    it('should reject booking with invalid dates', () => {
      const invalidBooking = {
        guestId: 'guest_123',
        propertyId: 'prop_123',
        checkInDate: '2025-06-15',
        checkOutDate: '2025-06-10',
        numAdults: 2,
        numChildren: 0,
        totalAmount: 25000,
        status: 'confirmed',
        source: 'direct',
      };

      const result = bookingSchema.safeParse(invalidBooking);
      expect(result.success).toBe(false);
    });

    it('should reject booking with zero amount', () => {
      const invalidBooking = {
        guestId: 'guest_123',
        propertyId: 'prop_123',
        checkInDate: '2025-06-10',
        checkOutDate: '2025-06-15',
        numAdults: 1,
        numChildren: 0,
        totalAmount: 0,
        status: 'pending',
        source: 'booking',
      };

      const result = bookingSchema.safeParse(invalidBooking);
      expect(result.success).toBe(false);
    });

    it('should reject booking with no adults', () => {
      const invalidBooking = {
        guestId: 'guest_123',
        propertyId: 'prop_123',
        checkInDate: '2025-06-10',
        checkOutDate: '2025-06-15',
        numAdults: 0,
        numChildren: 2,
        totalAmount: 25000,
        status: 'confirmed',
        source: 'direct',
      };

      const result = bookingSchema.safeParse(invalidBooking);
      expect(result.success).toBe(false);
    });
  });

  describe('Expense Schema', () => {
    it('should validate correct expense data', () => {
      const validExpense = {
        date: '2025-06-05',
        categoryId: 'cat_123',
        description: 'Monthly cleaning supplies',
        amount: 5000,
        paymentMethod: 'mpesa',
      };

      const result = expenseSchema.safeParse(validExpense);
      expect(result.success).toBe(true);
    });

    it('should reject expense with short description', () => {
      const invalidExpense = {
        date: '2025-06-05',
        categoryId: 'cat_123',
        description: 'abc',
        amount: 5000,
        paymentMethod: 'cash',
      };

      const result = expenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
    });

    it('should reject expense with negative amount', () => {
      const invalidExpense = {
        date: '2025-06-05',
        categoryId: 'cat_123',
        description: 'Monthly cleaning supplies',
        amount: -5000,
        paymentMethod: 'bank_transfer',
      };

      const result = expenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
    });
  });

  describe('Payment Schema', () => {
    it('should validate correct payment data', () => {
      const validPayment = {
        bookingId: 'bk_123',
        amount: 25000,
        paymentMethod: 'mpesa',
        paidAt: '2025-06-05',
      };

      const result = paymentSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it('should reject payment with zero amount', () => {
      const invalidPayment = {
        bookingId: 'bk_123',
        amount: 0,
        paymentMethod: 'cash',
        paidAt: '2025-06-05',
      };

      const result = paymentSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
    });

    it('should accept optional transaction ID', () => {
      const paymentWithTxId = {
        bookingId: 'bk_123',
        amount: 25000,
        paymentMethod: 'mpesa',
        transactionId: 'MPE123456',
        paidAt: '2025-06-05',
      };

      const result = paymentSchema.safeParse(paymentWithTxId);
      expect(result.success).toBe(true);
    });
  });
});
