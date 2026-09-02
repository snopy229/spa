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
        super().__init__(status_code=self.status_code, detail=self.detail)


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


class FileTooLargeException(DefaultHTTPException):
    status_code = 400
    error = "FILE_TOO_LARGE"
    message = "The uploaded file is too large to be processed max size is 100 KB"


class InvalidFileTypeException(DefaultHTTPException):
    status_code = 400
    error = "INVALID_FILE_TYPE"
    message = (
        "The uploaded file type is not allowed. Allowed types are: TXT, JPG, GIF, PNG"
    )


class EmptyUsernameException(DefaultHTTPException):
    status_code = 422
    error = "EMPTY_USERNAME"
    message = "The username cannot be empty"


class InvalidUsernameException(DefaultHTTPException):
    status_code = 422
    error = "INVALID_USERNAME"
    message = "The username can only contain Latin letters and numbers"


class EmptyCommentTextException(DefaultHTTPException):
    status_code = 422
    error = "EMPTY_COMMENT_TEXT"
    message = "The comment text cannot be empty. Only the following tags are allowed: <a>, <code>, <i>, <strong>"


class InvalidCommentTextException(DefaultHTTPException):
    status_code = 422
    error = "INVALID_TAGS OR_ATTRIBUTES"
    message = "The comment text contains invalid HTML tags or attributes. Allowed tags are: <a>, <code>, <i>, <strong> and allowed attributes for <a> are: href, title"


class HTMLTagsNotClosedException(DefaultHTTPException):
    status_code = 422
    error = "INVALID_HTML_TAGS"
    message = "Not all HTML tags are closed correctly"
