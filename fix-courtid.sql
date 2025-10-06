-- CreateTable
CREATE TABLE "TimeSlot_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clubId" TEXT NOT NULL,
    "courtId" TEXT,
    "instructorId" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "maxPlayers" INTEGER NOT NULL DEFAULT 4,
    "totalPrice" REAL NOT NULL,
    "level" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TimeSlot_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TimeSlot_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TimeSlot_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Copy data from old table
INSERT INTO "TimeSlot_new" SELECT * FROM "TimeSlot";

-- Drop old table
DROP TABLE "TimeSlot";

-- Rename new table
ALTER TABLE "TimeSlot_new" RENAME TO "TimeSlot";