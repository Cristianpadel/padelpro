-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TimeSlot" (
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TimeSlot" ("category", "clubId", "courtId", "createdAt", "end", "id", "instructorId", "level", "maxPlayers", "start", "totalPrice", "updatedAt") SELECT "category", "clubId", "courtId", "createdAt", "end", "id", "instructorId", "level", "maxPlayers", "start", "totalPrice", "updatedAt" FROM "TimeSlot";
DROP TABLE "TimeSlot";
ALTER TABLE "new_TimeSlot" RENAME TO "TimeSlot";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
