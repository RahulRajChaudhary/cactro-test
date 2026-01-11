require('dotenv').config();
const app = require('./src/app');
const { startQueueProcessor } = require('./src/services/queueService');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 API Documentation:`);
  console.log(`   POST   /api/auth/register`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/events`);
  console.log(`   POST   /api/events (Organizer only)`);
  console.log(`   PUT    /api/events/:id (Organizer only)`);
  console.log(`   POST   /api/bookings (Customer only)`);
  console.log(`   GET    /api/bookings (Customer only)`);
  console.log(`   DELETE /api/bookings/:id (Customer only)`);
  
  // Start background job processor
  startQueueProcessor();
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});