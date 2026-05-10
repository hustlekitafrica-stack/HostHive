'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { Tabs, TabContent } from '@/components/ui/Tabs';

export default function DashboardAnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: '2025-01-01',
    endDate: '2025-12-31',
  });

  // Sample data
  const monthlyRevenue = [
    { label: 'Jan', value: 45000 },
    { label: 'Feb', value: 52000 },
    { label: 'Mar', value: 48000 },
    { label: 'Apr', value: 61000 },
    { label: 'May', value: 58000 },
    { label: 'Jun', value: 72000 },
  ];

  const monthlyOccupancy = [
    { label: 'Jan', value: 65 },
    { label: 'Feb', value: 72 },
    { label: 'Mar', value: 68 },
    { label: 'Apr', value: 78 },
    { label: 'May', value: 75 },
    { label: 'Jun', value: 85 },
  ];

  const propertyRevenue = [
    { label: 'Property A', value: 180000 },
    { label: 'Property B', value: 145000 },
    { label: 'Property C', value: 125000 },
  ];

  const guestSources = [
    { label: 'Airbnb', value: 240000 },
    { label: 'Booking.com', value: 180000 },
    { label: 'Direct', value: 95000 },
    { label: 'Other', value: 35000 },
  ];

  const dashboardTabs = [
    { label: 'Overview', value: 'overview', icon: '📊' },
    { label: 'Revenue', value: 'revenue', icon: '💰' },
    { label: 'Occupancy', value: 'occupancy', icon: '📈' },
    { label: 'Guests', value: 'guests', icon: '👥' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-surface-900">Dashboard</h1>
        <p className="text-surface-600 mt-2">Your business at a glance</p>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
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
            <Button>Apply</Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-surface-600">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              KSH 450,000
            </div>
            <p className="text-xs text-surface-500 mt-2">
              <span className="text-green-600 font-semibold">↑ 12%</span> vs last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-surface-600">
              Avg Occupancy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">73.8%</div>
            <p className="text-xs text-surface-500 mt-2">
              <span className="text-green-600 font-semibold">↑ 5%</span> vs last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-surface-600">
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary-600">24</div>
            <p className="text-xs text-surface-500 mt-2">
              <span className="text-green-600 font-semibold">↑ 8%</span> vs last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-surface-600">
              Avg ADR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent-600">
              KSH 6,250
            </div>
            <p className="text-xs text-surface-500 mt-2">
              <span className="text-green-600 font-semibold">↑ 3%</span> vs last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs items={dashboardTabs}>
        <TabContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-surface-50 rounded-lg">
                  <span className="font-medium text-surface-900">Active Properties</span>
                  <span className="text-2xl font-bold text-primary-600">3</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-surface-50 rounded-lg">
                  <span className="font-medium text-surface-900">Total Guests</span>
                  <span className="text-2xl font-bold text-blue-600">127</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-surface-50 rounded-lg">
                  <span className="font-medium text-surface-900">Pending Payments</span>
                  <span className="text-2xl font-bold text-red-600">KSH 85,000</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-surface-50 rounded-lg">
                  <span className="font-medium text-surface-900">Total Expenses</span>
                  <span className="text-2xl font-bold text-orange-600">KSH 125,000</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 pb-3 border-b border-surface-200">
                  <span className="text-xl">✅</span>
                  <div>
                    <p className="font-medium text-surface-900">Payment Received</p>
                    <p className="text-sm text-surface-600">KSH 25,000 from John Doe</p>
                    <p className="text-xs text-surface-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 pb-3 border-b border-surface-200">
                  <span className="text-xl">📅</span>
                  <div>
                    <p className="font-medium text-surface-900">New Booking</p>
                    <p className="text-sm text-surface-600">Jane Smith booked Property B</p>
                    <p className="text-xs text-surface-500">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="font-medium text-surface-900">Low Occupancy Alert</p>
                    <p className="text-sm text-surface-600">Property A below 50%</p>
                    <p className="text-xs text-surface-500">1 day ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Property Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Property Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {propertyRevenue.map((prop, index) => (
                  <div key={prop.label} className="p-4 bg-surface-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-surface-900">{prop.label}</p>
                      <p className="font-bold text-green-600">
                        KSH {prop.value.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 text-sm text-surface-600">
                      <span>Occupancy: {75 + index * 3}%</span>
                      <span>•</span>
                      <span>ADR: KSH {5500 + index * 500}</span>
                      <span>•</span>
                      <span>Bookings: {8 - index}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabContent>

        <TabContent value="revenue">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart data={monthlyRevenue} height={300} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Property</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={propertyRevenue} height={300} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Source</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={guestSources} height={300} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {guestSources.map((source) => {
                  const total = guestSources.reduce((sum, s) => sum + s.value, 0);
                  const percentage = ((source.value / total) * 100).toFixed(1);
                  return (
                    <div key={source.label}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-surface-900">
                          {source.label}
                        </span>
                        <span className="text-sm font-bold text-surface-900">
                          {percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-surface-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-surface-500 mt-1">
                        KSH {source.value.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabContent>

        <TabContent value="occupancy">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Occupancy Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart data={monthlyOccupancy} height={300} color="#3b82f6" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Occupancy by Property</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Property A', occupancy: 75 },
                    { name: 'Property B', occupancy: 78 },
                    { name: 'Property C', occupancy: 68 },
                  ].map((prop) => (
                    <div key={prop.name}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-surface-900">
                          {prop.name}
                        </span>
                        <span className="text-sm font-bold text-surface-900">
                          {prop.occupancy}%
                        </span>
                      </div>
                      <div className="w-full bg-surface-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full"
                          style={{ width: `${prop.occupancy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Occupancy Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-900 font-medium">Peak Season</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">Jun-Aug</p>
                    <p className="text-xs text-green-700 mt-1">85% avg occupancy</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-900 font-medium">Off Season</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-2">Jan-Mar</p>
                    <p className="text-xs text-yellow-700 mt-1">65% avg occupancy</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900 font-medium">Avg Stay</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">4.2 nights</p>
                    <p className="text-xs text-blue-700 mt-1">Across all properties</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabContent>

        <TabContent value="guests">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Guest Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-surface-50 rounded-lg">
                  <p className="text-sm text-surface-600 mb-1">Total Guests</p>
                  <p className="text-3xl font-bold text-primary-600">127</p>
                </div>
                <div className="p-4 bg-surface-50 rounded-lg">
                  <p className="text-sm text-surface-600 mb-1">Repeat Guests</p>
                  <p className="text-3xl font-bold text-blue-600">34</p>
                  <p className="text-xs text-surface-500 mt-1">26.8% of total</p>
                </div>
                <div className="p-4 bg-surface-50 rounded-lg">
                  <p className="text-sm text-surface-600 mb-1">Avg Rating</p>
                  <p className="text-3xl font-bold text-yellow-600">4.8/5</p>
                  <p className="text-xs text-surface-500 mt-1">Based on 89 reviews</p>
                </div>
                <div className="p-4 bg-surface-50 rounded-lg">
                  <p className="text-sm text-surface-600 mb-1">Avg Spend</p>
                  <p className="text-3xl font-bold text-green-600">KSH 18,750</p>
                  <p className="text-xs text-surface-500 mt-1">Per guest</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guest Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={guestSources} height={300} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Guest Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-surface-200 rounded-lg">
                    <h3 className="font-semibold text-surface-900 mb-3">
                      Most Common Guest Type
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-surface-600">Couples</span>
                        <Badge variant="success">45%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-surface-600">Families</span>
                        <Badge variant="info">35%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-surface-600">Solo Travelers</span>
                        <Badge variant="default">20%</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border border-surface-200 rounded-lg">
                    <h3 className="font-semibold text-surface-900 mb-3">
                      Top Countries
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-surface-600">Kenya</span>
                        <Badge variant="success">40%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-surface-600">USA</span>
                        <Badge variant="info">25%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-surface-600">UK</span>
                        <Badge variant="default">15%</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabContent>
      </Tabs>

      {/* Export Section */}
      <div className="mt-8 flex gap-4 justify-end">
        <Button variant="outline">📥 Download Report</Button>
        <Button variant="outline">📊 Export Data</Button>
        <Button>📧 Email Report</Button>
      </div>
    </div>
  );
}
