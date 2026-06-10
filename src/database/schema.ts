import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// user roles enum
export const roleEnum = pgEnum('role', ['CUSTOMER', 'RESTAURANT', 'DRIVER']);

// USERS TABLE
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull().default('CUSTOMER'),
  refreshToken: text('refresh_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// RESTAURANTS TABLE
export const restaurants = pgTable('restaurants', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id')
    .references(() => users.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  name: text('name').notNull(),
  description: text('description'),
  address: text('address').notNull(),
  logoUrl: text('logo_url'),
  phone: text('phone').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// MENUS TABLE (Menu Items)
export const menus = pgTable('menus', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// RELATIONSHIPS
// user -> restaurants (one to many)
export const userRelations = relations(users, ({ many }) => ({
  restaurants: many(restaurants),
}));

// restaurant -> owner (one to one)
export const restaurantRelations = relations(restaurants, ({ one, many }) => ({
  owner: one(users, {
    fields: [restaurants.ownerId],
    references: [users.id],
  }),
  menus: many(menus),
}));

// menu -> restaurant (one to one)
export const menusRelations = relations(menus, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [menus.restaurantId],
    references: [restaurants.id],
  }),
}));
