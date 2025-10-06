INSERT OR IGNORE INTO Club (id, name, createdAt, updatedAt) VALUES ('club-1', 'Club Padel Pro', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO Court (id, number, clubId, createdAt, updatedAt) VALUES ('court-1', 1, 'club-1', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO Court (id, number, clubId, createdAt, updatedAt) VALUES ('court-2', 2, 'club-1', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO Instructor (id, name, clubId, createdAt, updatedAt) VALUES ('instructor-1', 'Carlos Martínez', 'club-1', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO Instructor (id, name, clubId, createdAt, updatedAt) VALUES ('instructor-2', 'Ana López', 'club-1', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO TimeSlot (id, clubId, courtId, instructorId, start, end, maxPlayers, totalPrice, level, category, createdAt, updatedAt) 
       VALUES ('slot-1', 'club-1', 'court-1', 'instructor-1', '2025-09-16 09:00:00', '2025-09-16 10:30:00', 4, 25.0, 'abierto', 'abierto', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO TimeSlot (id, clubId, courtId, instructorId, start, end, maxPlayers, totalPrice, level, category, createdAt, updatedAt) 
       VALUES ('slot-2', 'club-1', 'court-1', 'instructor-1', '2025-09-16 11:00:00', '2025-09-16 12:30:00', 4, 25.0, 'abierto', 'abierto', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO TimeSlot (id, clubId, courtId, instructorId, start, end, maxPlayers, totalPrice, level, category, createdAt, updatedAt) 
       VALUES ('slot-3', 'club-1', 'court-2', 'instructor-2', '2025-09-17 09:00:00', '2025-09-17 10:30:00', 4, 25.0, 'abierto', 'abierto', datetime('now'), datetime('now'));