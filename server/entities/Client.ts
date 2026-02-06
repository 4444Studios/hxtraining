import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'clients' })
export class Client {
    @PrimaryKey({ type: 'number', autoincrement: true })
    id!: number;

    @Property({ type: 'string', length: 255 })
    name!: string;

    @Property({ type: 'string', length: 255, unique: true })
    email!: string;

    @Property({ type: 'string', length: 64, nullable: true })
    phoneNumber?: string;

    @Property({ type: 'text', nullable: true })
    notes?: string;
}
