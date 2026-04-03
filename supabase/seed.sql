-- Initial Trainer Data
INSERT INTO public.trainers (name, bio, services, availability) 
VALUES (
  'Alex G',
  'Lead Trainer at HxTraining',
  '[
    {"name": "1-on-1 Training Session", "durationMinutes": 60, "price": 100},
    {"name": "Nutrition Consultation", "durationMinutes": 30, "price": 50}
  ]'::jsonb,
  '[
    {"dayOfWeek": 1, "slots": ["09:00", "10:00", "11:00", "14:00", "15:00"]},
    {"dayOfWeek": 2, "slots": ["09:00", "10:00", "11:00", "14:00", "15:00"]},
    {"dayOfWeek": 3, "slots": ["09:00", "10:00", "11:00", "14:00", "15:00"]},
    {"dayOfWeek": 4, "slots": ["09:00", "10:00", "11:00", "14:00", "15:00"]},
    {"dayOfWeek": 5, "slots": ["09:00", "10:00", "11:00", "14:00", "15:00"]}
  ]'::jsonb
);
