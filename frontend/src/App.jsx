import { useEffect, useState, useRef } from 'react';
import './App.css';

const API_BASE = 'http://localhost:8080';

async function fetchComments(orderBy = "-created_at", page = 1) {
  const params = new URLSearchParams({ order_by: orderBy, page });
  const res = await fetch(`${API_BASE}/api/comments?${params}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || errorData?.message || `Ошибка загрузки комментариев: ${res.status}`);
  }
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

function isTextFile(path) {
  if (!path) return false;
  return /\.txt$/i.test(path.split('?')[0]);
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
  const exists = (items) => {
    return items.some((item) => {
      if (item.id === newComment.id) return true;
      if (item.replies && item.replies.length > 0) {
        return exists(item.replies);
      }
      return false;
    });
  };

  if (exists(list)) {
    return list;
  }

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

function InlineTextSnippet({ url, fileName }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка сети");
        return res.text();
      })
      .then((text) => {
        if (isMounted) {
          setContent(text);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setContent("Не удалось загрузить содержимое файла");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  return (
    <div
      style={{
        marginTop: 8,
        background: '#F9FAFB',
        border: '1px solid var(--line-strong)',
        borderRadius: 6,
        padding: '6px 10px',
        maxWidth: '480px'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          fontSize: 11,
          color: 'var(--muted)',
          borderBottom: '1px solid var(--line)',
          paddingBottom: 4,
          marginBottom: 6
        }}
      >
        <a
          href={url}
          download
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--accent-ink)', textDecoration: 'none', fontWeight: 600 }}
        >
          Скачать ⤓
        </a>
      </div>

      {loading ? (
        <span style={{ fontSize: 11, color: 'var(--faint)' }}>Чтение содержимого...</span>
      ) : (
        <pre
          style={{
            margin: 0,
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            color: '#374151',
            maxHeight: 90,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}
        >
          {content}
        </pre>
      )}
    </div>
  );
}

function CommentRow({ comment, depth = 0, onReply, onImageClick }) {
  const avatarUrl = getMediaUrl(comment.avatar);
  const fileUrl = getMediaUrl(comment.file);
  const isFileImage = isImageFile(comment.file);
  const isFileText = isTextFile(comment.file);

  const rawHomepage = (comment.home_page || comment.homepage || "").trim();
  const homepageUrl = rawHomepage && rawHomepage !== "null"
    ? rawHomepage.startsWith('http://') || rawHomepage.startsWith('https://')
      ? rawHomepage
      : `https://${rawHomepage}`
    : null;

  return (
    <>
      <tr className={`comment-tr ${depth > 0 ? 'reply-row' : ''}`}>
        <td style={{ paddingLeft: `${16 + depth * 24}px` }} className="col-user">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {depth > 0 && <span style={{ color: 'var(--muted)', fontSize: '13px' }}>↳</span>}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={comment.username}
                className="avatar"
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div
                className="avatar"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: '#F2A93B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#fff'
                }}
              >
                {comment.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              {homepageUrl ? (
                <a
                  href={homepageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="comment-name"
                  title={`Сайт: ${homepageUrl}`}
                  style={{ textDecoration: 'underline', color: 'inherit', fontWeight: 'bold' }}
                >
                  {comment.username} ↗
                </a>
              ) : (
                <span className="comment-name" style={{ fontWeight: 'bold' }}>{comment.username}</span>
              )}
            </div>
          </div>
        </td>

        <td className="col-email">
          {comment.email ? (
            <a
              href={`mailto:${comment.email}`}
              style={{ fontSize: '13px', color: 'var(--muted)', textDecoration: 'none' }}
            >
              {comment.email}
            </a>
          ) : (
            <span style={{ color: 'var(--muted)', fontSize: '12px' }}>—</span>
          )}
        </td>

        <td className="col-text">
          <div
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
                  style={{ maxHeight: 60, borderRadius: 4, cursor: 'pointer' }}
                  onClick={() => onImageClick(fileUrl)}
                />
              ) : isFileText ? (
                <InlineTextSnippet url={fileUrl} fileName={comment.file.split('/').pop()} />
              ) : (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none', display: 'inline-block' }}
                >
                  📎 {comment.file.split('/').pop()}
                </a>
              )}
            </div>
          )}
        </td>

        <td className="col-date" style={{ whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--muted)' }}>
          {formatDate(comment.created_at)}
        </td>

        <td className="col-actions" style={{ textAlign: 'right' }}>
          <button
            type="button"
            className="reply-btn"
            onClick={() => onReply(comment)}
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            ↩
          </button>
        </td>
      </tr>

      {comment.replies && comment.replies.length > 0 && comment.replies.map((reply) => (
        <CommentRow
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          onReply={onReply}
          onImageClick={onImageClick}
        />
      ))}
    </>
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

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [homepage, setHomepage] = useState("");
  const [messageText, setMessageText] = useState("");
  const textareaRef = useRef(null);

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const avatarInputRef = useRef(null);

  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [txtFileSnippet, setTxtFileSnippet] = useState("");
  const fileInputRef = useRef(null);

  const [captchaText, setCaptchaText] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState(false);
  const canvasRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const toggleSort = (field) => {
    setOrderBy(prev => (prev === field ? `-${field}` : field));
  };

  const renderSortIndicator = (field) => {
    if (orderBy === field) return ' ▴';
    if (orderBy === `-${field}`) return ' ▾';
    return ' ⇅';
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
    }

    setAttachmentFile(file);

    if (file.type.startsWith('image/')) {
      setAttachmentPreview(URL.createObjectURL(file));
      setTxtFileSnippet("");
    } else if (file.type === "text/plain" || file.name.toLowerCase().endsWith('.txt')) {
      setAttachmentPreview(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setTxtFileSnippet(event.target.result || "");
      };
      reader.onerror = () => {
        setTxtFileSnippet("Не удалось прочитать содержимое текстового файла");
      };
      reader.readAsText(file);
    } else {
      setAttachmentPreview(null);
      setTxtFileSnippet("");
    }
  };

  const removeAttachment = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
    }
    setAttachmentFile(null);
    setAttachmentPreview(null);
    setTxtFileSnippet("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setMessageText("");
    setUsername("");
    setEmail("");
    setHomepage("");
    if (replyTarget) setReplyTarget(null);

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";

    removeAttachment();
    setCaptchaInput("");
    setCaptchaError(false);
    setSubmitError(null);
    generateCaptcha();
  };

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    };
  }, [avatarPreview, attachmentPreview]);

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
        console.error("Ошибка при загрузке комментариев:", err);
        setError(err.message || "Не удалось загрузить комментарии");
      })
      .finally(() => setLoading(false));
  }, [orderBy, page]);

  useEffect(() => {
    let ws;
    try {
      ws = new WebSocket('ws://localhost:8080/ws/comments');

      ws.onmessage = (event) => {
        try {
          const newComment = JSON.parse(event.data);
          if (!newComment.replies) {
            newComment.replies = [];
          }
          setComments((prevComments) => addCommentToTree(prevComments, newComment, orderBy, page));
        } catch (err) {
          console.error("Ошибка парсинга WebSocket сообщения:", err);
        }
      };

      ws.onerror = (err) => {
        console.warn('WS соединение недоступно или прервано:', err);
      };
    } catch (e) {
      console.warn("Ошибка инициализации WebSocket:", e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [orderBy, page]);

  const validateHTML = (text) => {
    const allowed = ['i', 'strong', 'code', 'a'];
    for (const tag of allowed) {
      const openRegex = new RegExp(`<${tag}(\\s[^>]*)?>`, 'gi');
      const closeRegex = new RegExp(`</${tag}>`, 'gi');
      const openMatches = text.match(openRegex) || [];
      const closeMatches = text.match(closeRegex) || [];

      if (openMatches.length !== closeMatches.length) {
        throw new Error(`Ошибка HTML-разметки: незакрытый тег <${tag}> (открыто: ${openMatches.length}, закрыто: ${closeMatches.length})`);
      }
    }

    const allTags = text.match(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi) || [];
    for (const tagMatch of allTags) {
      const tagNameMatch = tagMatch.match(/<\/?([a-z0-9]+)/i);
      if (tagNameMatch) {
        const tagName = tagNameMatch[1].toLowerCase();
        if (!allowed.includes(tagName)) {
          throw new Error(`Запрещенный тег: <${tagName}>. Разрешены только <a>, <code>, <i>, <strong>`);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (captchaInput.trim().toLowerCase() !== captchaText.toLowerCase()) {
      setCaptchaError(true);
      generateCaptcha();
      return;
    }
    setCaptchaError(false);

    try {
      validateHTML(messageText);
    } catch (validationErr) {
      setSubmitError(validationErr.message);
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("username", username.trim());
    formData.append("text", messageText.trim());

    if (email.trim()) formData.append("email", email.trim());
    if (homepage.trim()) formData.append("home_page", homepage.trim());
    if (replyTarget) formData.append("comment_id", replyTarget.id);
    if (avatarFile) formData.append("avatar", avatarFile);
    if (attachmentFile) formData.append("file", attachmentFile);

    try {
      const res = await fetch(`${API_BASE}/api/comments`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let parsedMessage = `Ошибка сервера (${res.status})`;

        try {
          const errJson = await res.json();
          if (Array.isArray(errJson?.detail)) {
            parsedMessage = errJson.detail.map(d => `${d.loc?.slice(-1)[0] || 'поле'}: ${d.msg}`).join('; ');
          } else if (typeof errJson?.detail === 'string') {
            parsedMessage = errJson.detail;
          } else if (errJson?.message) {
            parsedMessage = errJson.message;
          } else if (errJson?.error) {
            parsedMessage = errJson.error;
          }
        } catch {
          const rawText = await res.text().catch(() => "");
          if (rawText) {
            parsedMessage = `${parsedMessage}: ${rawText.slice(0, 120)}`;
          }
        }

        throw new Error(parsedMessage);
      }

      resetForm();

    } catch (err) {
      console.error("Ошибка отправки комментария:", err);

      if (err.name === "TypeError" && err.message.toLowerCase().includes("fetch")) {
        setSubmitError("Не удалось подключиться к серверу. Проверьте соединение или работу бэкенда.");
      } else {
        setSubmitError(err.message || "Не удалось отправить комментарий");
      }

      generateCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wrap">
      <div className="layout">
        <div className="feed-column">
          <div className="surface comments-table-container">
            <table className="comments-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('username')} style={{ cursor: 'pointer' }}>
                    User Name{renderSortIndicator('username')}
                  </th>
                  <th onClick={() => toggleSort('email')} style={{ cursor: 'pointer' }}>
                    E-mail{renderSortIndicator('email')}
                  </th>
                  <th>Текст сообщения</th>
                  <th onClick={() => toggleSort('created_at')} style={{ cursor: 'pointer' }}>
                    Дата{renderSortIndicator('created_at')}
                  </th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>
                      Загрузка сообщений...
                    </td>
                  </tr>
                )}

                {error && (
                  <tr>
                    <td colSpan="5" style={{ color: '#ef4444', textAlign: 'center', padding: '16px' }}>
                      ⚠️ {error}
                      <button
                        type="button"
                        onClick={() => setPage(p => p)}
                        style={{ marginLeft: 8, border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}
                      >
                        Повторить
                      </button>
                    </td>
                  </tr>
                )}

                {!loading && !error && comments.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                      Комментариев пока нет
                    </td>
                  </tr>
                )}

                {!loading && !error && comments.map((comment) => (
                  <CommentRow
                    key={comment.id}
                    comment={comment}
                    depth={0}
                    onReply={(target) => setReplyTarget(target)}
                    onImageClick={(url) => setSelectedImage(url)}
                  />
                ))}
              </tbody>
            </table>
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
          <div className="composer-tabs" style={{ justifyContent: 'center' }}>
            <button className="tab active" style={{ margin: '0 auto' }}>✎ Написать</button>
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
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Предпросмотр аватара"
                      className="avatar avatar-preview"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="avatar avatar-preview" style={{ backgroundColor: '#F2A93B' }}>
                      ?
                    </div>
                  )}
                  <label htmlFor="user-avatar" className="avatar-upload-btn">
                    Выбрать изображение
                    <input
                      id="user-avatar"
                      ref={avatarInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/gif"
                      onChange={handleAvatarChange}
                      hidden
                    />
                  </label>
                </div>
              </div>

              <div className="field">
                <label htmlFor="user-name">User Name *</label>
                <input
                  id="user-name"
                  type="text"
                  placeholder="latin_letters123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="user-email">E-mail *</label>
                <input
                  id="user-email"
                  type="email"
                  placeholder="mail@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="field full">
                <label htmlFor="user-homepage">Home page</label>
                <input
                  id="user-homepage"
                  type="url"
                  placeholder="https://example.com"
                  value={homepage}
                  onChange={(e) => setHomepage(e.target.value)}
                />
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
              required
            />

            <div className="attachment-box" style={{ marginTop: 8, marginBottom: 12 }}>
              <input
                id="file-attachment"
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.txt"
                onChange={handleAttachmentChange}
                hidden
              />

              {!attachmentFile ? (
                <label htmlFor="file-attachment" className="dropzone" style={{ cursor: 'pointer', display: 'block' }}>
                  📎 Перетащите файл или нажмите для выбора
                  <span className="formats">JPG · PNG · GIF · TXT</span>
                </label>
              ) : (
                <div
                  className="attachment-preview-card"
                  style={{
                    backgroundColor: '#F6F7F4',
                    borderRadius: 8,
                    border: '1px solid #D6D9D1',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 12px'
                    }}
                  >
                    {attachmentPreview ? (
                      <img
                        src={attachmentPreview}
                        alt="Превью"
                        style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          backgroundColor: '#EAECE7',
                          borderRadius: 4,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #D6D9D1'
                        }}
                      >
                        <span style={{ fontSize: 18, lineHeight: 1 }}>📄</span>
                        <span style={{ fontSize: 8, fontWeight: 700, color: '#767C82', marginTop: 2 }}>TXT</span>
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#15181D' }}>
                        {attachmentFile.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#767C82' }}>
                        {(attachmentFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={removeAttachment}
                      title="Удалить файл"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 18,
                        color: '#767C82',
                        padding: '4px 8px'
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {txtFileSnippet && (
                    <div
                      style={{
                        borderTop: '1px dashed #D6D9D1',
                        padding: '8px 12px',
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      <pre
                        style={{
                          margin: 0,
                          fontSize: 12,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: '#374151',
                          maxHeight: 120,
                          overflowY: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          background: '#F9FAFB',
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #E5E7EB'
                        }}
                      >
                        {txtFileSnippet}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

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

            {submitError && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: 6,
                  color: '#991B1B',
                  fontSize: 13,
                  marginTop: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8
                }}
              >
                <span>⚠️ {submitError}</span>
                <button
                  type="button"
                  onClick={() => setSubmitError(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B', fontWeight: 'bold', fontSize: 16 }}
                >
                  ✕
                </button>
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={isSubmitting} style={{ marginTop: 12 }}>
              {isSubmitting ? 'Отправка...' : '➤ Отправить комментарий'}
            </button>
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
