local-run:
	python manage.py init_project
	python manage.py runserver

mig:
	python manage.py makemigrations
	python manage.py migrate

run:
	python manage.py migrate --noinput
# 	python manage.py collectstatic --noinput
# 	python manage.py init_project
	gunicorn config.wsgi:application --bind 0.0.0.0:8080 --workers 3 --reload

worker:
	celery -A config worker -E -l info
