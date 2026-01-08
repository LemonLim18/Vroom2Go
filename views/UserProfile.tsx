import React from 'react';
import { MOCK_VEHICLES, MOCK_BOOKINGS } from '../constants';
import { Car, Wrench, CreditCard, Plus, Clock, FileText } from 'lucide-react';

export const UserProfile: React.FC = () => {
  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-end border-b border-base-300 pb-4">
        <div>
           <h1 className="text-4xl font-bold">My Profile</h1>
           <p className="opacity-70 mt-1">Manage your vehicles, bookings, and payments.</p>
        </div>
        <div className="avatar placeholder">
            <div className="bg-neutral text-neutral-content rounded-full w-12">
                <span className="text-xl">JD</span>
            </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Garage & Payment */}
        <div className="lg:col-span-1 space-y-8">
            
            {/* My Garage */}
            <div className="card bg-base-100 shadow-md border border-base-200">
                <div className="card-body">
                   <div className="flex justify-between items-center mb-2">
                      <h2 className="card-title flex items-center gap-2">
                         <Car className="w-5 h-5 text-primary" /> My Garage
                      </h2>
                      <button className="btn btn-ghost btn-sm btn-circle"><Plus className="w-4 h-4" /></button>
                   </div>
                   <div className="space-y-4">
                      {MOCK_VEHICLES.map(vehicle => (
                          <div key={vehicle.id} className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg transition-colors cursor-pointer">
                             <img src={vehicle.image} alt={vehicle.model} className="w-16 h-12 object-cover rounded-md" />
                             <div>
                                <div className="font-bold">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                                <div className="text-xs opacity-60">VIN: {vehicle.vin}</div>
                             </div>
                          </div>
                      ))}
                   </div>
                </div>
            </div>

            {/* Payment Methods */}
            <div className="card bg-base-100 shadow-md border border-base-200">
                <div className="card-body">
                   <div className="flex justify-between items-center mb-2">
                      <h2 className="card-title flex items-center gap-2">
                         <CreditCard className="w-5 h-5 text-secondary" /> Wallet
                      </h2>
                      <button className="btn btn-ghost btn-sm btn-circle"><Plus className="w-4 h-4" /></button>
                   </div>
                   <div className="space-y-2">
                       <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                           <div className="flex items-center gap-3">
                               <div className="w-10 h-6 bg-blue-900 rounded opacity-80"></div>
                               <span className="font-medium">Visa ending 4242</span>
                           </div>
                           <span className="badge badge-sm">Default</span>
                       </div>
                   </div>
                </div>
            </div>
        </div>

        {/* Right Column: History & Stats */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Active Bookings (Mock Reuse) */}
            <div className="card bg-base-100 shadow-md border border-base-200">
                <div className="card-body">
                   <h2 className="card-title flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-accent" /> Recent Activity
                   </h2>
                   <div className="overflow-x-auto">
                       <table className="table">
                           <thead>
                               <tr>
                                   <th>Service</th>
                                   <th>Shop</th>
                                   <th>Date</th>
                                   <th>Status</th>
                                   <th>Total</th>
                               </tr>
                           </thead>
                           <tbody>
                               {MOCK_BOOKINGS.map(booking => (
                                   <tr key={booking.id} className="hover:bg-base-200/50">
                                       <td className="font-bold">{booking.serviceName}</td>
                                       <td>{booking.shopName}</td>
                                       <td>{booking.date}</td>
                                       <td>
                                           <div className={`badge ${booking.status === 'Completed' ? 'badge-success text-white' : 'badge-warning'} badge-sm`}>
                                              {booking.status}
                                           </div>
                                       </td>
                                       <td>{booking.price}</td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
                </div>
            </div>

            {/* Stats / Other */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="stat bg-base-100 shadow rounded-box border border-base-200">
                    <div className="stat-figure text-primary">
                        <FileText className="w-8 h-8" />
                    </div>
                    <div className="stat-title">Total Services</div>
                    <div className="stat-value text-primary">12</div>
                    <div className="stat-desc">Since joining in 2021</div>
                </div>
                <div className="stat bg-base-100 shadow rounded-box border border-base-200">
                    <div className="stat-figure text-secondary">
                        <Wrench className="w-8 h-8" />
                    </div>
                    <div className="stat-title">Total Spent</div>
                    <div className="stat-value text-secondary">$2,450</div>
                    <div className="stat-desc">Est. savings: $400</div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};