-- Remove VIP role assignments first
DELETE FROM "user_roles" WHERE "role_id" IN (SELECT "id" FROM "roles" WHERE "name" = 'VIP');

-- Remove VIP role
DELETE FROM "roles" WHERE "name" = 'VIP';

-- Remove VIP from RoleName enum
CREATE TYPE "RoleName_new" AS ENUM ('ADMIN', 'USER');
ALTER TABLE "roles" ALTER COLUMN "name" TYPE "RoleName_new" USING ("name"::text::"RoleName_new");
ALTER TYPE "RoleName" RENAME TO "RoleName_old";
ALTER TYPE "RoleName_new" RENAME TO "RoleName";
DROP TYPE "RoleName_old";

-- Rename is_vip to is_premium on movies table
ALTER TABLE "movies" RENAME COLUMN "is_vip" TO "is_premium";
