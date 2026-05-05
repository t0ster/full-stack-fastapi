from fastapi import APIRouter, Depends

from app.api.deps import require_roles
from app.models import UserRole

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get(
    "/",
    dependencies=[Depends(require_roles(UserRole.admin, UserRole.manager))],
)
def read_metrics() -> dict[str, int]:
    return {"active_users": 0, "total_users": 0}
