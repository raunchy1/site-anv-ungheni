-- Rollback 0013
drop function if exists next_order_number();
drop sequence if exists order_number_seq;
