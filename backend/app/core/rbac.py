from enum import Enum


class UserRole(str, Enum):
    admin = "admin"
    manager = "manager"
    member = "member"


class Permission(str, Enum):
    users_read = "users:read"
    users_manage = "users:manage"
    metrics_read = "metrics:read"
    password_recovery_preview = "password-recovery:preview"
    test_email = "test-email:send"
    items_read_all = "items:read:all"
    items_manage_all = "items:manage:all"


ROLE_PERMISSIONS: dict[UserRole, tuple[Permission, ...]] = {
    UserRole.admin: (
        Permission.users_read,
        Permission.users_manage,
        Permission.metrics_read,
        Permission.password_recovery_preview,
        Permission.test_email,
        Permission.items_read_all,
        Permission.items_manage_all,
    ),
    UserRole.manager: (Permission.users_read, Permission.metrics_read),
    UserRole.member: (),
}


def permissions_for_role(role: UserRole) -> list[Permission]:
    return list(ROLE_PERMISSIONS[role])
