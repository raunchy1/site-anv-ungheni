drop materialized view if exists facet_counts;
alter table products drop column if exists search_ro, drop column if exists search_ru;
