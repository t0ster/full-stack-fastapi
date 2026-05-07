"""Replace is_superuser with role

Revision ID: a6c9d4f1e2b3
Revises: fe56fa70289e
Create Date: 2026-05-05 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = "a6c9d4f1e2b3"
down_revision = "fe56fa70289e"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "user",
        sa.Column("role", sa.String(length=20), nullable=False, server_default="member"),
    )
    op.execute("UPDATE \"user\" SET role = 'admin' WHERE is_superuser")
    op.drop_column("user", "is_superuser")


def downgrade():
    op.add_column(
        "user",
        sa.Column(
            "is_superuser", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
    )
    op.execute("UPDATE \"user\" SET is_superuser = true WHERE role = 'admin'")
    op.drop_column("user", "role")
