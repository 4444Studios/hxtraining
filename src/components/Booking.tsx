import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, isSameDay, isBefore, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import '../App.css';

interface Trainer {
    id: number;
    name: string;
    photoUrl?: string;
    services: Service[];
}

interface Service {
    name: string;
    durationMinutes: number;
    price: number;
}

interface Slot {
    time: string;
    iso: string;
    hour: number;
}

interface ClientDetails {
    name: string;
    email: string;
    phoneNumber: string;
    notes: string;
}

export default function Booking() {
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    // Calendar State
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Slot State
    const [takenSlots, setTakenSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);


    // Form State
    const [bookingStep, setBookingStep] = useState<'calendar' | 'details'>('calendar');
    const [clientDetails, setClientDetails] = useState<ClientDetails>({
        name: '',
        email: '',
        phoneNumber: '',
        notes: ''
    });
    const [bookingStatus, setBookingStatus] = useState<'success' | 'error' | null>(null);

    // Initial Fetch
    useEffect(() => {
        supabase
            .from('trainers')
            .select('id, name, photo_url, services')
            .then(({ data, error }) => {
                if (error) { console.error('Error fetching trainers:', error); return; }
                if (data && data.length > 0) {
                    const mapped = data.map((t: any) => ({ ...t, photoUrl: t.photo_url }));
                    setTrainers(mapped);
                    setSelectedTrainer(mapped[0]);
                    if (mapped[0].services?.length > 0) setSelectedService(mapped[0].services[0]);
                }
            });
    }, []);

    // Fetch availability when Trainer Changes or Week Changes
    useEffect(() => {
        if (selectedTrainer) {
            fetchWeeklyAvailability();
        }
    }, [selectedTrainer, currentDate]);

    const fetchWeeklyAvailability = async () => {
        if (!selectedTrainer) return;

        const start = startOfDay(currentDate);
        const day = start.getDay();
        const diff = start.getDate() - day;
        const weekStart = new Date(start.setDate(diff));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const sStr = format(weekStart, 'yyyy-MM-dd');
        const eStr = format(weekEnd, 'yyyy-MM-dd');

        try {
            // Use query params via direct URL since Edge Function is a GET request
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const res = await fetch(
                `${supabaseUrl}/functions/v1/get-availability?trainerId=${selectedTrainer.id}&startDate=${sStr}&endDate=${eStr}`,
                { headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` } }
            );

            if (res.ok) {
                const json = await res.json();
                setTakenSlots(json.taken || []);
            }
        } catch (error) {
            console.error('Error fetching slots', error);
        }
    };

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTrainer || !selectedService || !selectedDate || !selectedSlot) return;

        try {
            const payload = {
                trainerId: selectedTrainer.id,
                service: selectedService.name,
                date: selectedSlot.iso,
                clientName: clientDetails.name,
                clientEmail: clientDetails.email,
                clientPhoneNumber: clientDetails.phoneNumber
            };

            const { error } = await supabase.functions.invoke('create-booking', {
                body: payload,
            });

            if (error) throw error;
            setBookingStatus('success');
        } catch (error) {
            console.error('Booking failed', error);
            setBookingStatus('error');
        }
    };

    const handleBack = () => {
        if (bookingStatus === 'success') {
            setBookingStatus(null);
            setBookingStep('calendar');
            setClientDetails({ name: '', email: '', phoneNumber: '', notes: '' });
            setSelectedDate(null);
            setSelectedSlot(null);
            return;
        }

        if (bookingStep === 'details') setBookingStep('calendar');
    };

    // --- Render Helpers ---

    const renderWeekGrid = () => {
        // Determine start of week (Sunday)
        const today = new Date();
        const start = new Date(currentDate);
        const day = start.getDay();
        const diff = start.getDate() - day;
        const weekStart = new Date(start.setDate(diff));

        const weekDays = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            return d;
        });

        const startHour = 8;
        const endHour = 20; // 8 PM
        const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

        return (
            <div className="calendar-container">
                <div className="calendar-header-nav">
                    <button onClick={() => {
                        const d = new Date(currentDate);
                        d.setDate(d.getDate() - 7);
                        setCurrentDate(d);
                    }} className="cal-nav-btn"><ChevronLeft size={20} /></button>
                    <span className="calendar-nav-title">
                        {format(weekStart, 'MMMM d')} - {format(weekDays[6], 'MMMM d, yyyy')}
                    </span>
                    <button onClick={() => {
                        const d = new Date(currentDate);
                        d.setDate(d.getDate() + 7);
                        setCurrentDate(d);
                    }} className="cal-nav-btn"><ChevronRight size={20} /></button>
                </div>

                <div className="week-grid">
                    {/* Header Row */}
                    <div className="time-header-cell"></div>
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className={`day-header-cell ${isSameDay(day, today) ? 'today' : ''}`}>
                            <span className="day-name">{format(day, 'EEE')}</span>
                            <span className="day-date">{format(day, 'd')}</span>
                        </div>
                    ))}



                    {/* Flattened Grid Loop */}
                    {hours.map(hour => (
                        [0, 30].map(minute => (
                            <React.Fragment key={`${hour}-${minute}`}>
                                {/* Time Label only for minute 0 */}
                                <div className={`time-label-cell ${minute === 30 ? 'half-hour' : ''}`}>
                                    {minute === 0 ? format(new Date().setHours(hour, 0, 0, 0), 'h aa') : ''}
                                </div>

                                {weekDays.map(day => {
                                    const slotDate = new Date(day);
                                    slotDate.setHours(hour, minute, 0, 0);
                                    const iso = slotDate.toISOString();
                                    const isTaken = takenSlots.includes(iso);
                                    const isSelected = selectedSlot?.iso === iso;
                                    const isPast = isBefore(slotDate, new Date());
                                    const timeLabel = format(slotDate, 'h:mm aa');

                                    return (
                                        <div key={iso} className={`grid-cell ${minute === 0 ? 'hour-start' : ''}`}>
                                            <button
                                                className={`slot-btn ${isTaken ? 'taken' : 'available'} ${isSelected ? 'selected' : ''} ${isPast ? 'past' : ''}`}
                                                disabled={isTaken || isPast}
                                                onClick={() => {
                                                    setSelectedDate(day);
                                                    setSelectedSlot({ time: format(slotDate, 'h:mm aa'), iso, hour });
                                                    setBookingStep('details');
                                                }}
                                                title={isTaken ? 'Booked' : timeLabel}
                                            >
                                                {/* Optional: Show + on hover? */}
                                            </button>
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))
                    ))}
                </div>
            </div>
        );
    };

    // --- Main Render ---

    if (bookingStatus === 'success') {
        return (
            <div className="booking-overlay">
                <div className="booking-card success-card">
                    <div className="success-icon"><Check size={48} /></div>
                    <h3>Booking Confirmed!</h3>
                    <p>You're all set for <strong>{selectedService?.name}</strong>.</p>
                    <p className="session-time">
                        {selectedDate && format(selectedDate, 'EEEE, MMMM do')} at {selectedSlot?.time}
                    </p>
                    <button onClick={handleBack} className="cal-btn-primary">Book Another</button>
                </div>
            </div>
        );
    }

    // Fallback if no trainers
    if (trainers.length === 0) return null;

    return (
        <section id="booking" className="booking-section">
            <div className="section-container">
                <h2 className="booking-title">Schedule Your Session</h2>

                <div className="booking-interface">
                    {/* Content Area */}
                    <div className="booking-content">

                        {/* Service Selector & Summary Bar */}
                        {bookingStep === 'calendar' && selectedTrainer && (
                            <div className="booking-summary-bar">
                                <div className="summary-item">
                                    <span className="summary-label">Service:</span>
                                    <select
                                        className="service-selector"
                                        value={selectedService?.name || ''}
                                        onChange={(e) => {
                                            const service = selectedTrainer.services.find(s => s.name === e.target.value);
                                            if (service) setSelectedService(service);
                                        }}
                                    >
                                        {selectedTrainer.services.map(s => (
                                            <option key={s.name} value={s.name}>
                                                {s.name} (${s.price})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {selectedService && (
                                    <>
                                        <div className="summary-item">
                                            <span className="summary-label">Duration:</span>
                                            <span className="summary-value">{selectedService.durationMinutes} min</span>
                                        </div>
                                        <div className="summary-item">
                                            <span className="summary-label">Price:</span>
                                            <span className="summary-value">${selectedService.price}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Step 2: Calendar & Time (Grid View) */}
                        {bookingStep === 'calendar' && (
                            <div className="step-container calendar-step">
                                <h3>Select a Time</h3>
                                {renderWeekGrid()}
                            </div>
                        )}

                        {/* Step 3: Details Form */}
                        {bookingStep === 'details' && (
                            <div className="step-container details-step">
                                <div className="details-header">
                                    <button className="back-btn" onClick={() => setBookingStep('calendar')}><ChevronLeft size={20} /> Back</button>
                                    <h3>Enter Details</h3>
                                </div>

                                <form onSubmit={handleBooking} className="booking-form-compact">
                                    <div className="form-group">
                                        <label>Name <span className="req">*</span></label>
                                        <input type="text" required value={clientDetails.name} onChange={e => setClientDetails({ ...clientDetails, name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Email <span className="req">*</span></label>
                                        <input type="email" required value={clientDetails.email} onChange={e => setClientDetails({ ...clientDetails, email: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number <span className="req">*</span></label>
                                        <input type="tel" required value={clientDetails.phoneNumber} onChange={e => setClientDetails({ ...clientDetails, phoneNumber: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Additional Notes</label>
                                        <textarea value={clientDetails.notes} onChange={e => setClientDetails({ ...clientDetails, notes: e.target.value })} rows={3}></textarea>
                                    </div>

                                    <button type="submit" className="cal-btn-primary full-width">Schedule Event</button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
