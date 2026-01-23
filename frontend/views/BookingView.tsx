
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Shop, Service, Vehicle, BookingMethod, Quote } from '../types';
import { 
  Calendar, 
  Car, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  Truck, 
  MapPin, 
  Building2, 
  Home, 
  Navigation, 
  ChevronRight, 
  Zap, 
  Wrench,
  Shield,
  Lock,
  Apple,
  Wallet,
  AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import { themeConfig } from '../utils/alerts';

// Local Quote interface removed - using imported type from ../types
// Ensure Quote is imported in line 4:
// import { Shop, Service, Vehicle, BookingMethod, Quote } from '../types';

interface BookingViewProps {
  shop: Shop;
  initialServiceId?: string;
  quote?: Quote; // New optional prop
  onConfirm: () => void;
  onCancel: () => void;
}

type PaymentMethod = 'card' | 'apple' | 'paypal';

interface SavedCard {
  id: string;
  last4: string;
  brand: 'visa' | 'mastercard';
  isDefault: boolean;
}

const SAVED_CARDS: SavedCard[] = [
  { id: 'card1', last4: '4242', brand: 'visa', isDefault: true },
  { id: 'card2', last4: '1234', brand: 'mastercard', isDefault: false },
];

export const BookingView: React.FC<BookingViewProps> = ({ shop, initialServiceId, quote, onConfirm, onCancel }) => {
  // Use quote service if available, else initial, else first shop service
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    quote?.serviceId || initialServiceId || shop.services?.[0] || 'general'
  );

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  // Pre-select vehicle from quote if present
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(quote?.vehicleId || '');

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingMethod, setBookingMethod] = useState<BookingMethod>(BookingMethod.DROP_OFF);
  const [address, setAddress] = useState('123 Maple Street, Springfield');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [selectedCardId, setSelectedCardId] = useState<string>(SAVED_CARDS[0].id);
  const [showAddCard, setShowAddCard] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Time slots from shop availability
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch available slots when date changes
  useEffect(() => {
    if (!selectedDate || !shop.id) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedTime(''); // Reset time when date changes
      try {
        console.log(`[BookingView] Fetching availability for shop ${shop.id} on date ${selectedDate}`);
        const { data } = await api.get(`/shops/${shop.id}/availability?date=${selectedDate}`);
        console.log(`[BookingView] Received ${data.length} slots:`, data);
        // Only show slots that are NOT booked
        const available = data.filter((s: any) => !s.isBooked);
        console.log(`[BookingView] ${available.length} slots are available (not booked)`);
        setAvailableSlots(available);
      } catch (error) {
        console.error('Failed to fetch available slots', error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, shop.id]);


  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const { data } = await api.get('/vehicles');
        const userVehicles = data;
        // Map if needed, or assume backend format is close enough if using 'any' or updating types
        const mappedUserVehicles = userVehicles.map((v: any) => ({
            id: v.id,
            make: v.make,
            model: v.model,
            year: v.year,
            type: v.type, // Enum match expected
            vin: v.vin,
            image: v.imageUrl || v.image || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1000',
            mileage: v.mileage,
            licensePlate: v.licensePlate
        }));

        setVehicles(mappedUserVehicles);

        // Only default select if NO quote and NO pre-selection
        if (!selectedVehicleId && !quote && mappedUserVehicles.length > 0) {
            setSelectedVehicleId(mappedUserVehicles[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch vehicles', error);
      }
    };
    fetchVehicles();
  }, [quote, selectedVehicleId]); // Add dependencies

  // Show toast notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Get service from shop's services array (handles ShopService with nested service object)
  const selectedService = (() => {
    if (!shop.services || !Array.isArray(shop.services)) return null;
    const found = (shop.services as any[]).find((s) => {
      if (typeof s === 'object' && s !== null && s.service) {
        return String(s.service.id) === String(selectedServiceId) || String(s.id) === String(selectedServiceId);
      }
      return typeof s === 'object' && s !== null && String(s.id) === String(selectedServiceId);
    });
    if (!found) return null;
    return found.service || found;
  })();

  // PRICING LOGIC
  let basePrice = 0;
  let totalPrice = 0;
  let depositAmount = 0;
  let taxes = 0;

  const TOW_FEE = 85.00;
  const MOBILE_FEE = 45.00;
  const PLATFORM_FEE = 2.99;
  const TAX_RATE = 0.0825;

  let extraFee = 0;
  let feeLabel = '';

  if (bookingMethod === BookingMethod.TOWING) {
    extraFee = TOW_FEE;
    feeLabel = 'Recovery Tow';
  } else if (bookingMethod === BookingMethod.MOBILE) {
    extraFee = MOBILE_FEE;
    feeLabel = 'Mobile Pit Service';
  }

  if (quote) {
    // Override pricing with Quote data
    // If quote has estimatedTotal, use it as the base 'service' part (minus platform/extra fees if needed, or just treat as base)
    // For simplicity, we treat quote.estimatedTotal as the Service + Parts + Labor + Tax (Shop side)
    // We add Platform Fee & Extra Fee (Tow) on top.

    // NOTE: quote.estimatedTotal ALREADY includes taxes/shop fees typically.
    // So we use it as the main subtotal.
    basePrice = quote.estimatedTotal;
    
    // Use quote's tax if available, otherwise 0
    // @ts-ignore - Quote type includes taxes usually
    taxes = quote.taxes || 0;

    const finalTotal = basePrice + extraFee + PLATFORM_FEE;
    totalPrice = finalTotal;

    // Deposit uses shop % from quote if available, or default
    // Using shop.depositPercent || 25 to match QuoteDetailView defaults
    const depositRate = (shop.depositPercent || 25) / 100;
    depositAmount = totalPrice * depositRate;

  } else {
    // Standard Direct Booking Logic
    const basePriceString = shop.customPrices?.[selectedServiceId] || '0';
    basePrice = parseFloat(basePriceString.replace(/[^0-9.]/g, ''));

    const subtotal = basePrice + extraFee;
    taxes = subtotal * TAX_RATE;
    totalPrice = subtotal + taxes + PLATFORM_FEE;
    
    const depositRate = (shop.depositPercent || 25) / 100;
    depositAmount = totalPrice * depositRate;
  }

  const remainingBalance = totalPrice - depositAmount;

  const handleConfirm = async () => {
    if (!selectedVehicleId || !selectedDate || !selectedTime) return;

    // Find the selected slot object to get the real time
    const selectedSlot = availableSlots.find(s => s.id.toString() === selectedTime);
    if (!selectedSlot) {
        showToast('Selected time slot is no longer available');
        return;
    }

    // Format time correctly from the slot's startTime
    // FIX: Project 1970 time to current date to avoid historical timezone offsets
    const slotTimeDate = new Date(selectedSlot.startTime);
    const time = new Date(); // Use today
    time.setUTCHours(slotTimeDate.getUTCHours(), slotTimeDate.getUTCMinutes(), 0, 0);

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    // Warning confirmation for non-refundable deposit
    const result = await Swal.fire({
      ...themeConfig,
      title: 'Confirm Deposit Payment',
      html: `
        <div class="text-left">
           <p class="mb-4">You are about to pay a <strong>$${depositAmount.toFixed(2)}</strong> deposit to secure your slot.</p>
           <div class="alert alert-warning text-sm">
             <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             <span><strong>Important:</strong> This deposit is non-refundable if you decide to cancel this booking afterwards.</span>
           </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Pay Deposit',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    setIsProcessing(true);
    try {
      // Strict API Only - No Mock Fallbacks
        const payload = {
        shopId: Number(shop.id),
        // FIX: Send ID to ensure exact slot matching
        timeSlotId: Number(selectedSlot.id),
        vehicleId: selectedVehicleId,
        serviceId: selectedServiceId ? Number(selectedServiceId) : null,
        quoteId: quote?.id,
        scheduledDate: selectedDate,
        scheduledTime: `${selectedDate}T${timeString}:00`, // ISO YYYY-MM-DDTHH:MM:00
        method: bookingMethod,
        notes: quote ? `Booking from Quote #${quote.id}` : `Service: ${selectedService?.name || 'General'}`,
        status: 'PENDING'
      };

      console.log('Creating booking via API:', payload);
      await api.post('/bookings', payload);

      setIsSuccess(true);
    } catch (error: any) {
      console.error('Booking failed', error);
      const msg = error.response?.data?.message || 'Booking failed. Please try again.';
      showToast(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] animate-in zoom-in-95 duration-500 text-center">
        <div className="w-24 h-24 bg-primary text-black rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(250,204,21,0.3)] rotate-3">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-4">Pit Stop Reserved!</h1>
        <p className="text-xl text-slate-400 font-medium max-w-md mb-8">
          Your arrival at <span className="text-white font-black italic">{shop.name}</span> is logged. 
          {bookingMethod === BookingMethod.TOWING && " A recovery unit is being dispatched."}
        </p>
        
        {/* Deposit Confirmation */}
        <div className="glass-card rounded-2xl p-6 border border-green-500/20 bg-green-500/5 mb-8 max-w-md w-full">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-5 h-5 text-green-400" />
            <span className="font-bold text-green-400">Deposit Secured</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Amount Held in Escrow</span>
            <span className="text-2xl font-black">${depositAmount.toFixed(2)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            This amount will be applied to your final invoice. Remaining balance of ${remainingBalance.toFixed(2)} due at service completion.
          </p>
        </div>
        
        <button className="btn btn-primary btn-lg rounded-2xl px-12 font-black italic uppercase tracking-tighter" onClick={onConfirm}>
          Return to Garage
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 slide-in-from-bottom-4 max-w-5xl mx-auto pb-20">
      <button onClick={onCancel} className="btn btn-ghost mb-6 text-slate-500 uppercase font-black italic tracking-tighter hover:text-white">
        ← Cancel Entry
      </button>

      <div className="glass-card rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden">
        <div className="bg-slate-800/50 p-8 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">Reservation Manifest</h2>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Order #V2-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
            </div>
            <Zap className="w-8 h-8 text-primary animate-pulse" />
        </div>
        
        <div className="p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Manifest Form */}
            <div className="space-y-8">
              
              <section>
                <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                   <ChevronRight className="w-4 h-4" /> Select Vehicle
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {vehicles.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-800/30 border border-dashed border-slate-600 text-center text-slate-400">
                        No vehicles found. Go to your Garage to add one.
                    </div>
                  ) : vehicles.map(v => (
                    <div 
                      key={v.id} 
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${selectedVehicleId === v.id ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(250,204,21,0.1)]' : 'bg-slate-800/30 border-white/5 hover:border-white/10'}`}
                      onClick={() => setSelectedVehicleId(v.id)}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${selectedVehicleId === v.id ? 'bg-primary text-black' : 'bg-slate-800 text-slate-500'}`}>
                        {v.image ? (
                          <img src={v.image} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />
                        ) : (
                          <Car className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-black italic uppercase tracking-tighter">{v.year} {v.make} {v.model}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">{v.licensePlate || 'NO PLATE'}</div>
                      </div>
                      {selectedVehicleId === v.id && <CheckCircle className="w-5 h-5 text-primary" />}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                   <ChevronRight className="w-4 h-4" /> Service Type
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { id: BookingMethod.DROP_OFF, label: 'Standard', sub: '+$0', description: 'Visit our garage', icon: Building2 },
                    { id: BookingMethod.TOWING, label: 'Recovery', sub: `+$${TOW_FEE}`, description: 'We Tow Your Vehicle', icon: Truck },
                    { id: BookingMethod.MOBILE, label: 'Mobile', sub: `+$${MOBILE_FEE}`, description: 'We Come To You', icon: Home }
                  ].map((method) => (
                    <div 
                      key={method.id}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all text-center flex flex-col items-center gap-2 ${bookingMethod === method.id ? 'bg-primary text-black border-primary shadow-[0_0_20px_rgba(250,204,21,0.2)]' : 'bg-slate-800/30 border-white/5 hover:border-white/10'}`}
                      onClick={() => setBookingMethod(method.id as BookingMethod)}
                    >
                      <method.icon className="w-6 h-6 mb-1" />
                      <div className="font-black italic uppercase tracking-tighter text-xs">{method.label}</div>
                      <div className={`text-[8px] font-black uppercase tracking-widest ${bookingMethod === method.id ? 'text-black/60' : 'text-slate-500'}`}>{method.description}</div>
                      <div className={`text-[9px] font-black uppercase tracking-widest ${bookingMethod === method.id ? 'text-black/60' : 'text-primary'}`}>{method.sub}</div>
                    </div>
                  ))}
                </div>
                {(bookingMethod === BookingMethod.TOWING || bookingMethod === BookingMethod.MOBILE) && (
                   <div className="mt-4 animate-in slide-in-from-top-2">
                      <div className="text-[12px] font-black uppercase tracking-widest mb-2">Service Location</div>

                      <input 
                        className="input bg-slate-800/50 border-white/5 w-full rounded-xl text-sm font-bold placeholder-slate-600 focus:border-primary transition-all"
                        placeholder="Coordinates / Street Address..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                   </div>
                )}
              </section>

              <section>
                <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                   <ChevronRight className="w-4 h-4" /> Service Date & Time
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" className="col-span-2 input bg-slate-800/50 border-white/5 rounded-xl font-bold italic w-full" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                  <div className={`col-span-2 grid grid-cols-3 sm:grid-cols-4 gap-2 ${loadingSlots ? 'opacity-50 pointer-events-none' : ''}`}>
                    {availableSlots.length > 0 ? (
                      availableSlots.map(slot => {
                        // FIX: Project 1970 time to current date to avoid historical timezone offsets (e.g. SG 1970 was +7.5)
                        const slotDate = new Date(slot.startTime);
                        const time = new Date(); // Use today
                        time.setUTCHours(slotDate.getUTCHours(), slotDate.getUTCMinutes(), 0, 0);
                        
                        const timeStr = time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                        const isSelected = selectedTime === slot.id.toString();
                        
                        return (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedTime(slot.id.toString())}
                            className={`
                              btn btn-sm h-10 border-white/10 font-bold transition-all relative overflow-hidden group
                              flex items-center justify-center whitespace-nowrap gap-1.5 px-1
                              ${isSelected 
                                ? 'bg-yellow-500 hover:bg-yellow-400 text-black border-none shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-105 z-10' 
                                : 'bg-slate-800/50 hover:bg-yellow-500/20 hover:border-yellow-500/50 text-slate-300 hover:text-white'
                              }
                            `}
                          >
                            {isSelected && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 translate-x-[-150%] animate-[shimmer_1s_infinite]" />
                            )}
                            <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-black' : 'text-slate-500 group-hover:text-yellow-400'}`} />
                            <span className="text-[13px]">{timeStr}</span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="col-span-full py-8 text-center border border-dashed border-white/10 rounded-xl bg-slate-800/30">
                        {loadingSlots ? (
                          <span className="loading loading-dots loading-md text-primary" />
                        ) : selectedDate ? (
                          <div className="text-slate-500 flex flex-col items-center">
                            <Clock className="w-8 h-8 mb-2 opacity-50" />
                            <span>No slots available</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Select a date above</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {selectedDate && !loadingSlots && availableSlots.length === 0 && (
                  <p className="text-warning text-xs mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> No available slots for this date. Please try another date.
                  </p>
                )}
              </section>

              {/* Payment Method Section */}
              <section>
                <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                   <ChevronRight className="w-4 h-4" /> Payment Method
                </h3>
                
                {/* Payment Type Tabs */}
                <div className="flex gap-2 mb-4">
                  <button 
                    onClick={() => setPaymentMethod('card')}
                    className={`btn btn-sm gap-2 ${paymentMethod === 'card' ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    <CreditCard className="w-4 h-4" /> Card
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('apple')}
                    className={`btn btn-sm gap-2 ${paymentMethod === 'apple' ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    <Apple className="w-4 h-4" /> Apple Pay
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('paypal')}
                    className={`btn btn-sm gap-2 ${paymentMethod === 'paypal' ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    <Wallet className="w-4 h-4" /> PayPal
                  </button>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-3">
                    {SAVED_CARDS.map(card => (
                      <div 
                        key={card.id}
                        onClick={() => setSelectedCardId(card.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${
                          selectedCardId === card.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-slate-800/30 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className={`w-12 h-8 rounded ${card.brand === 'visa' ? 'bg-gradient-to-r from-blue-600 to-blue-800' : 'bg-gradient-to-r from-orange-500 to-red-500'}`}></div>
                        <div className="flex-1">
                          <span className="font-bold">•••• {card.last4}</span>
                          {card.isDefault && <span className="badge badge-xs badge-primary ml-2">Default</span>}
                        </div>
                        {selectedCardId === card.id && <CheckCircle className="w-5 h-5 text-primary" />}
                      </div>
                    ))}
                    <button 
                      onClick={() => setShowAddCard(!showAddCard)}
                      className="btn btn-ghost btn-sm w-full gap-2"
                    >
                      <CreditCard className="w-4 h-4" /> Add New Card
                    </button>
                    
                    {showAddCard && (
                      <div className="p-4 bg-slate-800/50 rounded-xl space-y-3 animate-in slide-in-from-top-2">
                        <input className="input input-sm w-full bg-slate-700 border-white/10" placeholder="Card Number" />
                        <div className="grid grid-cols-2 gap-3">
                          <input className="input input-sm bg-slate-700 border-white/10" placeholder="MM/YY" />
                          <input className="input input-sm bg-slate-700 border-white/10" placeholder="CVC" />
                        </div>
                        <button onClick={() => { showToast('Card saved successfully!'); setShowAddCard(false); }} className="btn btn-primary btn-sm w-full">Save Card</button>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'apple' && (
                  <div className="p-6 bg-slate-800/30 rounded-xl text-center">
                    <Apple className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p className="text-sm text-slate-400">Apple Pay will be prompted at checkout</p>
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div className="p-6 bg-slate-800/30 rounded-xl text-center">
                    <Wallet className="w-12 h-12 mx-auto mb-3 text-blue-400" />
                    <p className="text-sm text-slate-400">You'll be redirected to PayPal</p>
                  </div>
                )}
              </section>

            </div>

            {/* Price Summary Panel */}
            <div className="bg-slate-900/80 p-8 rounded-[2rem] border border-white/5 h-fit shadow-2xl relative">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                 <Wrench className="w-32 h-32 rotate-12" />
               </div>
               
               <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6">Service Invoice</h3>
               
               <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                     <span className="text-slate-400 text-sm">Base Service</span>
                     <span className="font-bold">${basePrice.toFixed(2)}</span>
                  </div>
                  
                  {extraFee > 0 && (
                    <div className="flex justify-between items-center">
                        <span className="text-primary text-sm flex items-center gap-1">
                          <Truck className="w-3 h-3"/> {feeLabel}
                        </span>
                        <span className="font-bold text-primary">+${extraFee.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Platform Fee</span>
                    <span className="font-bold">${PLATFORM_FEE.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Tax ({(TAX_RATE * 100).toFixed(2)}%)</span>
                    <span className="font-bold">${taxes.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-white/10 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                       <span className="text-lg font-black italic uppercase">Total</span>
                       <span className="text-2xl font-black">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
               </div>

               {/* Escrow Deposit Section */}
               <div className="bg-green-500/5 p-5 rounded-2xl border border-green-500/20 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-green-400" />
                    <span className="font-bold text-green-400 text-sm uppercase">Escrow Deposit ({shop.depositPercent || 25}%)</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-sm">Pay Now</span>
                    <span className="text-xl font-black text-green-400">${depositAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Due at Completion</span>
                    <span className="font-bold text-slate-300">${remainingBalance.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-3">
                    <Lock className="w-3 h-3 inline mr-1" />
                    Deposit held securely until service is completed. Fully refundable if cancelled 24hrs before.
                  </p>
               </div>

               <button 
                className={`btn btn-primary w-full h-16 rounded-2xl font-black italic uppercase tracking-tighter text-xl shadow-[0_0_30px_rgba(250,204,21,0.15)] hover:shadow-primary/30 transition-all ${(!selectedDate || !selectedTime || isProcessing) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                onClick={handleConfirm}
                disabled={!selectedDate || !selectedTime || isProcessing}
               >
                 {isProcessing ? <span className="loading loading-spinner"></span> : `Pay $${depositAmount.toFixed(2)} Deposit`}
               </button>
               
               <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                 <Lock className="w-3 h-3" />
                 <span>Secured by Vroom2 Escrow</span>
               </div>
               
               <div className="mt-4 flex items-center justify-center gap-4 grayscale opacity-40">
                  <div className="h-6 w-10 bg-slate-700 rounded-sm"></div>
                  <div className="h-6 w-10 bg-slate-700 rounded-sm"></div>
                  <div className="h-6 w-10 bg-slate-700 rounded-sm"></div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast toast-end toast-bottom z-50">
          <div className="alert alert-success">
            <CheckCircle className="w-5 h-5" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
