/* Remove recursive trigger that caused stack overflow on insert */
DROP TRIGGER IF EXISTS enforce_max_must_read ON notices;
DROP FUNCTION IF EXISTS enforce_max_must_read();
