# Notes

## `user.is_superuser` migration

The original `user` table had an `is_superuser` boolean column for admin access.

RBAC replaces that boolean with `user.role` (`admin`, `manager`, `member`). Keeping both columns could introduce additional complexity.
