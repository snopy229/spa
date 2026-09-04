import { useEffect, useState, useRef } from 'react';
import './App.css';

const API_BASE = 'http://localhost:8080';

async function fetchComments(orderBy = "-created_at", page = 1) {
  const params = new URLSearchParams({ order_by: orderBy, page });
  const res = await fetch(`${API_BASE}/api/comments?${params}`);
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

function isImageFile(path) {
  if (!path) return false;
  return /\.(jpe?g|png|gif|webp)$/i.test(path.split('?')[0]);
}

function sortComments(list, orderBy) {
  const isDesc = orderBy.startsWith("-");
  const field = isDesc ? orderBy.slice(1) : orderBy;

  return [...list].sort((a, b) => {
    let valA = a[field] ?? "";
    let valB = b[field] ?? "";

    if (field === "created_at") {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    } else if (typeof valA === "string") {
      return isDesc
        ? valB.localeCompare(valA)
        : valA.localeCompare(valB);
    }

    return isDesc ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
  });
}

function addCommentToTree(list, newComment, orderBy, page) {
  if (!newComment.comment_id) {
    if (page !== 1) {
      return list;
    }
    const updated = [...list, newComment];
    return sortComments(updated, orderBy);
  }

  let parentFound = false;

  function insertReply(items) {
    return items.map((item) => {
      if (item.id === newComment.comment_id) {
        parentFound = true;
        return {
          ...item,
          replies: [...(item.replies || []), newComment],
        };
      }
      if (item.replies && item.replies.length > 0) {
        return {
          ...item,
          replies: insertReply(item.replies),
        };
      }
      return item;
    });
  }

  const updatedTree = insertReply(list);
  return parentFound ? updatedTree : list;
}

function CommentItem({ comment, isRoot = false, onReply, onImageClick }) {
  const avatarUrl = getMediaUrl(comment.avatar);
  const fileUrl = getMediaUrl(comment.file);
  const isFileImage = isImageFile(comment.file);

  return (
    <div className={`comment ${isRoot ? 'comment-root' : ''}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={comment.username}
          className="avatar"
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <div className="avatar" style={{ backgroundColor: '#F2A93B' }}>
          {comment.username.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="comment-body">
        <div className="comment-meta">
          <span className="comment-name">{comment.username}</span>
          <span className="comment-date">{formatDate(comment.created_at)}</span>
        </div>

        <p
          className="comment-text"
          dangerouslySetInnerHTML={{ __html: comment.text }}
        />

        {fileUrl && (
          <div className="comment-attachment" style={{ marginTop: 8 }}>
            {isFileImage ? (
              <img
                src={fileUrl}
                alt="Вложение"
                className="comment-attachment-img"
                onClick={() => onImageClick(fileUrl)}
              />
            ) : (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}
              >
                📎 {comment.file.split('/').pop()}
              </a>
            )}
          </div>
        )}

        <button
          type="button"
          className="reply-btn"
          onClick={() => onReply(comment)}
        >
          ↩ Ответить
        </button>

        {comment.replies && comment.replies.length > 0 && (
          <div className="replies">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                isRoot={false}
                onReply={onReply}
                onImageClick={onImageClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderBy, setOrderBy] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [replyTarget, setReplyTarget] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const [messageText, setMessageText] = useState("");
  const textareaRef = useRef(null);

  const [captchaText, setCaptchaText] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState(false);
  const canvasRef = useRef(null);

  const insertTag = (openTag, closeTag) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = messageText.substring(start, end);

    const replacement = `${openTag}${selectedText}${closeTag}`;
    const newText = messageText.substring(0, start) + replacement + messageText.substring(end);

    setMessageText(newText);

    setTimeout(() => {
      textarea.focus();
      if (selectedText.length > 0) {
        textarea.setSelectionRange(start + openTag.length, end + openTag.length);
      } else {
        const cursorPosition = start + openTag.length;
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  };

  const generateCaptcha = () => {
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(code);
    setCaptchaInput("");
    setCaptchaError(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#F6F7F4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = ["#F2A93B", "#D6D9D1", "#767C82"][Math.floor(Math.random() * 3)];
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = "#A8ADB2";
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < code.length; i++) {
      ctx.save();
      ctx.font = `bold ${20 + Math.floor(Math.random() * 4)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = "#15181D";

      const x = 16 + i * 20;
      const y = 28 + Math.floor(Math.random() * 6) - 3;
      const angle = (Math.random() - 0.5) * 0.4;

      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillText(code[i], 0, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchComments(orderBy, page)
      .then((data) => {
        setComments(Array.isArray(data) ? data : data.items || []);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Не удалось загрузить комментарии");
      })
      .finally(() => setLoading(false));
  }, [orderBy, page]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws/comments');

    ws.onmessage = (event) => {
      try {
        const newComment = JSON.parse(event.data);
        if (!newComment.replies) {
          newComment.replies = [];
        }
        setComments((prevComments) => addCommentToTree(prevComments, newComment, orderBy, page));
      } catch (err) {
        console.error(err);
      }
    };

    ws.onerror = (err) => {
      console.error('WS Error:', err);
    };

    return () => {
      ws.close();
    };
  }, [orderBy, page]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (captchaInput.trim().toLowerCase() !== captchaText.toLowerCase()) {
      setCaptchaError(true);
      generateCaptcha();
      return;
    }

    setCaptchaError(false);
  };

  return (
    <div className="wrap">
      <header className="header">
        <div className="logo mono">{ }</div>
        <div>
          <h1>Комментарии</h1>
          <p>{comments.length} сообщений</p>
        </div>
      </header>

      <div className="layout">
        <div className="feed-column">
          <div className="surface sort-bar">
            <div className="sort-group">
              <button
                className={`sort-btn ${orderBy.includes('username') ? 'active' : ''}`}
                onClick={() => setOrderBy(orderBy === 'username' ? '-username' : 'username')}
              >
                Имя {orderBy === '-username' ? '▾' : orderBy === 'username' ? '▴' : '⇅'}
              </button>
              <button
                className={`sort-btn ${orderBy.includes('email') ? 'active' : ''}`}
                onClick={() => setOrderBy(orderBy === 'email' ? '-email' : 'email')}
              >
                E-mail {orderBy === '-email' ? '▾' : orderBy === 'email' ? '▴' : '⇅'}
              </button>
              <button
                className={`sort-btn ${orderBy.includes('created_at') ? 'active' : ''}`}
                onClick={() => setOrderBy(orderBy === '-created_at' ? 'created_at' : '-created_at')}
              >
                Дата {orderBy === '-created_at' ? '▾' : orderBy === 'created_at' ? '▴' : '⇅'}
              </button>
            </div>
            <span className="sort-hint">по умолчанию — LIFO</span>
          </div>

          <div className="surface feed">
            {loading && <p style={{ padding: 16 }}>Загрузка сообщений...</p>}
            {error && <p style={{ padding: 16, color: 'red' }}>{error}</p>}

            {!loading && !error && comments.length === 0 && (
              <p style={{ padding: 16, color: 'var(--muted)' }}>Комментариев пока нет</p>
            )}

            {!loading && comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isRoot={true}
                onReply={(target) => setReplyTarget(target)}
                onImageClick={(url) => setSelectedImage(url)}
              />
            ))}
          </div>

          <div className="pagination">
            <button
              className="page-arrow"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ‹
            </button>
            <button className="page-btn active">{page}</button>
            <button
              className="page-arrow"
              onClick={() => setPage(p => p + 1)}
            >
              ›
            </button>
          </div>
        </div>

        <div className="surface composer-column">
          <div className="composer-tabs">
            <div className="tabs-left">
              <button className="tab active">✎ Написать</button>
            </div>
          </div>

          <form className="composer-body" onSubmit={handleSubmit}>
            {replyTarget && (
              <div className="reply-banner">
                <span>Ответ пользователю <b>{replyTarget.username}</b></span>
                <button type="button" onClick={() => setReplyTarget(null)}>×</button>
              </div>
            )}

            <div className="form-grid">
              <div className="field full avatar-picker-field">
                <label>Аватар</label>
                <div className="avatar-picker">
                  <div className="avatar avatar-preview" style={{ backgroundColor: '#F2A93B' }}>?</div>
                  <label htmlFor="user-avatar" className="avatar-upload-btn">
                    Выбрать изображение
                    <input id="user-avatar" type="file" accept="image/png,image/jpeg,image/gif" hidden />
                  </label>
                </div>
              </div>

              <div className="field">
                <label htmlFor="user-name">User Name *</label>
                <input id="user-name" type="text" placeholder="latin_letters123" required />
              </div>
              <div className="field">
                <label htmlFor="user-email">E-mail</label>
                <input id="user-email" type="email" placeholder="mail@example.com" />
              </div>
              <div className="field full">
                <label htmlFor="user-homepage">Home page</label>
                <input id="user-homepage" type="url" placeholder="https://example.com" />
              </div>
            </div>

            <div className="toolbar">
              <button
                type="button"
                className="tool-btn"
                onClick={() => insertTag('<i>', '</i>')}
              >
                &lt;i&gt;
              </button>
              <button
                type="button"
                className="tool-btn"
                onClick={() => insertTag('<strong>', '</strong>')}
              >
                &lt;strong&gt;
              </button>
              <button
                type="button"
                className="tool-btn mono"
                onClick={() => insertTag('<code>', '</code>')}
              >
                &lt;code&gt;
              </button>
              <button
                type="button"
                className="tool-btn"
                onClick={() => insertTag('<a href="" title="">', '</a>')}
              >
                &lt;a&gt;
              </button>
              <span className="allowed-tags">&lt;a&gt; &lt;code&gt; &lt;i&gt; &lt;strong&gt;</span>
            </div>

            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="message"
              placeholder="Введите текст комментария…"
            />

            <label className="dropzone">
              <input type="file" accept=".jpg,.png,.gif,.txt" hidden />
              📎 Перетащите файл или нажмите для выбора
              <span className="formats">JPG · PNG · GIF · TXT</span>
            </label>

            <div className="captcha-row">
              <canvas
                ref={canvasRef}
                width={120}
                height={44}
                className="captcha-img"
                onClick={generateCaptcha}
                style={{ cursor: 'pointer', padding: 0 }}
                title="Нажмите, чтобы обновить"
              />
              <button
                type="button"
                className="captcha-refresh"
                onClick={generateCaptcha}
                title="Обновить код"
              >
                ↻
              </button>
              <input
                type="text"
                placeholder="Код с картинки"
                value={captchaInput}
                onChange={(e) => {
                  setCaptchaInput(e.target.value);
                  if (captchaError) setCaptchaError(false);
                }}
                style={captchaError ? { borderColor: '#ef4444', outlineColor: '#ef4444' } : {}}
                required
              />
            </div>
            {captchaError && (
              <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Неверный код с картинки
              </span>
            )}

            <button type="submit" className="submit-btn">➤ Отправить комментарий</button>
          </form>
        </div>
      </div>

      {selectedImage && (
        <div className="lightbox-overlay" onClick={() => setSelectedImage(null)}>
          <div className="lightbox-content">
            <img src={selectedImage} alt="Увеличенное изображение" />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
