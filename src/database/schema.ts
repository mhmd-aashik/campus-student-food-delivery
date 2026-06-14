import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  index,
  uuid,
  uniqueIndex,
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
export const restaurants = pgTable(
  'restaurants',
  {
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
  },
  (table) => [index('restaurants_owner_id_idx').on(table.ownerId)],
);

// MENUS TABLE (Menu Items)
export const menus = pgTable(
  'menus',
  {
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
  },
  (table) => [index('menus_restaurant_id_idx').on(table.restaurantId)],
);

// CARTS TABLE
export const carts = pgTable(
  'cart_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .unique()
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updateAt: timestamp('update_at').defaultNow().notNull(),
  },
  (table) => [index('carts_user_id_idx').on(table.userId)],
);

// CARTS ITEMS TABLE
export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cart_id')
      .references(() => carts.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    menuId: uuid('menu_id')
      .references(() => menus.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    quantity: integer('quantity').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updateAt: timestamp('update_at').defaultNow().notNull(),
  },
  (table) => ({
    cartIdIdx: index('cart_items_cart_id_idx').on(table.cartId),
    menuIdIdx: index('cart_items_menu_id_idx').on(table.menuId),
    cartMenuUniqueIdx: uniqueIndex('cart_items_cart_id_menu_id_unique_idx').on(
      table.cartId,
      table.menuId,
    ),
  }),
);

// RELATIONSHIPS
// user -> restaurants (one to many)
export const userRelations = relations(users, ({ one, many }) => ({
  restaurants: many(restaurants),
  cart: one(carts),
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
export const menusRelations = relations(menus, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [menus.restaurantId],
    references: [restaurants.id],
  }),
  cartsItems: many(cartItems),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  menu: one(menus, {
    fields: [cartItems.menuId],
    references: [menus.id],
  }),
}));
