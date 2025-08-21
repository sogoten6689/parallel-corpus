"""Complete database restructure

Revision ID: complete_restructure_001
Revises: 0d9ecdc12dbd
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'complete_restructure_001'
down_revision = '0d9ecdc12dbd'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to users table
    op.add_column('users', sa.Column('phone', sa.String(), nullable=True))
    op.add_column('users', sa.Column('status', sa.String(), nullable=True, default='active'))
    op.add_column('users', sa.Column('work_unit', sa.String(), nullable=True))
    
    # Add created_by column to row_words table
    op.add_column('row_words', sa.Column('created_by', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_row_words_created_by', 'row_words', 'users', ['created_by'], ['id'])
    
    # Create word_row_master table
    op.create_table('word_row_master',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('row_word_id', sa.String(), nullable=True),
        sa.Column('id_sen', sa.String(), nullable=True),
        sa.Column('word', sa.String(), nullable=True),
        sa.Column('lemma', sa.String(), nullable=True),
        sa.Column('links', sa.String(), nullable=True),
        sa.Column('morph', sa.String(), nullable=True),
        sa.Column('pos', sa.String(), nullable=True),
        sa.Column('phrase', sa.String(), nullable=True),
        sa.Column('grm', sa.String(), nullable=True),
        sa.Column('ner', sa.String(), nullable=True),
        sa.Column('semantic', sa.String(), nullable=True),
        sa.Column('lang_code', sa.String(), nullable=True),
        sa.Column('create_by', sa.Integer(), nullable=True),
        sa.Column('approval_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['create_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['approval_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['row_word_id'], ['row_words.ID'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_word_row_master_id'), 'word_row_master', ['id'], unique=False)
    
    # Drop sentence table
    op.drop_table('sentence')


def downgrade():
    # Recreate sentence table
    op.create_table('sentence',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('text', sa.String(), nullable=True),
        sa.Column('language', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Drop word_row_master table
    op.drop_index(op.f('ix_word_row_master_id'), table_name='word_row_master')
    op.drop_table('word_row_master')
    
    # Drop foreign key and column from row_words
    op.drop_constraint('fk_row_words_created_by', 'row_words', type_='foreignkey')
    op.drop_column('row_words', 'created_by')
    
    # Drop columns from users table
    op.drop_column('users', 'work_unit')
    op.drop_column('users', 'status')
    op.drop_column('users', 'phone')
