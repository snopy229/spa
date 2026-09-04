from collections import defaultdict


class DefaultHTTPException(Exception):
    status_code = 500
    error = "SERVER_ERROR"
    message = "An unexpected error occurred"

    def __init__(self, detail: object = None) -> None:
        self.detail = detail or {
            "error": self.error,
            "message": self.message,
        }
        super().__init__(self.message)


def exception_responses(*exceptions: type[DefaultHTTPException]) -> dict:
    grouped: dict[int, list[type[DefaultHTTPException]]] = defaultdict(list)
    for exc in exceptions:
        grouped[exc.status_code].append(exc)

    responses = {}
    for status_code, excs in grouped.items():
        responses[str(status_code)] = {
            "content": {
                "application/json": {
                    "examples": {
                        exc.error: {
                            "summary": exc.error,
                            "value": {
                                "detail": {
                                    "error": exc.error,
                                    "message": exc.message,
                                }
                            },
                        }
                        for exc in excs
                    }
                }
            },
        }

    return {"responses": responses}
