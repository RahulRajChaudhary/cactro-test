const prisma = require('../config/prisma');

const isEventOwner = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    if (!eventId) return next();
    
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true }
    });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    next();
  } catch (error) {
    console.error('Event owner check error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const isBookingOwner = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    if (!bookingId) return next();
    
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { userId: true }
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    next();
  } catch (error) {
    console.error('Booking owner check error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { isEventOwner, isBookingOwner };