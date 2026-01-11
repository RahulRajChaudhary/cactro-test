const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { isBookingOwner } = require('../middleware/role');
const prisma = require('../config/prisma');
const { addJob } = require('../services/queueService');

router.post('/bookings', protect, authorize('CUSTOMER'), async (req, res) => {
  try {
    const { eventId, tickets } = req.body;
    
    if (!eventId || !tickets) {
      return res.status(400).json({ success: false, message: 'Event ID and tickets required' });
    }
    
    if (tickets <= 0) {
      return res.status(400).json({ success: false, message: 'Tickets must be greater than 0' });
    }
    
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    if (event.availableTickets < tickets) {
      return res.status(400).json({ success: false, message: `Only ${event.availableTickets} tickets available` });
    }
    
    const existingBooking = await prisma.booking.findFirst({
      where: { userId: req.user.id, eventId: eventId }
    });
    
    if (existingBooking) {
      return res.status(400).json({ success: false, message: 'Already booked this event' });
    }
    
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          tickets: parseInt(tickets),
          totalPrice: parseFloat(event.price) * parseInt(tickets),
          userId: req.user.id,
          eventId: eventId
        }
      });
      
      await tx.event.update({
        where: { id: eventId },
        data: { availableTickets: event.availableTickets - tickets }
      });
      
      return booking;
    });
    
    await addJob('BOOKING_CONFIRMATION', {
      bookingId: result.id,
      userEmail: req.user.email,
      eventTitle: event.title,
      tickets: tickets,
      totalPrice: event.price * tickets
    });
    
    res.status(201).json({ success: true, data: result, message: 'Booking successful' });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/bookings', protect, authorize('CUSTOMER'), async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: {
        event: { select: { title: true, date: true, location: true, price: true } }
      }
    });
    
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/bookings/:id', protect, authorize('CUSTOMER'), isBookingOwner, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { event: true }
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: req.params.id },
        data: { status: 'CANCELLED' }
      });
      
      await tx.event.update({
        where: { id: booking.eventId },
        data: { availableTickets: booking.event.availableTickets + booking.tickets }
      });
    });
    
    res.json({ success: true, message: 'Booking cancelled' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;