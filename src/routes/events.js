const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { isEventOwner } = require('../middleware/role');
const prisma = require('../config/prisma');
const { addJob } = require('../services/queueService');

router.get('/events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { isPublished: true, date: { gte: new Date() } },
      include: {
        organizer: { select: { id: true, name: true, email: true } }
      },
      orderBy: { date: 'asc' }
    });
    
    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/events', protect, authorize('ORGANIZER'), async (req, res) => {
  try {
    const { title, description, date, location, capacity, price } = req.body;
    
    if (!title || !date || !location || !capacity || !price) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    
    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        location,
        capacity: parseInt(capacity),
        availableTickets: parseInt(capacity),
        price: parseFloat(price),
        organizerId: req.user.id
      }
    });
    
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/events/:id', protect, authorize('ORGANIZER'), isEventOwner, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        bookings: {
          include: { user: { select: { id: true, email: true, name: true } } }
        }
      }
    });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    const updatedEvent = await prisma.event.update({
      where: { id: req.params.id },
      data: req.body
    });
    
    if (event.bookings.length > 0) {
      await addJob('EVENT_UPDATE_NOTIFICATION', {
        eventId: event.id,
        eventTitle: event.title,
        customerCount: event.bookings.length,
        customers: event.bookings.map(b => b.user.email),
        updatedFields: Object.keys(req.body)
      });
    }
    
    res.json({
      success: true,
      data: updatedEvent,
      message: event.bookings.length > 0 ? 
        `${event.bookings.length} customers will be notified` : 
        'Event updated'
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;