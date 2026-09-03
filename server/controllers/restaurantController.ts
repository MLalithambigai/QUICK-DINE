import { Restaurant } from '../models/Restaurant.js';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';

interface RestaurantQuery {
  search?: string;
  priceRange?: string;
  rating?: string;
  location?: string;
  sort?: 'rating' | 'price_low' | 'price_high' | string;
}

interface DecodedToken {
  id: string;
}

interface BookingSummary {
  time: string;
  guests: number;
}

interface AvailabilitySlot {
  time: string;
  availableSeats: number;
  isAvailable: boolean;
}

// Get all restaurants with search and filters
// GET /api/restaurants
export const getRestaurants = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { search, priceRange, rating, location, sort } =
      req.query as Partial<RestaurantQuery>;

    // Build query object
    const queryObj: Record<string, any> = { status: 'approved' };

    if (search) {
      queryObj.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    if (rating) {
      queryObj.rating = { $gte: parseFloat(rating as string) };
    }

    if (location) {
      queryObj.location = { $regex: location as string, $options: 'i' };
    }

    // Sorting
    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'rating') {
      sortOption = { rating: -1 };
    } else if (sort === 'price_low') {
      sortOption = { priceRange: 1 };
    } else if (sort === 'price_high') {
      sortOption = { priceRange: -1 };
    }

    const restaurant = await Restaurant.find(queryObj).sort(sortOption);
    res.json(restaurant);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Get featured and exclusive restaurants
// GET /api/restaurants/featured
export const getFeaturedRestaurants = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const featured = await Restaurant.find({
      status: 'approved',
      $or: [{ featured: true }, { exclusive: true }],
    }).limit(6);
    res.json(featured);
  } catch (error: any) {
    console.error('Get Featured Restaurant Error', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get single restaurant by slug
// GET /api/restaurants/:slug
export const getRestaurantBySlug = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug });
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    // If not approved, verify authorization (owner or admin)
    if (restaurant.status !== 'approved') {
      let isAuthorized = false;
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
      ) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string,
          ) as DecodedToken;

          const user = await User.findById(decoded.id);

          if (
            user &&
            (user.role === 'admin' ||
              (user.role === 'owner' &&
                restaurant.owner.toString() === user._id.toString()))
          ) {
            isAuthorized = true;
          }
        } catch (error) {
          // Ignore token verify error
        }
      }

      if (!isAuthorized) {
        res
          .status(404)
          .json({ message: 'Restaurant not found or pending approval' });
        return;
      }
      res.json(restaurant);
    }
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Get dynamic seat availabilty for slots
// GET /api/restaurants/:id/availabilty
export const getRestaurantAvailability = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { date } = req.query as { date?: string };
    if (!date) {
      res.status(400).json({ message: 'Please provide a date' });
      return;
    }

    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const bookingDate = new Date(date as string);

    // Get all active bookings on this date for the restaurant
    const bookings: BookingSummary[] = await Booking.find({
      restaurant: restaurant._id,
      date: bookingDate,
      status: 'confirmed',
    });

    // Map slots to available capacities
    const availability: AvailabilitySlot[] = restaurant.availableSlots.map(
      (slot: string) => {
        const bookedSeats = bookings
          .filter((b: BookingSummary) => b.time === slot)
          .reduce((sum: number, b: BookingSummary) => sum + b.guests, 0);

        const totalSeats = restaurant.totalSeats || 20;
        const availableSeats = Math.max(0, totalSeats - bookedSeats);

        return {
          time: slot,
          availableSeats,
          isAvailable: availableSeats > 0,
        };
      },
    );

    res.json(availability);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};
