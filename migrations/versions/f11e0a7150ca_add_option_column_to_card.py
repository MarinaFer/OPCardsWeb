"""Add option column to Card

Revision ID: f11e0a7150ca
Revises: 
Create Date: 2024-12-19 13:36:43.756927

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f11e0a7150ca'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('user',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('username', sa.String(length=150), nullable=False),
    sa.Column('password', sa.String(length=150), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('username')
    )
    op.create_table('card',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('card_id', sa.Integer(), nullable=False),
    sa.Column('option', sa.String(length=10), nullable=False),
    sa.Column('is_owned', sa.Boolean(), nullable=True),
    sa.Column('repeat_count', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('card')
    op.drop_table('user')
    # ### end Alembic commands ###
