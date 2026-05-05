import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app import crud
from app.core.config import settings
from app.models import User, UserCreate, UserRole
from tests.utils.user import user_authentication_headers
from tests.utils.utils import random_email, random_lower_string


def create_role_user(
    *, client: TestClient, db: Session, role: UserRole
) -> tuple[User, dict[str, str]]:
    email = random_email()
    password = random_lower_string()
    user = crud.create_user(
        session=db,
        user_create=UserCreate(email=email, password=password, role=role),
    )
    headers = user_authentication_headers(client=client, email=email, password=password)
    return user, headers


def test_all_roles_can_use_own_profile(client: TestClient, db: Session) -> None:
    for role in UserRole:
        _, headers = create_role_user(client=client, db=db, role=role)

        read_response = client.get(f"{settings.API_V1_STR}/users/me", headers=headers)
        assert read_response.status_code == 200
        assert read_response.json()["role"] == role

        update_response = client.patch(
            f"{settings.API_V1_STR}/users/me",
            headers=headers,
            json={"full_name": f"{role.value} user"},
        )
        assert update_response.status_code == 200
        assert update_response.json()["full_name"] == f"{role.value} user"


def test_list_users_role_permissions(client: TestClient, db: Session) -> None:
    expected_status_by_role = {
        UserRole.admin: 200,
        UserRole.manager: 200,
        UserRole.member: 403,
    }

    for role, expected_status in expected_status_by_role.items():
        _, headers = create_role_user(client=client, db=db, role=role)

        response = client.get(f"{settings.API_V1_STR}/users/", headers=headers)

        assert response.status_code == expected_status


def test_read_other_user_role_permissions(client: TestClient, db: Session) -> None:
    target_user, _ = create_role_user(client=client, db=db, role=UserRole.member)
    expected_status_by_role = {
        UserRole.admin: 200,
        UserRole.manager: 200,
        UserRole.member: 403,
    }

    for role, expected_status in expected_status_by_role.items():
        _, headers = create_role_user(client=client, db=db, role=role)

        response = client.get(
            f"{settings.API_V1_STR}/users/{target_user.id}", headers=headers
        )

        assert response.status_code == expected_status


def test_metrics_role_permissions(client: TestClient, db: Session) -> None:
    expected_status_by_role = {
        UserRole.admin: 200,
        UserRole.manager: 200,
        UserRole.member: 403,
    }

    for role, expected_status in expected_status_by_role.items():
        _, headers = create_role_user(client=client, db=db, role=role)

        response = client.get(f"{settings.API_V1_STR}/metrics/", headers=headers)

        assert response.status_code == expected_status
        if expected_status == 200:
            assert response.json() == {"active_users": 0, "total_users": 0}


def test_only_admin_can_manage_users(client: TestClient, db: Session) -> None:
    _, admin_headers = create_role_user(client=client, db=db, role=UserRole.admin)
    create_response = client.post(
        f"{settings.API_V1_STR}/users/",
        headers=admin_headers,
        json={"email": random_email(), "password": random_lower_string()},
    )
    assert create_response.status_code == 200
    managed_user_id = uuid.UUID(create_response.json()["id"])

    update_response = client.patch(
        f"{settings.API_V1_STR}/users/{managed_user_id}",
        headers=admin_headers,
        json={"full_name": "Managed by admin"},
    )
    assert update_response.status_code == 200

    delete_response = client.delete(
        f"{settings.API_V1_STR}/users/{managed_user_id}", headers=admin_headers
    )
    assert delete_response.status_code == 200

    for role in (UserRole.manager, UserRole.member):
        _, headers = create_role_user(client=client, db=db, role=role)
        target_user, _ = create_role_user(client=client, db=db, role=UserRole.member)

        denied_create_response = client.post(
            f"{settings.API_V1_STR}/users/",
            headers=headers,
            json={"email": random_email(), "password": random_lower_string()},
        )
        assert denied_create_response.status_code == 403

        denied_update_response = client.patch(
            f"{settings.API_V1_STR}/users/{target_user.id}",
            headers=headers,
            json={"full_name": "Unauthorized update"},
        )
        assert denied_update_response.status_code == 403

        denied_delete_response = client.delete(
            f"{settings.API_V1_STR}/users/{target_user.id}", headers=headers
        )
        assert denied_delete_response.status_code == 403
