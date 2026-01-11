const redis = require('../config/redis');

const JOB_QUEUE_KEY = 'event-booking:jobs';

class QueueService {
  constructor() {
    console.log('🔄 Queue service initialized');
  }

  async addJob(type, data) {
    try {
      const job = {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        createdAt: new Date().toISOString()
      };

      await redis.lpush(JOB_QUEUE_KEY, JSON.stringify(job));
      console.log(`📨 Job added to queue: ${type}`);
      
      return job.id;
    } catch (error) {
      console.error('Error adding job:', error);
      throw error;
    }
  }

  async processJob(job) {
    try {
      console.log(`🔧 Processing job: ${job.type}`);
      
      switch (job.type) {
        case 'BOOKING_CONFIRMATION':
          console.log(`📧 [BACKGROUND JOB] Booking confirmation email sent to: ${job.data.userEmail}`);
          console.log(`   Booking ID: ${job.data.bookingId}`);
          console.log(`   Event: ${job.data.eventTitle}`);
          console.log(`   Tickets: ${job.data.tickets}`);
          console.log(`   Total: $${job.data.totalPrice}`);
          break;
        
        case 'EVENT_UPDATE_NOTIFICATION':
          console.log(`📢 [BACKGROUND JOB] Event update notification sent`);
          console.log(`   Event: ${job.data.eventTitle}`);
          console.log(`   Customers notified: ${job.data.customerCount}`);
          if (job.data.customers) {
            job.data.customers.forEach((email, i) => {
              console.log(`   ${i+1}. ${email}`);
            });
          }
          break;
      }
      
      console.log(`   ⏰ Processed at: ${new Date().toISOString()}`);
      return true;
    } catch (error) {
      console.error(`Error processing job:`, error);
      return false;
    }
  }
}

const queueService = new QueueService();

function startQueueProcessor() {
  console.log('🔄 Starting background job processor...');
  
  setInterval(async () => {
    try {
      const jobStr = await redis.rpop(JOB_QUEUE_KEY);
      
      if (jobStr) {
        const job = JSON.parse(jobStr);
        await queueService.processJob(job);
      }
    } catch (error) {
      console.error('Queue processor error:', error);
    }
  }, 3000);
}

module.exports = {
  addJob: (type, data) => queueService.addJob(type, data),
  startQueueProcessor
};