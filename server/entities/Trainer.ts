import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'trainers' })
export class Trainer {
    @PrimaryKey({ type: 'number', autoincrement: true })
    id!: number;

    @Property({ type: 'string', length: 255 })
    name!: string;

    @Property({ type: 'text', nullable: true })
    bio?: string;

    @Property({ type: 'string', length: 512, nullable: true })
    photoUrl?: string;

    @Property({ type: 'json', nullable: true })
    gallery?: string[];

    @Property({ type: 'json', nullable: true })
    availability?: Record<string, string[]>;

    @Property({ type: 'json', nullable: true })
    services?: Array<{ name: string; price: number; description: string; durationMinutes: number }>;
}
