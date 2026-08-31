backend-run:
	python manage.py migrate --noinput
# 	python manage.py collectstatic --noinput
# 	python manage.py init_project
	uvicorn config.asgi:application --host 0.0.0.0 --port 8080 --reload
