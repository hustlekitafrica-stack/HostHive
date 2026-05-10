'use client';

import { useState } from 'react';
import { Calendar } from '@/components/calendar/Calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface BlockedDate {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export default function CalendarPage() {
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockForm, setBlockForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });

  const handleBlockDate = (startDate: string, endDate: string) => {
    setBlockForm({
      startDate,
      endDate,
      reason: '',
    });
    setShowBlockModal(true);
  };

  const handleSubmitBlock = async () => {
    if (!blockForm.startDate || !blockForm.endDate || !blockForm.reason) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      // TODO: Call API to create blocked date
      const newBlock: BlockedDate = {
        id: Math.random().toString(),
        startDate: blockForm.startDate,
        endDate: blockForm.endDate,
        reason: blockForm.reason,
      };

      setBlockedDates([...blockedDates, newBlock]);
      setShowBlockModal(false);
      setBlockForm({ startDate: '', endDate: '', reason: '' });
      toast.success('Date range blocked successfully');
    } catch (error) {
      toast.error('Failed to block dates');
    }
  };

  const handleRemoveBlock = (id: string) => {
    setBlockedDates(blockedDates.filter((b) => b.id !== id));
    toast.success('Block removed');
  };

  const calendarEvents = blockedDates.map((block) => ({
    date: block.startDate,
    type: 'blocked' as const,
    title: block.reason,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900">Calendar</h1>
        <p className="text-surface-600 mt-2">Manage availability and blocked dates</p>
      </div>

      {/* Property Selector */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Property</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="flex-1 px-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Choose a property...</option>
              <option value="prop1">Sample Property 1</option>
              <option value="prop2">Sample Property 2</option>
            </select>
            <Button disabled={!selectedProperty}>View Calendar</Button>
          </div>
        </CardContent>
      </Card>

      {selectedProperty && (
        <>
          {/* Calendar */}
          <div className="mb-8">
            <Calendar
              events={calendarEvents}
              onBlockDate={handleBlockDate}
              onDateClick={(date) => {
                toast.success(`Selected: ${date}`);
              }}
            />
          </div>

          {/* Blocked Dates List */}
          <Card>
            <CardHeader>
              <CardTitle>Blocked Dates</CardTitle>
            </CardHeader>
            <CardContent>
              {blockedDates.length === 0 ? (
                <p className="text-surface-600 text-center py-8">
                  No blocked dates yet
                </p>
              ) : (
                <div className="space-y-3">
                  {blockedDates.map((block) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-surface-900">
                          {block.startDate} to {block.endDate}
                        </p>
                        <p className="text-sm text-surface-600">{block.reason}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveBlock(block.id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Block Date Modal */}
      <Modal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        title="Block Dates"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Start Date"
            type="date"
            value={blockForm.startDate}
            onChange={(e) =>
              setBlockForm({ ...blockForm, startDate: e.target.value })
            }
          />
          <Input
            label="End Date"
            type="date"
            value={blockForm.endDate}
            onChange={(e) =>
              setBlockForm({ ...blockForm, endDate: e.target.value })
            }
          />
          <Input
            label="Reason"
            placeholder="e.g., Maintenance, Cleaning, Personal use"
            value={blockForm.reason}
            onChange={(e) =>
              setBlockForm({ ...blockForm, reason: e.target.value })
            }
          />
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowBlockModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitBlock}>
              Block Dates
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
