import { Migration } from '@mikro-orm/migrations';

export class Migration20260206085131 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "clients" ("id" serial primary key, "name" varchar(255) not null, "email" varchar(255) not null, "phone_number" varchar(64) null, "notes" text null);`);
    this.addSql(`alter table "clients" add constraint "clients_email_unique" unique ("email");`);

    this.addSql(`create table "trainers" ("id" serial primary key, "name" varchar(255) not null, "bio" text null, "photo_url" varchar(512) null, "gallery" jsonb null, "availability" jsonb null, "services" jsonb null);`);

    this.addSql(`create table "sessions" ("id" serial primary key, "date" timestamptz not null, "duration_minutes" int not null, "service" varchar(255) not null, "status" varchar(32) not null default 'confirmed', "meeting_link" varchar(255) null, "notes" text null, "trainer_id" int not null, "client_id" int null, "guest_name" varchar(255) null, "guest_email" varchar(255) null);`);

    this.addSql(`alter table "sessions" add constraint "sessions_trainer_id_foreign" foreign key ("trainer_id") references "trainers" ("id") on update cascade;`);
    this.addSql(`alter table "sessions" add constraint "sessions_client_id_foreign" foreign key ("client_id") references "clients" ("id") on update cascade on delete set null;`);
  }

}
