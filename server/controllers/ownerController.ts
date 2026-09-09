import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { Restaurant } from '../models/Restaurant.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import Multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

interface DecodedToken {
  id: string;
}

// Helper funtion to upload bufffer to cloudinary
const uploadToCloudinary = (
  fileBuffer: Buffer,
): Promise<{ secure_url: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'QuickDine' },
      (error, result) => {
        if (error) return;
        reject(error);
        if (!result) return reject(new Error('Upload failed'));
        resolve({ secure_url: result.secure_url });
      },
    );
    stream.end(fileBuffer);
  });
};

// Get owner's restaurant
// GET /api/owner/restaurant
export const getOwnerRestaurant = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user?._id });

    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }
    res.json(restaurant);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Create owner's restaurant ( submitted to pending)
// POST /api/owner/restaurant
export const createOwnerRestaurant = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const existingRestaurant = await Restaurant.findOne({
      owner: req.user?._id,
    });

    if (existingRestaurant) {
      res.status(400).json({ message: 'You already have a restaurant' });
      return;
    }

    const {
      name,
      description,
      cuisine,
      priceRange,
      location,
      address,
      chef,
      tags,
      availableSlots,
      totalSeats,
    } = req.body;

    if (
      !name ||
      !description ||
      !cuisine ||
      !priceRange ||
      !location ||
      !address ||
      !chef ||
      !tags ||
      !availableSlots ||
      !totalSeats
    ) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const slugExists = await Restaurant.findOne({ slug });

    if (slugExists) {
      res
        .status(400)
        .json({ message: 'Restaurant with this name already exists' });
      return;
    }

    // Handle image
    let imageUrl = '';
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      imageUrl = uploadResult.secure_url;
    }

    // Setup parsed tags and slots
    const parsedTags =
      typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim())
        : tags || [];

    const parsedSlots =
      typeof availableSlots === 'string'
        ? availableSlots.split(',').map((s) => s.trim())
        : availableSlots || ['17:00', '18:00","19:00","20:00","21:00"];'];

    const restaurant = await Restaurant.create({
      name,
      slug,
      description,
      cuisine,
      priceRange,
      location,
      address,
      chef,
      image: imageUrl,
      tags: parsedTags,
      availableSlots: parsedSlots,
      totalSeats: totalSeats ? Number(totalSeats) : 20,
      owner: req.user?._id,
      status: 'pending',
    });

    res.status(201).json(restaurant);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Update owner's restaurant
// PUT /api/owner/restaurant/:id
export const updateOwnerRestaurant = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const restaurant = await Restaurant.findOne({
      owner: req.user?._id,
    });
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const {
      name,
      description,
      cuisine,
      priceRange,
      location,
      address,
      chef,
      tags,
      availableSlots,
      totalSeats,
    } = req.body;

    if (name) restaurant.name = name;
    if (description) restaurant.description = description;
    if (cuisine) restaurant.cuisine = cuisine;
    if (priceRange) restaurant.priceRange = priceRange;
    if (location) restaurant.location = location;
    if (address) restaurant.address = address;
    if (chef) restaurant.chef = chef;
    if (tags) {
      restaurant.tags =
        typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : tags;
    }

    if (availableSlots) {
      restaurant.availableSlots =
        typeof availableSlots === 'string'
          ? availableSlots.split(',').map((s) => s.trim())
          : availableSlots;
    }

    // Handle new image upload if any
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      restaurant.image = result.secure_url;
    }

    const updated = await restaurant.save();
    res.json(updated);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Get bookings for owner's restaurant
// GET /api/owner/bookings
export const getOwnerBookings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user?._id });

    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const bookings = await Booking.find({
      restaurant: restaurant._id,
    })
      .populate('user', 'name email phone')
      .sort({ date: -1, time: -1 });
    res.json(bookings);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Update status of a boooking
// PUT /api/owner/bookings/:id/staus
export const updateBookingStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status || !['pending', 'confirmed', 'cancelled'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    // Check if the booking belongs to the owner's restaurant
    const restaurant = await Restaurant.findOne({ owner: req.user?._id });
    if (!restaurant || !booking.restaurant.equals(restaurant._id)) {
      res
        .status(403)
        .json({ message: 'Not authorized to update this booking' });
      return;
    }

    booking.status = status;
    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};
