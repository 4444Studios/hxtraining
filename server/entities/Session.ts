import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Trainer } from './Trainer.js';
import { Client } from './Client.js';

@Entity({ tableName: 'sessions' })
export class Session {
    @PrimaryKey({ type: 'number', autoincrement: true })
    id!: number;

    @Property({ type: 'timestamptz' })
    date!: Date;

    @Property({ type: 'number' })
    durationMinutes!: number;

    @Property({ type: 'string', length: 255 })
    service!: string;

    @Property({ type: 'string', length: 32, default: 'confirmed' })
    status: string = 'confirmed';

    @Property({ type: 'string', length: 255, nullable: true })
    meetingLink?: string;

    @Property({ type: 'text', nullable: true })
    notes?: string;

    @ManyToOne(() => Trainer, { onDelete: 'cascade' })
    trainer!: Trainer;

    @ManyToOne(() => Client, { nullable: true, onDelete: 'set null' })
    client?: Client;

    // Keep these for guest checkout flow if Client entity isn't mandatory yet
    @Property({ type: 'string', length: 255, nullable: true })
    guestName?: string;

    @Property({ type: 'string', length: 255, nullable: true })
    guestEmail?: string;
}
