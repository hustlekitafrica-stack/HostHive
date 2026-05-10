'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabContent } from '@/components/ui/Tabs';
import toast from 'react-hot-toast';

interface Payment {
  id: string;
  bookingId: string;
  guestName: string;
  property: string;
  amount: number;
  paymentMethod: 'mpesa' | 'cash' | 'bank_transfer' | 'cheque' | 'card';
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed';
  paidAt: string;
  notes?: string;
}

interface Invoice {
  id: string;
  bookingId: string;
  invoiceNumber: string;
  guestName: string;
  property: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
}

const PAYMENT_METHODS = [
  { id: 'mpesa', label: 'M-Pesa', icon: '📱', color: '#10b981' },
  { id: 'cash', label: 'Cash', icon: '💵', color: '#f59e0b' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', color: '#3b82f6' },
  { id: 'cheque', label: 'Cheque', icon: '📄', color: '#8b5cf6' },
  { id: 'card', label: 'Card', icon: '💳', color: '#ef4444' },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([
    {
      id: '1',
      bookingId: 'BK001',
      guestName: 'John Doe',
      property: 'Property A',
      amount: 25000,
      paymentMethod: 'mpesa',
      transactionId: 'MPE123456',
      status: 'completed',
      paidAt: '2025-06-01',
      notes: 'Full payment received',
    },
    {
      id: '2',
      bookingId: 'BK002',
      guestName: 'Jane Smith',
      property: 'Property B',
      amount: 10000,
      paymentMethod: 'bank_transfer',
      status: 'completed',
      paidAt: '2025-06-02',
    },
  ]);

  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: '1',
      bookingId: 'BK001',
      invoiceNumber: 'INV-2025-001',
      guestName: 'John Doe',
      property: 'Property A',
      amount: 25000,
      issueDate: '2025-06-01',
      dueDate: '2025-06-08',
      status: 'paid',
    },
    {
      id: '2',
      bookingId: 'BK002',
      invoiceNumber: 'INV-2025-002',
      guestName: 'Jane Smith',
      property: 'Property B',
      amount: 20000,
      issueDate: '2025-06-02',
      dueDate: '2025-06-09',
      status: 'sent',
    },
  ]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [filterMethod, setFilterMethod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '2025-01-01',
    endDate: '2025-12-31',
  });

  const [paymentForm, setPaymentForm] = useState({
    bookingId: '',
    amount: '',
    paymentMethod: 'mpesa' as const,
    transactionId: '',
    paidAt: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [invoiceForm, setInvoiceForm] = useState({
    bookingId: '',
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
  });

  const filteredPayments = payments.filter((payment) => {
    const paymentDate = new Date(payment.paidAt);
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    return (
      paymentDate >= startDate &&
      paymentDate <= endDate &&
      (!filterMethod || payment.paymentMethod === filterMethod) &&
      (!filterStatus || payment.status === filterStatus)
    );
  });

  const totalPayments = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const completedPayments = filteredPayments.filter((p) => p.status === 'completed').length;
  const pendingPayments = filteredPayments.filter((p) => p.status === 'pending').length;

  const handleRecordPayment = () => {
    if (!paymentForm.bookingId || !paymentForm.amount || !paymentForm.paidAt) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newPayment: Payment = {
      id: Math.random().toString(),
      bookingId: paymentForm.bookingId,
      guestName: 'Guest Name',
      property: 'Property A',
      amount: parseFloat(paymentForm.amount),
      paymentMethod: paymentForm.paymentMethod,
      transactionId: paymentForm.transactionId,
      status: 'completed',
      paidAt: paymentForm.paidAt,
      notes: paymentForm.notes,
    };

    setPayments([...payments, newPayment]);
    setShowPaymentModal(false);
    setPaymentForm({
      bookingId: '',
      amount: '',
      paymentMethod: 'mpesa',
      transactionId: '',
      paidAt: new Date().toISOString().split('T')[0],
      notes: '',
    });
    toast.success('Payment recorded successfully');
  };

  const handleGenerateInvoice = () => {
    if (!invoiceForm.bookingId || !invoiceForm.invoiceNumber || !invoiceForm.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newInvoice: Invoice = {
      id: Math.random().toString(),
      bookingId: invoiceForm.bookingId,
      invoiceNumber: invoiceForm.invoiceNumber,
      guestName: 'Guest Name',
      property: 'Property A',
      amount: 0,
      issueDate: invoiceForm.issueDate,
      dueDate: invoiceForm.dueDate,
      status: 'draft',
    };

    setInvoices([...invoices, newInvoice]);
    setShowInvoiceModal(false);
    setInvoiceForm({
      bookingId: '',
      invoiceNumber: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      notes: '',
    });
    toast.success('Invoice generated successfully');
  };

  const paymentTabs = [
    { label: 'Payments', value: 'payments', icon: '💳' },
    { label: 'Invoices', value: 'invoices', icon: '📄' },
    { label: 'Analytics', value: 'analytics', icon: '📊' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900">Payments</h1>
        <p className="text-surface-600 mt-2">Manage payments and invoices</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-surface-600">
              Total Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              KSH {totalPayments.toLocaleString()}
            </div>
            <p className="text-xs text-surface-500 mt-2">
              {filteredPayments.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-surface-600">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {completedPayments}
            </div>
            <p className="text-xs text-surface-500 mt-2">Successful payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-surface-600">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {pendingPayments}
            </div>
            <p className="text-xs text-surface-500 mt-2">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-surface-600">
              Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary-600">
              {invoices.length}
            </div>
            <p className="text-xs text-surface-500 mt-2">Total invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                Payment Method
              </label>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="w-full px-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Methods</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
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
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs items={paymentTabs}>
        <TabContent value="payments">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Payment History</CardTitle>
                <Button onClick={() => setShowPaymentModal(true)}>
                  + Record Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-surface-600 mb-4">No payments found</p>
                  <Button onClick={() => setShowPaymentModal(true)}>
                    Record First Payment
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-200">
                        <th className="text-left py-3 px-4 font-semibold text-surface-900">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-surface-900">
                          Booking
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-surface-900">
                          Guest
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-surface-900">
                          Method
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-surface-900">
                          Transaction ID
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-surface-900">
                          Amount
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-surface-900">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments
                        .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
                        .map((payment) => (
                          <tr
                            key={payment.id}
                            className="border-b border-surface-200 hover:bg-surface-50"
                          >
                            <td className="py-3 px-4 text-sm">{payment.paidAt}</td>
                            <td className="py-3 px-4 text-sm font-medium">
                              {payment.bookingId}
                            </td>
                            <td className="py-3 px-4 text-sm">{payment.guestName}</td>
                            <td className="py-3 px-4">
                              <Badge variant="default">
                                {PAYMENT_METHODS.find((m) => m.id === payment.paymentMethod)?.label}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-surface-600">
                              {payment.transactionId || '-'}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-green-600">
                              KSH {payment.amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  payment.status === 'completed'
                                    ? 'success'
                                    : payment.status === 'pending'
                                    ? 'warning'
                                    : 'danger'
                                }
                              >
                                {payment.status}
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
        </TabContent>

        <TabContent value="invoices">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Invoices</CardTitle>
                <Button onClick={() => setShowInvoiceModal(true)}>
                  + Generate Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-surface-600 mb-4">No invoices yet</p>
                  <Button onClick={() => setShowInvoiceModal(true)}>
                    Generate First Invoice
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices
                    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
                    .map((invoice) => (
                      <div
                        key={invoice.id}
                        className="p-4 border border-surface-200 rounded-lg hover:bg-surface-50"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-surface-900">
                              {invoice.invoiceNumber}
                            </p>
                            <p className="text-sm text-surface-600">
                              {invoice.guestName} • {invoice.property}
                            </p>
                          </div>
                          <Badge
                            variant={
                              invoice.status === 'paid'
                                ? 'success'
                                : invoice.status === 'sent'
                                ? 'info'
                                : invoice.status === 'overdue'
                                ? 'danger'
                                : 'default'
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-surface-600">Amount</p>
                            <p className="font-bold text-green-600">
                              KSH {invoice.amount.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-surface-600">Issue Date</p>
                            <p className="font-medium text-surface-900">
                              {invoice.issueDate}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-surface-600">Due Date</p>
                            <p className="font-medium text-surface-900">
                              {invoice.dueDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-surface-200">
                          <Button variant="outline" size="sm">
                            📥 Download
                          </Button>
                          <Button variant="outline" size="sm">
                            📧 Send
                          </Button>
                          <Button variant="outline" size="sm">
                            ✏️ Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabContent>

        <TabContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {PAYMENT_METHODS.map((method) => {
                    const methodTotal = payments
                      .filter((p) => p.paymentMethod === method.id)
                      .reduce((sum, p) => sum + p.amount, 0);
                    const percentage = ((methodTotal / totalPayments) * 100).toFixed(1);

                    return (
                      <div key={method.id}>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium text-surface-900">
                            {method.icon} {method.label}
                          </span>
                          <span className="text-sm font-bold text-surface-900">
                            {percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-surface-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: method.color,
                            }}
                          />
                        </div>
                        <p className="text-xs text-surface-500 mt-1">
                          KSH {methodTotal.toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Status Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { status: 'paid', label: 'Paid', count: invoices.filter((i) => i.status === 'paid').length },
                    { status: 'sent', label: 'Sent', count: invoices.filter((i) => i.status === 'sent').length },
                    { status: 'draft', label: 'Draft', count: invoices.filter((i) => i.status === 'draft').length },
                    { status: 'overdue', label: 'Overdue', count: invoices.filter((i) => i.status === 'overdue').length },
                  ].map((item) => (
                    <div key={item.status} className="flex justify-between items-center p-3 bg-surface-50 rounded-lg">
                      <span className="font-medium text-surface-900">{item.label}</span>
                      <span className="text-2xl font-bold text-primary-600">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabContent>
      </Tabs>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Booking ID *"
            placeholder="BK001"
            value={paymentForm.bookingId}
            onChange={(e) =>
              setPaymentForm({ ...paymentForm, bookingId: e.target.value })
            }
          />

          <Input
            label="Amount (KSH) *"
            type="number"
            placeholder="25000"
            value={paymentForm.amount}
            onChange={(e) =>
              setPaymentForm({ ...paymentForm, amount: e.target.value })
            }
          />

          <div>
            <label className="block text-sm font-medium text-surface-900 mb-2">
              Payment Method
            </label>
            <select
              value={paymentForm.paymentMethod}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  paymentMethod: e.target.value as any,
                })
              }
              className="w-full px-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.icon} {method.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Transaction ID (Optional)"
            placeholder="MPE123456"
            value={paymentForm.transactionId}
            onChange={(e) =>
              setPaymentForm({ ...paymentForm, transactionId: e.target.value })
            }
          />

          <Input
            label="Payment Date *"
            type="date"
            value={paymentForm.paidAt}
            onChange={(e) =>
              setPaymentForm({ ...paymentForm, paidAt: e.target.value })
            }
          />

          <Input
            label="Notes (Optional)"
            placeholder="Payment notes..."
            value={paymentForm.notes}
            onChange={(e) =>
              setPaymentForm({ ...paymentForm, notes: e.target.value })
            }
          />

          <div className="flex gap-3 justify-end pt-4 border-t border-surface-200">
            <Button
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRecordPayment}>Record Payment</Button>
          </div>
        </div>
      </Modal>

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        title="Generate Invoice"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Booking ID *"
            placeholder="BK001"
            value={invoiceForm.bookingId}
            onChange={(e) =>
              setInvoiceForm({ ...invoiceForm, bookingId: e.target.value })
            }
          />

          <Input
            label="Invoice Number *"
            placeholder="INV-2025-001"
            value={invoiceForm.invoiceNumber}
            onChange={(e) =>
              setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })
            }
          />

          <Input
            label="Issue Date *"
            type="date"
            value={invoiceForm.issueDate}
            onChange={(e) =>
              setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })
            }
          />

          <Input
            label="Due Date *"
            type="date"
            value={invoiceForm.dueDate}
            onChange={(e) =>
              setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })
            }
          />

          <Input
            label="Notes (Optional)"
            placeholder="Invoice notes..."
            value={invoiceForm.notes}
            onChange={(e) =>
              setInvoiceForm({ ...invoiceForm, notes: e.target.value })
            }
          />

          <div className="flex gap-3 justify-end pt-4 border-t border-surface-200">
            <Button
              variant="outline"
              onClick={() => setShowInvoiceModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateInvoice}>Generate Invoice</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
