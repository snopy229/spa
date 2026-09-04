from src.default_exceptions import DefaultHTTPException


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


class InvalidUsernameException(DefaultHTTPException):
    status_code = 422
    error = "INVALID_USERNAME"
    message = "The username can only contain Latin letters and numbers"


class InvalidCommentTextException(DefaultHTTPException):
    status_code = 422
    error = "INVALID_TAGS OR_ATTRIBUTES"
    message = "The comment text contains invalid HTML tags or attributes. Allowed tags are: <a>, <code>, <i>, <strong> and allowed attributes for <a> are: href, title"


class HTMLTagsNotClosedException(DefaultHTTPException):
    status_code = 422
    error = "INVALID_HTML_TAGS"
    message = "Not all HTML tags are closed correctly"
