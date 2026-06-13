CREATE INDEX "menus_restaurant_id_idx" ON "menus" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "restaurants_owner_id_idx" ON "restaurants" USING btree ("owner_id");