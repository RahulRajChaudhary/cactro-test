# cactro-test

# Event Booking System 🎟️

A complete **Event Booking System** built with **Node.js**, **Express**, **Prisma (Cloud PostgreSQL)**, **Upstash Redis**, and **JWT authentication**. Supports two user roles (Organizers & Customers) with background job processing for notifications.

![Event Booking System](https://img.shields.io/badge/Node.js-18.x-green)
![Express](https://img.shields.io/badge/Express-4.18-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.11-purple)
![JWT](https://img.shields.io/badge/JWT-Auth-orange)
![Redis](https://img.shields.io/badge/Redis-Upstash-red)

## ✨ Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with token expiry
- **Role-based access control** (Organizer vs Customer)
- **Password hashing** with bcryptjs
- **Protected API routes** with middleware

### 👥 User Roles
- **Organizers**: Create, update, and manage events
- **Customers**: Browse events, book tickets, view/cancel bookings

### 🎯 Core Features
- **Event Management**: Full CRUD operations for events
- **Ticket Booking**: Secure booking with transaction handling
- **Double-Booking Prevention**: Customers cannot book same event twice
- **Real-time Availability**: Ticket counts update instantly
- **Booking History**: Customers can view all their bookings

### ⚡ Background Jobs
- **Booking Confirmation**: Simulated email sending (console logs)
- **Event Update Notifications**: Notify booked customers when events change
- **Redis Queue**: Custom job queue without BullMQ
- **In-process Job Processor**: Runs every 3 seconds

### 🎨 Web Interface
- **Responsive UI** works on desktop & mobile
- **Tab-based navigation** for different features
- **Real-time console logs** for background jobs
- **Role-based UI**: Different views for Organizers vs Customers
- **Token management**: Copy JWT tokens easily

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **Git** (for cloning)
- **Internet connection** (for cloud services)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/event-booking-system.git
cd event-booking-system
