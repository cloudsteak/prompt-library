#!/usr/bin/env python3
"""Run Alembic migrations programmatically."""
import os
import sys

from alembic import command
from alembic.config import Config


def run_migrations():
    """Run all pending migrations."""
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Create Alembic config
    alembic_cfg = Config(os.path.join(script_dir, "alembic.ini"))

    # Set the script location relative to alembic.ini
    alembic_cfg.set_main_option("script_location", os.path.join(script_dir, "alembic"))

    # Run the upgrade
    print("Running database migrations...")
    try:
        command.upgrade(alembic_cfg, "head")
        print("Migrations completed successfully.")
    except Exception as e:
        print(f"Migration failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    run_migrations()
