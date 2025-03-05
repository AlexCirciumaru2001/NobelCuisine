drop view if exists "public"."extended_orders";

drop view if exists "public"."order_details";

create or replace view "public"."extended_orders" as  SELECT orders.id,
    orders.user_id,
    orders.status,
    orders.total,
    orders.delivery_time,
    orders.delivery_address,
    orders.created_at
   FROM orders;


create or replace view "public"."order_details" as  SELECT orders.id,
    orders.user_id,
    orders.status,
    orders.total,
    orders.delivery_time,
    orders.delivery_address,
    orders.created_at
   FROM orders;



