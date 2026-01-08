import React from 'react';
import { MOCK_BOOKINGS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, DollarSign, Clock, CheckCircle } from 'lucide-react';

const data = [
  { name: 'Mon', revenue: 400 },
  { name: 'Tue', revenue: 300 },
  { name: 'Wed', revenue: 600 },
  { name: 'Thu', revenue: 800 },
  { name: 'Fri', revenue: 500 },
  { name: 'Sat', revenue: 900 },
  { name: 'Sun', revenue: 200 },
];

export const ShopDashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
         <h1 className="text-3xl font-bold">Shop Dashboard</h1>
         <button className="btn btn-primary">Add Service</button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 shadow rounded-box border border-base-200">
          <div className="stat-figure text-secondary">
            <DollarSign className="w-8 h-8" />
          </div>
          <div className="stat-title">Weekly Revenue</div>
          <div className="stat-value text-secondary">$3,700</div>
          <div className="stat-desc">↗︎ 14% more than last week</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-box border border-base-200">
          <div className="stat-figure text-primary">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="stat-title">New Bookings</div>
          <div className="stat-value text-primary">12</div>
          <div className="stat-desc">4 pending approval</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-box border border-base-200">
          <div className="stat-figure text-accent">
            <Clock className="w-8 h-8" />
          </div>
          <div className="stat-title">Avg. Response</div>
          <div className="stat-value text-accent">18m</div>
          <div className="stat-desc">Top 5% of shops</div>
        </div>
        
         <div className="stat bg-base-100 shadow rounded-box border border-base-200">
          <div className="stat-figure text-success">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="stat-title">Completion Rate</div>
          <div className="stat-value text-success">98%</div>
          <div className="stat-desc">No disputes filed</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 card bg-base-100 shadow border border-base-200">
          <div className="card-body">
            <h2 className="card-title mb-4">Revenue Overview</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{fill: 'transparent'}}
                  />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="card bg-base-100 shadow border border-base-200">
          <div className="card-body">
             <h2 className="card-title mb-2">Upcoming Jobs</h2>
             <div className="space-y-4">
               {MOCK_BOOKINGS.map((booking) => (
                 <div key={booking.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div>
                      <div className="font-bold text-sm">{booking.serviceName}</div>
                      <div className="text-xs text-base-content/60">{booking.date}</div>
                    </div>
                    <div className={`badge ${booking.status === 'Confirmed' ? 'badge-primary' : 'badge-ghost'} badge-sm`}>
                      {booking.status}
                    </div>
                 </div>
               ))}
               <button className="btn btn-sm btn-ghost w-full">View All Bookings</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
