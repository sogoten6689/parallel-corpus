"""create users table

Revision ID: create_users_table
Revises: 9fbc65e15c2e
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'create_users_table'
down_revision = '9fbc65e15c2e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum type for user roles
    user_role_enum = postgresql.ENUM('admin', 'user', name='userrole')
    user_role_enum.create(op.get_bind())
    
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=False),
        sa.Column('organization', sa.String(), nullable=False),
        sa.Column('role', sa.Enum('admin', 'user', name='userrole'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
    
    # Drop enum type
    user_role_enum = postgresql.ENUM('admin', 'user', name='userrole')
    user_role_enum.drop(op.get_bind()) 