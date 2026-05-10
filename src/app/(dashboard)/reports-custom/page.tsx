'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

interface CustomReport {
  id: string;
  name: string;
  description: string;
  type: 'revenue' | 'occupancy' | 'guests' | 'expenses' | 'custom';
  metrics: string[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  createdAt: string;
  lastRun?: string;
}

const REPORT_TYPES = [
  { id: 'revenue', label: 'Revenue Report', icon: '💰' },
  { id: 'occupancy', label: 'Occupancy Report', icon: '📈' },
  { id: 'guests', label: 'Guest Report', icon: '👥' },
  { id: 'expenses', label: 'Expense Report', icon: '💸' },
  { id: 'custom', label: 'Custom Report', icon: '📊' },
];

const AVAILABLE_METRICS = [
  'Total Revenue',
  'Average Daily Rate',
  'Occupancy Rate',
  'Total Bookings',
  'Guest Count',
  'Payment Status',
  'Expenses',
  'Property Performance',
  'Guest Sources',
  'Payment Methods',
];

export default function CustomReportsPage() {
  const [reports, setReports] = useState<CustomReport[]>([
    {
      id: '1',
      name: 'Monthly Revenue Report',
      description: 'Complete revenue analysis for the month',
      type: 'revenue',
      metrics: ['Total Revenue', 'Average Daily Rate', 'Payment Status'],
      dateRange: { startDate: '2025-06-01', endDate: '2025-06-30' },
      frequency: 'monthly',
      recipients: ['owner@example.com'],
      createdAt: '2025-05-15',
      lastRun: '2025-06-01',
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CustomReport | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'revenue' as const,
    metrics: [] as string[],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    frequency: 'once' as const,
    recipients: '',
  });

  const handleCreateReport = () => {
    if (!formData.name || formData.metrics.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newReport: CustomReport = {
      id: Math.random().toString(),
      name: formData.name,
      description: formData.description,
      type: formData.type,
      metrics: formData.metrics,
      dateRange: {
        startDate: formData.startDate,
        endDate: formData.endDate,
      },
      frequency: formData.frequency,
      recipients: formData.recipients.split(',').map((r) => r.trim()),
      createdAt: new Date().toISOString().split('T')[0],
    };

    setReports([...reports, newReport]);
    setShowCreateModal(false);
    setFormData({
      name: '',
      description: '',
      type: 'revenue',
      metrics: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      frequency: 'once',
      recipients: '',
    });
    toast.success('Report created successfully');
  };

  const handleRunReport = (reportId: string) => {
    setReports(
      reports.map((r) =>
        r.id === reportId
          ? { ...r, lastRun: new Date().toISOString().split('T')[0] }
          : r
      )
    );
    toast.success('Report generated and sent');
  };

  const handleDeleteReport = (reportId: string) => {
    setReports(reports.filter((r) => r.id !== reportId));
    toast.success('Report deleted');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900">Custom Reports</h1>
        <p className="text-surface-600 mt-2">Create and manage custom business reports</p>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <Button onClick={() => setShowCreateModal(true)}>
              + Create Report
            </Button>
            <Button variant="outline">📥 Import Template</Button>
            <Button variant="outline">📤 Export Settings</Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-surface-600 mb-4">No custom reports yet</p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create Your First Report
              </Button>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {REPORT_TYPES.find((t) => t.id === report.type)?.icon}
                      {report.name}
                    </CardTitle>
                    <p className="text-sm text-surface-600 mt-1">
                      {report.description}
                    </p>
                  </div>
                  <Badge variant="default">{report.type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-surface-600 mb-1">Metrics</p>
                    <div className="flex flex-wrap gap-2">
                      {report.metrics.map((metric) => (
                        <Badge key={metric} variant="secondary">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-surface-600 mb-1">Schedule</p>
                    <p className="font-medium text-surface-900 capitalize">
                      {report.frequency}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-600 mb-1">Date Range</p>
                    <p className="font-medium text-surface-900">
                      {report.dateRange.startDate} to {report.dateRange.endDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-600 mb-1">Last Run</p>
                    <p className="font-medium text-surface-900">
                      {report.lastRun || 'Never'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-surface-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRunReport(report.id)}
                  >
                    ▶️ Run Now
                  </Button>
                  <Button variant="outline" size="sm">
                    ✏️ Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    📥 Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteReport(report.id)}
                  >
                    🗑️ Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Report Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Custom Report"
        size="lg"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <Input
            label="Report Name *"
            placeholder="e.g., Monthly Revenue Report"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="Description"
            placeholder="What is this report for?"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <div>
            <label className="block text-sm font-medium text-surface-900 mb-2">
              Report Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as any })
              }
              className="w-full px-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {REPORT_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-900 mb-2">
              Metrics to Include *
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-surface-300 rounded-lg p-3">
              {AVAILABLE_METRICS.map((metric) => (
                <label key={metric} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.metrics.includes(metric)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          metrics: [...formData.metrics, metric],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          metrics: formData.metrics.filter((m) => m !== metric),
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{metric}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
            />
            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-900 mb-2">
              Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={(e) =>
                setFormData({ ...formData, frequency: e.target.value as any })
              }
              className="w-full px-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="once">One Time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <Input
            label="Recipients (comma-separated emails)"
            placeholder="email1@example.com, email2@example.com"
            value={formData.recipients}
            onChange={(e) =>
              setFormData({ ...formData, recipients: e.target.value })
            }
          />

          <div className="flex gap-3 justify-end pt-4 border-t border-surface-200">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateReport}>Create Report</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
