import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as bcrypt from 'bcryptjs';
dotenv.config();

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is missing.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : undefined,
});

const db = drizzle(pool, { schema });

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Clear existing data
    console.log('🧹 Clearing existing data...');
    await db.delete(schema.menus);
    await db.delete(schema.restaurants);
    await db.delete(schema.users);

    // 2. Create Users
    console.log('👤 Creating users...');
    const passwordHash = await bcrypt.hash('password123', 10);

    const [customer] = await db
      .insert(schema.users)
      .values({
        name: 'John Doe',
        email: 'customer@campus.edu',
        passwordHash,
        role: 'CUSTOMER',
      })
      .returning();

    const [owner] = await db
      .insert(schema.users)
      .values({
        name: 'Jane Chef',
        email: 'restaurant@campus.edu',
        passwordHash,
        role: 'RESTAURANT',
      })
      .returning();

    const [driver] = await db
      .insert(schema.users)
      .values({
        name: 'Bob Rider',
        email: 'driver@campus.edu',
        passwordHash,
        role: 'DRIVER',
      })
      .returning();

    console.log(
      `Created users: Customer (${customer.id}), Restaurant Owner (${owner.id}), Driver (${driver.id})`,
    );

    // 3. Create Restaurant
    console.log('🍔 Creating restaurant...');
    const [restaurant] = await db
      .insert(schema.restaurants)
      .values({
        ownerId: owner.id,
        name: 'Campus Bistro',
        description: 'The best burgers, pizzas, and wraps on campus!',
        address: 'Student Union, Building A',
        phone: '555-0199',
        logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      })
      .returning();

    console.log(`Created restaurant: ${restaurant.name} (${restaurant.id})`);

    // 4. Create Menu Items
    console.log('🍕 Creating menu items...');
    await db.insert(schema.menus).values([
      {
        restaurantId: restaurant.id,
        name: 'Classic Cheeseburger',
        description:
          'Juicy beef patty, cheddar cheese, lettuce, tomato, and bistro sauce.',
        price: 899, // $8.99
        imageUrl:
          'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=2371&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        isAvailable: true,
      },
      {
        restaurantId: restaurant.id,
        name: 'Margherita Pizza',
        description:
          'Fresh mozzarella, tomato sauce, and basil on a crispy crust.',
        price: 1099, // $10.99
        imageUrl:
          'https://plus.unsplash.com/premium_photo-1733266807710-f8f8de34416f?q=80&w=2370&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        isAvailable: true,
      },
      {
        restaurantId: restaurant.id,
        name: 'Chicken Caesar Wrap',
        description:
          'Grilled chicken, romaine lettuce, parmesan cheese, and caesar dressing.',
        price: 749, // $7.49
        imageUrl:
          'https://images.unsplash.com/photo-1655017976653-55a06c602d11?q=80&w=2370&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        isAvailable: true,
      },
    ]);

    console.log('✅ Seeding completed successfully!');
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ Seeding failed:', err.message);
  } finally {
    await pool.end();
  }
}

void main();
