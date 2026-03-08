#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --noinput
# NOTE: Tables already exist in Supabase. Migrate is skipped during build
# to avoid IPv6 connection failure on Render's build servers.
# Run: python manage.py migrate --run-syncdb   if new models are added.
