backend-run:
	python manage.py migrate --noinput
	uvicorn config.asgi:application --host 0.0.0.0 --port 8080 --reload
