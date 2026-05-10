'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabContent } from '@/components/ui/Tabs';
import { BarChart } from '@/components/charts/BarChart';
import toast from 'react-hot-toast';

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  vendor?: string;
  property: string;
  paymentMethod: 'cash' | 'mpesa' | 'bank_transfer' | 'cheque';
  receiptUrl?: string;
  notes?: string;
}

const EXPENSE_CATEGORIES = [
  { id: '1', name: 'Caretaker/Housekeeper Salary', icon: '👤', color: '#ef4444' },
  { id: '2', name: 'Cleaning Supplies', icon: '🧹', color: '#ef4444' },
  { id: '3', name: 'Internet/WiFi Bill', icon: '📡', color: '#ef4444' },
  { id: '4', name: 'Electricity Bill', icon: '⚡', color: '#ef4444' },
  { id: '5', name: 'Water Bill', icon: '💧', color: '#ef4444' },
  { id: '6', name: 'Property Maintenance & Repairs', icon: '🔧', color: '#ef4444' },
  { id: '7', name: 'Airbnb/Booking.com Commission', icon: '💳', color: '#ef4444' },
  { id: '8', name: 'Property Insurance', icon: '🛡️', color: '#ef4444' },
  { id: '9', name: 'Marketing & Photography', icon: '📸', color: '#ef4444' },
  { id: '10', name: 'Accountant/Legal Fees', icon: '⚖️', color: '#ef4444' },
];

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'mpesa', label: 'M-Pesa', icon: '📱' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { id: 'cheque', label: 'Cheque', icon: '📄' },
];

export default function ExpensesEnhancedPage() {
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      date: '2025-06-05',
      category: 'Cleaning Supplies',
      description: 'Monthly cleaning supplies',
      amount: 5000,
      vendor: 'ABC Supplies',
      property: 'Property A',
      paymentMethod: 'mpesa',
      notes: 'For all properties',
    },
    {
      id: '2',
      date: '2025-06-04',
      category: 'Electricity Bill',
      description: 'June electricity bill',
      amount: 8500,
      property: 'Property A',
      paymentMethod: 'bank_transfer',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterProperty, setFilterProperty] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '2025-01-01',
    endDate: '2025-12-31',
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: '',
    vendor: '',
    property: 'Property A',
    paymentMethod: 'mpesa' as const,
    notes: '',
    receipt: null as File | null,
  });

  const handleAddExpense = async () => {
    if (!formData.date || !formData.category || !formData.description || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const newExpense: Expense = {
        id: Math.random().toString(),
        date: formData.date,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        vendor: formData.vendor,
        property: formData.property,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      };

      setExpenses([...expenses, newExpense]);
      setShowAddModal(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: '',
        description: '',
        amount: '',
        vendor: '',
        property: 'Property A',
        paymentMethod: 'mpesa',
        notes: '',
        receipt: null,
      });
      toast.success('Expense added successfully');
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };

  const filteredExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    return (
      expenseDate >= startDate &&
      expenseDate <= endDate &&
      (!filterCategory || expense.category === filterCategory) &&
      (!filterProperty || expense.property === filterProperty) &&
      (!filterPaymentMethod || expense.paymentMethod === filterPaymentMethod)
    );
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const averageExpense = filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;

  const categoryTotals = EXPENSE_CATEGORIES.map((cat) => ({
    label: cat.name,
    value: filteredExpenses
      .filter((e) => e.category === cat.name)
      .reduce((sum, e) => sum + e.amount, 0),
  })).filter((ct) => ct.value > 0);

  const paymentMethodTotals = PAYMENT_METHODS.map((method) => ({
    label: method.label,
    value: filteredExpenses
      .filter((e) => e.paymentMethod === method.id)
      .reduce((sum, e) => sum + e.amount, 0),
  })).filter((pmt) => pmt.value > 0);

  const expenseTabs = [
    { label: 'List', value: 'list', icon: '📋' },
    { label: 'By Category', value: 'category', icon: '📊' },
    { label: 'By Payment', value: 'payment', icon: '💳' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900">Expenses</h1>
        <p className="text-surface-600 mt-2">Track and manage all your property expenses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-surface-600">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              KSH {totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-surface-500 mt-2">
              {filteredExpenses.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-surface-600">
              Average Expense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              KSH {averageExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-surface-500 mt-2">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-surface-600">
              Categories Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {categoryTotals.length}
            </div>
            <p className="text-xs text-surface-500 mt-2">Different categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-surface-600">
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {paymentMethodTotals.length}
            </div>
            <p className="text-xs text-surface-500 mt-2">Methods used</p>
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
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Categories</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
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
                Payment Method
              </label>
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
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
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs items={expenseTabs}>
        <TabContent value="list">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Expense List</CardTitle>
                <Button onClick={() => setShowAddModal(true)}>+ Add Expense</Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-surface-600 mb-4">No expenses found</p>
                  <Button onClick={() => setShowAddModal(true)}>Add Your First Expense</Button>
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
                          Category
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-surface-900">
                          Description
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-surface-900">
                          Vendor
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-surface-900">
                          Property
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-surface-900">
                          Method
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-surface-900">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((expense) => (
                          <tr
                            key={expense.id}
                            className="border-b border-surface-200 hover:bg-surface-50"
                          >
                            <td className="py-3 px-4 text-sm">{expense.date}</td>
                            <td className="py-3 px-4">
                              <Badge variant="default">{expense.category}</Badge>
                            </td>
                            <td className="py-3 px-4">{expense.description}</td>
                            <td className="py-3 px-4 text-sm text-surface-600">
                              {expense.vendor || '-'}
                            </td>
                            <td className="py-3 px-4 text-sm">{expense.property}</td>
                            <td className="py-3 px-4 text-sm">
                              <Badge variant="secondary">
                                {PAYMENT_METHODS.find((m) => m.id === expense.paymentMethod)?.label}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-red-600">
                              KSH {expense.amount.toLocaleString()}
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

        <TabContent value="category">
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryTotals.length === 0 ? (
                <p className="text-center text-surface-600 py-8">No expenses to display</p>
              ) : (
                <BarChart data={categoryTotals} height={400} />
              )}
            </CardContent>
          </Card>
        </TabContent>

        <TabContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentMethodTotals.length === 0 ? (
                <p className="text-center text-surface-600 py-8">No expenses to display</p>
              ) : (
                <div className="space-y-6">
                  <BarChart data={paymentMethodTotals} height={300} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paymentMethodTotals.map((method) => {
                      const total = paymentMethodTotals.reduce((sum, m) => sum + m.value, 0);
                      const percentage = ((method.value / total) * 100).toFixed(1);
                      return (
                        <div key={method.label} className="p-4 bg-surface-50 rounded-lg">
                          <div className="flex justify-between mb-2">
                            <span className="font-medium text-surface-900">
                              {method.label}
                            </span>
                            <span className="text-sm font-bold text-red-600">
                              {percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-surface-200 rounded-full h-2 mb-2">
                            <div
                              className="bg-red-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <p className="text-sm text-surface-600">
                            KSH {method.value.toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabContent>
      </Tabs>

      {/* Add Expense Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Expense"
        size="lg"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-surface-900 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a category...</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Description *"
            placeholder="e.g., Monthly cleaning supplies"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <Input
            label="Amount (KSH) *"
            type="number"
            placeholder="1000"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />

          <Input
            label="Vendor (Optional)"
            placeholder="e.g., ABC Supplies"
            value={formData.vendor}
            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
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

          <div>
            <label className="block text-sm font-medium text-surface-900 mb-2">
              Payment Method
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) =>
                setFormData({
                  ...formData,
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
            label="Notes (Optional)"
            placeholder="Additional notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-surface-900 mb-2">
              Receipt (Optional)
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  receipt: e.target.files?.[0] || null,
                })
              }
              className="w-full px-4 py-2 border border-surface-300 rounded-lg"
            />
            <p className="text-xs text-surface-500 mt-1">
              Supported: Images (JPG, PNG) and PDF
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-surface-200">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddExpense}>Add Expense</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
