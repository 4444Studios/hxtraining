import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { Trainer } from './entities/Trainer.js';
import { Session } from './entities/Session.js';
import { Client } from './entities/Client.js';
import { uploadPhoto, DEFAULT_BUCKET } from './providers/index.js';
import config from '../mikro-orm.config.js';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Only image files are allowed'));
            return;
        }
        cb(null, true);
    },
});

function getImageExtension(mimetype: string, originalname?: string): string {
    const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
    };
    return mimeToExt[mimetype] || (originalname?.split('.').pop()?.replace(/[^a-z0-9]/gi, '') ?? 'jpg');
}

declare global {
    namespace Express {
        interface Request {
            em: EntityManager;
        }
    }
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader === 'Bearer secret-token') {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

const app = express();
const port = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());
// Serve static files from server/public
app.use(express.static('server/public'));

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        res.json({ token: 'secret-token' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

const startServer = async () => {
    try {
        if (!process.env.DATABASE_URL) {
            console.warn('DATABASE_URL is not set in .env! Database connection will fail.');
        }
        const orm = await MikroORM.init(config);

        // Middleware to attach fork to request
        app.use((req, res, next) => {
            req.em = orm.em.fork();
            next();
        });

        app.get('/health', (req, res) => {
            res.json({ status: 'ok', db: 'connected' });
        });

        // Public Routes: Trainers (instead of Barbers)
        app.get('/api/trainers', async (req, res) => {
            const trainers = await req.em.find(Trainer, {}, { populate: ['availability'] });
            res.json(trainers);
        });

        app.get('/api/trainers/:id', async (req, res) => {
            try {
                const trainer = await req.em.findOne(Trainer, { id: Number(req.params.id) }, { populate: ['availability'] });
                if (!trainer) {
                    res.status(404).json({ error: 'Trainer not found' });
                    return;
                }
                res.json(trainer);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        // Availability Logic (simplified for Trainer timezone)
        const SHOP_TIMEZONE = 'America/Los_Angeles'; // Make this configurable if needed

        function getShopDayRangeUTC(dateStr: string): [Date, Date] {
            const laFormatter = new Intl.DateTimeFormat('en-US', {
                timeZone: SHOP_TIMEZONE,
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false,
            });
            const [year, month, day] = dateStr.split('-').map(Number);
            const testDate = new Date(Date.UTC(year, month - 1, day, 20, 0, 0));
            const findLaMidnight = (targetHour: number = 0) => {
                const parts = laFormatter.formatToParts(testDate);
                const getPart = (type: string) => parts.find(p => p.type === type)?.value ?? '';
                const laHour = parseInt(getPart('hour'), 10);
                const laMinute = parseInt(getPart('minute'), 10);
                const laDay = parseInt(getPart('day'), 10);
                const laMonth = parseInt(getPart('month'), 10);
                const laYear = parseInt(getPart('year'), 10);
                const dayDiff = day - laDay + (month - laMonth) * 30 + (year - laYear) * 365;
                const adjustMs = ((targetHour - laHour) * 60 + (0 - laMinute)) * 60 * 1000 + dayDiff * 24 * 60 * 60 * 1000;
                return new Date(testDate.getTime() + adjustMs);
            };
            const start = findLaMidnight(0);
            const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
            return [start, end];
        }

        app.get('/api/availability/taken', async (req, res) => {
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');
            try {
                const trainerId = Number(req.query.trainerId);
                const startDateStr = req.query.startDate as string;
                const endDateStr = req.query.endDate as string;
                // Fallback for backward compatibility or single day
                const singleDateStr = req.query.date as string;

                if (!Number.isInteger(trainerId) || trainerId <= 0) {
                    res.status(400).json({ error: 'Invalid trainerId' });
                    return;
                }

                let start: Date, end: Date;

                if (startDateStr && endDateStr) {
                    // Range mode
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDateStr) || !/^\d{4}-\d{2}-\d{2}$/.test(endDateStr)) {
                        res.status(400).json({ error: 'Invalid dates; use YYYY-MM-DD' });
                        return;
                    }
                    // Get UTC range for the shop's timezone day
                    const [s1, _e1] = getShopDayRangeUTC(startDateStr);
                    const [_s2, e2] = getShopDayRangeUTC(endDateStr);
                    start = s1;
                    end = e2;
                } else if (singleDateStr) {
                    // Single day mode
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(singleDateStr)) {
                        res.status(400).json({ error: 'Invalid date; use YYYY-MM-DD' });
                        return;
                    }
                    [start, end] = getShopDayRangeUTC(singleDateStr);
                } else {
                    res.status(400).json({ error: 'Missing date parameters (startDate+endDate OR date)' });
                    return;
                }

                const sessions = await req.em.find(Session, {
                    trainer: { id: trainerId },
                    date: { $gte: start, $lt: end },
                });

                const SLOT_MINUTES = 30; // Granularity
                const takenSet = new Set<string>();
                for (const ses of sessions) {
                    const d = new Date(ses.date);
                    // For range view, we probably want exact times, but we'll stick to 30m rounding for consistency
                    const mins = d.getUTCMinutes();
                    const roundedMins = mins < 30 ? 0 : 30;
                    d.setUTCMinutes(roundedMins, 0, 0);

                    const duration = ses.durationMinutes ?? 60;
                    const numSlots = Math.max(1, Math.ceil(duration / SLOT_MINUTES));
                    for (let i = 0; i < numSlots; i++) {
                        const slotStart = new Date(d);
                        slotStart.setUTCMinutes(slotStart.getUTCMinutes() + i * SLOT_MINUTES, 0, 0);
                        takenSet.add(slotStart.toISOString());
                    }
                }
                res.json({ taken: Array.from(takenSet) });
            } catch (error: any) {
                console.error('Error fetching taken slots:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Booking Endpoint
        app.post('/api/sessions', async (req, res) => { // Public booking
            try {
                const { clientName, clientEmail, clientPhoneNumber, date, trainerId, service } = req.body;

                if (!clientName || !clientEmail || !date || !service || !trainerId) {
                    res.status(400).json({ error: 'Missing required fields' });
                    return;
                }
                const trainerIdNum = Number(trainerId);
                const trainer = await req.em.findOne(Trainer, { id: trainerIdNum });
                if (!trainer) {
                    res.status(404).json({ error: 'Trainer not found' });
                    return;
                }

                const serviceEntry = trainer.services?.find((s) => s.name === service);
                const durationMinutes = serviceEntry?.durationMinutes ?? 60;

                // Create/Find client (optional, but good practice)
                let client = await req.em.findOne(Client, { email: clientEmail });
                if (!client) {
                    client = req.em.create(Client, {
                        name: clientName,
                        email: clientEmail,
                        phoneNumber: clientPhoneNumber
                    });
                }

                const session = req.em.create(Session, {
                    trainer,
                    client, // Link to client entity
                    service,
                    date,
                    durationMinutes,
                    status: 'confirmed',
                    guestName: clientName, // Keep for easy access
                    guestEmail: clientEmail
                });

                await req.em.flush();
                res.status(201).json(session);
            } catch (error: any) {
                console.error('Error creating session:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Admin Routes
        app.get('/api/sessions', authMiddleware, async (req, res) => {
            const sessions = await req.em.find(Session, {}, { populate: ['trainer', 'client'] });
            res.json(sessions);
        });

        app.get('/api/clients', authMiddleware, async (req, res) => {
            try {
                const clients = await req.em.find(Client, {});
                res.json(clients);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        app.post('/api/trainers', authMiddleware, async (req, res) => {
            try {
                const { name, photoUrl, availability, bio } = req.body;
                const trainer = req.em.create(Trainer, {
                    name,
                    photoUrl,
                    availability,
                    bio
                });
                await req.em.flush();
                res.status(201).json(trainer);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        app.put('/api/trainers/:id', authMiddleware, async (req, res) => {
            try {
                const trainer = await req.em.findOne(Trainer, { id: Number(req.params.id) });
                if (!trainer) {
                    res.status(404).json({ error: 'Trainer not found' });
                    return;
                }
                const { availability, photoUrl, gallery, bio, services } = req.body;
                if (availability) trainer.availability = availability;
                if (photoUrl) trainer.photoUrl = photoUrl;
                if (gallery) trainer.gallery = gallery;
                if (bio) trainer.bio = bio;
                if (services) trainer.services = services;

                await req.em.flush();
                res.json(trainer);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
};

startServer();
