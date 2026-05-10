'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Booking {
  id: string;
  guestName: string;
  property: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  amount: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'refunded';
}

export default function BookingsPage() {
  const bookings: Booking[] = [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'refunded':
        return 'danger';
      default:
        return 'default';
    }
  };

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
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary-600">0</div>
            <p className="text-xs text-surface-500 mt-2">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-surface-600">
              Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">0</div>
            <p className="text-xs text-surface-500 mt-2">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-surface-600">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">0</div>
            <p className="text-xs text-surface-500 mt-2">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-surface-600">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">KSH 0</div>
            <p className="text-xs text-surface-500 mt-2">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-surface-600 mb-4">No bookings yet</p>
              <p className="text-sm text-surface-500">
                Once guests book your properties, they will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="text-left py-3 px-4 font-semibold text-surface-900">
                      Guest
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-surface-900">
                      Property
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-surface-900">
                      Dates
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-surface-900">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-surface-900">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-surface-900">
                      Payment
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-b border-surface-200 hover:bg-surface-50"
                    >
                      <td className="py-3 px-4">{booking.guestName}</td>
                      <td className="py-3 px-4">{booking.property}</td>
                      <td className="py-3 px-4 text-sm text-surface-600">
                        {booking.checkIn} → {booking.checkOut}
                        <br />
                        <span className="text-xs">{booking.nights} nights</span>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        KSH {booking.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getPaymentColor(booking.paymentStatus)}>
                          {booking.paymentStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
