'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabContent } from '@/components/ui/Tabs';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  property: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  numAdults: number;
  numChildren: number;
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
  source: 'airbnb' | 'booking' | 'direct' | 'other';
  notes?: string;
  createdAt: string;
}

const BOOKING_STATUSES = [
  { id: 'pending', label: 'Pending', color: 'warning' },
  { id: 'confirmed', label: 'Confirmed', color: 'info' },
  { id: 'checked_in', label: 'Checked In', color: 'success' },
  { id: 'checked_out', label: 'Checked Out', color: 'default' },
  { id: 'cancelled', label: 'Cancelled', color: 'danger' },
];

const PAYMENT_STATUSES = [
  { id: 'unpaid', label: 'Unpaid', color: 'danger' },
  { id: 'partial', label: 'Partial', color: 'warning' },
  { id: 'paid', label: 'Paid', color: 'success' },
  { id: 'refunded', label: 'Refunded', color: 'default' },
];

const BOOKING_SOURCES = [
  { id: 'airbnb', label: 'Airbnb', icon: '🏠' },
  { id: 'booking', label: 'Booking.com', icon: '📅' },
  { id: 'direct', label: 'Direct', icon: '📞' },
  { id: 'other', label: 'Other', icon: '⭐' },
];

export default function BookingsEnhancedPage() {
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: '1',
      guestName: 'John Doe',
      guestEmail: 'john@example.com',
      guestPhone: '+254 712 345 678',
      property: 'Property A',
      checkIn: '2025-06-10',
      checkOut: '2025-06-15',
      nights: 5,
      numAdults: 2,
      numChildren: 1,
      totalAmount: 25000,
      paidAmount: 25000,
      status: 'confirmed',
      paymentStatus: 'paid',
      source: 'airbnb',
      createdAt: '2025-06-01',
    },
    {
      id: '2',
      guestName: 'Jane Smith',
      guestEmail: 'jane@example.com',
      guestPhone: '+254 723 456 789',
      property: 'Property B',
      checkIn: '2025-06-20',
      checkOut: '2025-06-25',
      nights: 5,
      numAdults: 1,
      numChildren: 0,
      totalAmount: 20000,
      paidAmount: 10000,
      status: 'pending',
      paymentStatus: 'partial',
      source: 'booking',
      createdAt: '2025-06-02',
    },
  ]);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProperty, setFilterProperty] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '2025-01-01',
    endDate: '2025-12-31',
  });

  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    property: 'Property A',
    checkIn: '',
    checkOut: '',
    numAdults: '1',
    numChildren: '0',
    totalAmount: '',
    source: 'direct' as const,
    notes: '',
  });

  const filteredBookings = bookings.filter((booking) => {
    const checkInDate = new Date(booking.checkIn);
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    return (
      checkInDate >= startDate &&
      checkInDate <= endDate &&
      (!filterStatus || booking.status === filterStatus) &&
      (!filterProperty || booking.property === filterProperty) &&
      (!filterPayment || booking.paymentStatus === filterPayment)
    );
  });

  const totalRevenue = filteredBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalPaid = filteredBookings.reduce((sum, b) => sum + b.paidAmount, 0);
  const pendingPayment = totalRevenue - totalPaid;
  const confirmedCount = filteredBookings.filter((b) => b.status === 'confirmed').length;

  const handleAddBooking = () => {
    if (!formData.guestName || !formData.guestEmail || !formData.checkIn || !formData.checkOut || !formData.totalAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const checkInDate = new Date(formData.checkIn);
    const checkOutDate = new Date(formData.checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    const newBooking: Booking = {
      id: Math.random().toString(),
      guestName: formData.guestName,
      guestEmail: formData.guestEmail,
      guestPhone: formData.guestPhone,
      property: formData.property,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      nights,
      numAdults: parseInt(formData.numAdults),
      numChildren: parseInt(formData.numChildren),
      totalAmount: parseFloat(formData.totalAmount),
      paidAmount: 0,
      status: 'pending',
      paymentStatus: 'unpaid',
      source: formData.source,
      notes: formData.notes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setBookings([...bookings, newBooking]);
    setShowAddModal(false);
    setFormData({
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      property: 'Property A',
      checkIn: '',
      checkOut: '',
      numAdults: '1',
      numChildren: '0',
      totalAmount: '',
      source: 'direct',
      notes: '',
    });
    toast.success('Booking added successfully');
  };

  const handleStatusChange = (bookingId: string, newStatus: string) => {
    setBookings(
      bookings.map((b) =>
        b.id === bookingId ? { ...b, status: newStatus as any } : b
      )
    );
    toast.success('Booking status updated');
  };

  const handlePaymentUpdate = (bookingId: string, amount: number) => {
    setBookings(
      bookings.map((b) => {
        if (b.id === bookingId) {
          const newPaidAmount = b.paidAmount + amount;
          const paymentStatus =
            newPaidAmount === 0
              ? 'unpaid'
              : newPaidAmount >= b.totalAmount
              ? 'paid'
              : 'partial';
          return { ...b, paidAmount: newPaidAmount, paymentStatus };
        }
        return b;
      })
    );
    toast.success('Payment recorded');
  };

  const bookingTabs = [
    { label: 'All Bookings', value: 'all', icon: '📋' },
    { label: 'Upcoming', value: 'upcoming', icon: '📅' },
    { label: 'Pending Payment', value: 'pending_payment', icon: '💳' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900">Bookings</h1>
        <p className="text-surface-600 mt-2">Manage all your property bookings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-surface-600">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              KSH {totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-surface-500 mt-2">
              {filteredBookings.length} bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-surface-600">
              Amount Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              KSH {totalPaid.toLocaleString()}
            </div>
            <p className="text-xs text-surface-500 mt-2">
              {((totalPaid / totalRevenue) * 100).toFixed(0)}% collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-surface-600">
              Pending Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              KSH {pendingPayment.toLocaleString()}
            </div>
            <p className="text-xs text-surface-500 mt-2">
              {((pendingPayment / totalRevenue) * 100).toFixed(0)}% outstanding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-surface-600">
              Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary-600">
              {confirmedCount}
            </div>
            <p className="text-xs text-surface-500 mt-2">Confirmed bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
            />
            <Input
              label="End Date"
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
            />
            <div>
              <label className="block text-sm font-medium text-surface-900 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Statuses</option>
                {BOOKING_STATUSES.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-900 mb-2">
                Property
              </label>
              <select
                value={filterProperty}
                onChange={(e) => setFilterProperty(e.target.value)}
                className="w-full px-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Properties</option>
                <option value="Property A">Property A</option>
                <option value="Property B">Property B</option>
                <option value="Property C">Property C</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-900 mb-2">
                Payment
              </label>
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="w-full px-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Payments</option>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Bookings</CardTitle>
            <Button onClick={() => setShowAddModal(true)}>+ New Booking</Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-surface-600 mb-4">No bookings found</p>
              <Button onClick={() => setShowAddModal(true)}>Create First Booking</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings
                .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())
                .map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-surface-600 mb-1">Guest</p>
                        <p className="font-semibold text-surface-900">{booking.guestName}</p>
                        <p className="text-sm text-surface-600">{booking.guestEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-600 mb-1">Property & Dates</p>
                        <p className="font-semibold text-surface-900">{booking.property}</p>
                        <p className="text-sm text-surface-600">
                          {booking.checkIn} → {booking.checkOut} ({booking.nights} nights)
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-600 mb-1">Amount & Payment</p>
                        <p className="font-semibold text-green-600">
                          KSH {booking.totalAmount.toLocaleString()}
                        </p>
                        <p className="text-sm text-surface-600">
                          Paid: KSH {booking.paidAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-600 mb-1">Status</p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant={BOOKING_STATUSES.find((s) => s.id === booking.status)?.color as any}>
                            {BOOKING_STATUSES.find((s) => s.id === booking.status)?.label}
                          </Badge>
                          <Badge variant={PAYMENT_STATUSES.find((s) => s.id === booking.paymentStatus)?.color as any}>
                            {PAYMENT_STATUSES.find((s) => s.id === booking.paymentStatus)?.label}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap pt-4 border-t border-surface-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetailModal(true);
                        }}
                      >
                        View Details
                      </Button>
                      <select
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                        className="px-3 py-1 text-sm border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        {BOOKING_STATUSES.map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      {booking.paymentStatus !== 'paid' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const amount = booking.totalAmount - booking.paidAmount;
                            handlePaymentUpdate(booking.id, amount);
                          }}
                        >
                          Mark as Paid
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        📧 Send Message
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedBooking && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="Booking Details"
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-surface-600 mb-1">Guest Name</p>
                <p className="font-semibold text-surface-900">{selectedBooking.guestName}</p>
              </div>
              <div>
                <p className="text-xs text-surface-600 mb-1">Email</p>
                <p className="font-semibold text-surface-900">{selectedBooking.guestEmail}</p>
              </div>
              <div>
                <p className="text-xs text-surface-600 mb-1">Phone</p>
                <p className="font-semibold text-surface-900">{selectedBooking.guestPhone}</p>
              </div>
              <div>
                <p className="text-xs text-surface-600 mb-1">Source</p>
                <p className="font-semibold text-surface-900">
                  {BOOKING_SOURCES.find((s) => s.id === selectedBooking.source)?.label}
                </p>
              </div>
            </div>

            <div className="border-t border-surface-200 pt-4">
              <h3 className="font-semibold text-surface-900 mb-4">Booking Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-surface-600 mb-1">Property</p>
                  <p className="font-semibold text-surface-900">{selectedBooking.property}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-600 mb-1">Check-in</p>
                  <p className="font-semibold text-surface-900">{selectedBooking.checkIn}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-600 mb-1">Check-out</p>
                  <p className="font-semibold text-surface-900">{selectedBooking.checkOut}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-600 mb-1">Nights</p>
                  <p className="font-semibold text-surface-900">{selectedBooking.nights}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-600 mb-1">Adults</p>
                  <p className="font-semibold text-surface-900">{selectedBooking.numAdults}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-600 mb-1">Children</p>
                  <p className="font-semibold text-surface-900">{selectedBooking.numChildren}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-surface-200 pt-4">
              <h3 className="font-semibold text-surface-900 mb-4">Payment Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-surface-600 mb-1">Total Amount</p>
                  <p className="font-semibold text-green-600">
                    KSH {selectedBooking.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-600 mb-1">Paid Amount</p>
                  <p className="font-semibold text-blue-600">
                    KSH {selectedBooking.paidAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-600 mb-1">Outstanding</p>
                  <p className="font-semibold text-red-600">
                    KSH {(selectedBooking.totalAmount - selectedBooking.paidAmount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-600 mb-1">Payment Status</p>
                  <Badge variant={PAYMENT_STATUSES.find((s) => s.id === selectedBooking.paymentStatus)?.color as any}>
                    {PAYMENT_STATUSES.find((s) => s.id === selectedBooking.paymentStatus)?.label}
                  </Badge>
                </div>
              </div>
            </div>

            {selectedBooking.notes && (
              <div className="border-t border-surface-200 pt-4">
                <h3 className="font-semibold text-surface-900 mb-2">Notes</h3>
                <p className="text-surface-600">{selectedBooking.notes}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t border-surface-200">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
              <Button>📧 Send Message</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Booking Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New Booking"
        size="lg"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <Input
            label="Guest Name *"
            placeholder="John Doe"
            value={formData.guestName}
            onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
          />

          <Input
            label="Email *"
            type="email"
            placeholder="john@example.com"
            value={formData.guestEmail}
            onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
          />

          <Input
            label="Phone *"
            placeholder="+254 712 345 678"
            value={formData.guestPhone}
            onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-surface-900 mb-2">
              Property
            </label>
            <select
              value={formData.property}
              onChange={(e) => setFormData({ ...formData, property: e.target.value })}
              className="w-full px-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="Property A">Property A</option>
              <option value="Property B">Property B</option>
              <option value="Property C">Property C</option>
            </select>
          </div>

          <Input
            label="Check-in Date *"
            type="date"
            value={formData.checkIn}
            onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
          />

          <Input
            label="Check-out Date *"
            type="date"
            value={formData.checkOut}
            onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Adults"
              type="number"
              min="1"
              value={formData.numAdults}
              onChange={(e) => setFormData({ ...formData, numAdults: e.target.value })}
            />
            <Input
              label="Children"
              type="number"
              min="0"
              value={formData.numChildren}
              onChange={(e) => setFormData({ ...formData, numChildren: e.target.value })}
            />
          </div>

          <Input
            label="Total Amount (KSH) *"
            type="number"
            placeholder="25000"
            value={formData.totalAmount}
            onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-surface-900 mb-2">
              Source
            </label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value as any })}
              className="w-full px-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {BOOKING_SOURCES.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.icon} {source.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Notes (Optional)"
            placeholder="Any special requests or notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex gap-3 justify-end pt-4 border-t border-surface-200">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBooking}>Create Booking</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
