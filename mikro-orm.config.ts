/* eslint-disable no-undef */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load .env from project root
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });
console.log('Current directory:', __dirname);
console.log('Loading .env from:', join(__dirname, '.env'));
console.log('DATABASE_URL:', process.env.DATABASE_URL);

import { defineConfig } from "@mikro-orm/postgresql";
import { Migrator } from "@mikro-orm/migrations";
import "reflect-metadata";
import { Trainer } from "./server/entities/Trainer";
import { Session } from "./server/entities/Session";
import { Client } from "./server/entities/Client";

export default defineConfig({
    entities: [Trainer, Session, Client],
    extensions: [Migrator],
    clientUrl: process.env.DATABASE_URL,
    debug: true,
    migrations: {
        path: "./server/migrations",
        tableName: "mikro_orm_migrations_hxtraining",
    },
    driverOptions: {
        connection: {
            ssl: {
                rejectUnauthorized:
                    process.env.NODE_ENV === 'production' ? true : false,
            },
        },
    },
    schema: 'public', // Only manage public schema
});
