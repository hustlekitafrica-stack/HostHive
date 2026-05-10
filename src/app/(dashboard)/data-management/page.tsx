'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface Backup {
  id: string;
  name: string;
  date: string;
  size: string;
  status: 'completed' | 'in_progress' | 'failed';
  type: 'automatic' | 'manual';
}

export default function DataManagementPage() {
  const [backups, setBackups] = useState<Backup[]>([
    {
      id: '1',
      name: 'Daily Backup - 2025-06-06',
      date: '2025-06-06 02:00',
      size: '125 MB',
      status: 'completed',
      type: 'automatic',
    },
    {
      id: '2',
      name: 'Daily Backup - 2025-06-05',
      date: '2025-06-05 02:00',
      size: '120 MB',
      status: 'completed',
      type: 'automatic',
    },
    {
      id: '3',
      name: 'Manual Backup',
      date: '2025-06-04 15:30',
      size: '118 MB',
      status: 'completed',
      type: 'manual',
    },
  ]);

  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    frequency: 'daily',
    retention: '30',
    backupTime: '02:00',
  });

  const handleCreateBackup = () => {
    const newBackup: Backup = {
      id: Math.random().toString(),
      name: 'Manual Backup',
      date: new Date().toLocaleString(),
      size: '125 MB',
      status: 'in_progress',
      type: 'manual',
    };

    setBackups([newBackup, ...backups]);
    setShowBackupModal(false);

    setTimeout(() => {
      setBackups((prev) =>
        prev.map((b) =>
          b.id === newBackup.id ? { ...b, status: 'completed' } : b
        )
      );
      toast.success('Backup completed successfully');
    }, 2000);
  };

  const handleRestoreBackup = (backupId: string) => {
    toast.success('Restore process started. This may take a few minutes.');
  };

  const handleDownloadBackup = (backupId: string) => {
    toast.success('Backup download started');
  };

  const handleDeleteBackup = (backupId: string) => {
    setBackups(backups.filter((b) => b.id !== backupId));
    toast.success('Backup deleted');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900">Data Management</h1>
        <p className="text-surface-600 mt-2">Manage backups, imports, and exports</p>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <Button onClick={() => setShowBackupModal(true)}>
              💾 Create Backup
            </Button>
            <Button variant="outline" onClick={() => setShowRestoreModal(true)}>
              ↩️ Restore Backup
            </Button>
            <Button variant="outline" onClick={() => setShowExportModal(true)}>
              📤 Export Data
            </Button>
            <Button variant="outline">📥 Import Data</Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup Settings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Backup Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={backupSettings.autoBackup}
              onChange={(e) =>
                setBackupSettings({
                  ...backupSettings,
                  autoBackup: e.target.checked,
                })
              }
              className="rounded"
            />
            <span className="text-surface-900">Enable Automatic Backups</span>
          </label>

          {backupSettings.autoBackup && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
              <div>
                <label className="block text-sm font-medium text-surface-900 mb-2">
                  Frequency
                </label>
                <select
                  value={backupSettings.frequency}
                  onChange={(e) =>
                    setBackupSettings({
                      ...backupSettings,
                      frequency: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-900 mb-2">
                  Backup Time
                </label>
                <input
                  type="time"
                  value={backupSettings.backupTime}
                  onChange={(e) =>
                    setBackupSettings({
                      ...backupSettings,
                      backupTime: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-900 mb-2">
                  Retention (days)
                </label>
                <input
                  type="number"
                  value={backupSettings.retention}
                  onChange={(e) =>
                    setBackupSettings({
                      ...backupSettings,
                      retention: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          <Button>Save Settings</Button>
        </CardContent>
      </Card>

      {/* Backups List */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-surface-600 mb-4">No backups yet</p>
              <Button onClick={() => setShowBackupModal(true)}>
                Create First Backup
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="p-4 border border-surface-200 rounded-lg hover:bg-surface-50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-surface-900">
                        {backup.name}
                      </p>
                      <p className="text-sm text-surface-600">{backup.date}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        variant={
                          backup.status === 'completed'
                            ? 'success'
                            : backup.status === 'in_progress'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {backup.status}
                      </Badge>
                      <Badge variant="secondary">{backup.type}</Badge>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-surface-600">
                      Size: {backup.size}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadBackup(backup.id)}
                      >
                        📥 Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreBackup(backup.id)}
                      >
                        ↩️ Restore
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBackup(backup.id)}
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Backup Modal */}
      <Modal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        title="Create Backup"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              💾 This will create a complete backup of all your data including bookings, guests, payments, and settings.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-surface-900">Backup all data</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-surface-900">Include settings</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-surface-900">Include files</span>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-surface-200">
            <Button
              variant="outline"
              onClick={() => setShowBackupModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateBackup}>Create Backup</Button>
          </div>
        </div>
      </Modal>

      {/* Restore Modal */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        title="Restore Backup"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900 font-medium mb-2">
              ⚠️ Warning: Restoring will overwrite current data
            </p>
            <p className="text-sm text-red-700">
              Make sure you have a backup of your current data before proceeding.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-900 mb-2">
              Select Backup to Restore
            </label>
            <select className="w-full px-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              {backups.map((backup) => (
                <option key={backup.id} value={backup.id}>
                  {backup.name} ({backup.date})
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" />
            <span className="text-sm text-surface-900">
              I understand this will overwrite current data
            </span>
          </label>

          <div className="flex gap-3 justify-end pt-4 border-t border-surface-200">
            <Button
              variant="outline"
              onClick={() => setShowRestoreModal(false)}
            >
              Cancel
            </Button>
            <Button variant="danger">Restore Backup</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
