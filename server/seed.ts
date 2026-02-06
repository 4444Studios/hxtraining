import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import config from '../mikro-orm.config';
import { Trainer } from './entities/Trainer';

async function seed() {
    const orm = await MikroORM.init<PostgreSqlDriver>(config);
    const em = orm.em.fork();

    const existing = await em.findOne(Trainer, { name: 'Alex' });
    if (existing) {
        console.log('Trainer already exists.');
        await orm.close();
        return;
    }

    const trainer = new Trainer();
    trainer.name = 'Alex';
    trainer.bio = 'Expert in functional training and mobility.';
    trainer.services = [
        { name: '1:1 Training', price: 100, durationMinutes: 60, description: 'Personalized training session.' },
        { name: 'Consultation', price: 50, durationMinutes: 30, description: 'Initial assessment and goal setting.' }
    ];
    trainer.availability = {
        monday: ['09:00', '17:00'],
        wednesday: ['09:00', '17:00'],
        friday: ['09:00', '15:00']
    };

    await em.persistAndFlush(trainer);
    console.log('Database seeded with initial trainer.');

    await orm.close();
}

seed().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
