import * as React from 'react';
import styles from './ChatFin.module.scss';

export interface IChatFinProps {
  webhookUrl: string;
  title: string;
  placeholder: string;
}

export interface IChatMessage {
  role: 'user' | 'bot';
  text: string;
}

interface IWebhookResponse {
  reply?: string | null;
  threadId?: string;
  sessionId?: string;
}

export default function ChatFin(props: IChatFinProps): React.ReactElement {
  const webhookUrl =
    props.webhookUrl ||
    'https://impper.app.n8n.cloud/webhook/a957fcd4-1384-4ca6-81b7-1dd3fb8fff6c/chat';

  const [messages, setMessages] = React.useState<IChatMessage[]>([]);
  const [status, setStatus] = React.useState<string>('Conectado');
  const [input, setInput] = React.useState<string>('');
  const [sending, setSending] = React.useState<boolean>(false);

  const threadIdRef = React.useRef<string>(localStorage.getItem('n8n-thread-id') || '');
  const sessionIdRef = React.useRef<string>(
    localStorage.getItem('n8n-session-id') || crypto.randomUUID()
  );

  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const pickReplyText = (data: unknown): string => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (typeof data === 'object' && data !== null && 'reply' in data) {
      return String((data as IWebhookResponse).reply || '').trim();
    }
    return '';
  };

  const appendMessage = (role: 'user' | 'bot', text: string): void => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  const sendMessage = async (text: string): Promise<void> => {
    if (!text.trim() || sending) return;

    appendMessage('user', text);
    setSending(true);
    setStatus('Enviando...');

    const currentThreadId = threadIdRef.current;
    const currentSessionId = sessionIdRef.current;

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatInput: text,
          sessionId: currentSessionId,
          threadId: currentThreadId
        })
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(
          `Erro ${response.status} ${response.statusText}${errText ? ` - ${errText}` : ''}`
        );
      }

      const contentType = response.headers.get('content-type') || '';
      const data: IWebhookResponse = contentType.includes('application/json')
        ? (await response.json() as IWebhookResponse)
        : { reply: await response.text() };

      const newThreadId = data.threadId;
      const newSessionId = data.sessionId;

      if (newThreadId) {
        threadIdRef.current = newThreadId;
        localStorage.setItem('n8n-thread-id', newThreadId);
      }

      if (newSessionId) {
        sessionIdRef.current = newSessionId;
        localStorage.setItem('n8n-session-id', newSessionId);
      }

      const reply = pickReplyText(data);

      if (!reply) {
        appendMessage(
          'bot',
          'Não recebemos uma resposta textual do n8n. Confira o node "Respond to Webhook" e retorne algo como {"reply":"..."}'
        );
        setStatus('Sem resposta');
        return;
      }

      appendMessage('bot', reply);
      setStatus('Conectado');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      appendMessage(
        'bot',
        'Ocorreu um erro ao conversar com o n8n. Verifique o webhook e o retorno do "Respond to Webhook".'
      );
      setStatus('Erro');
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const text = input;
    setInput('');
    sendMessage(text).catch(() => undefined);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input).catch(() => undefined);
      setInput('');
    }
  };

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.title}>
          <div className={styles.dot} />
          <span>{props.title || 'Chat Impper'}</span>
        </div>

        <span className={styles.status}>{status}</span>
      </header>

      <main className={styles.panel}>
        <section className={styles.messages}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`${styles.bubble} ${m.role === 'user' ? styles.user : styles.bot}`}
            >
              {m.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </section>

        <form className={styles.composer} onSubmit={onSubmit}>
          <textarea
            value={input}
            rows={1}
            placeholder={props.placeholder || 'Pergunte qualquer coisa...'}
            autoComplete="off"
            disabled={sending}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button type="submit" disabled={sending}>
            {sending ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      </main>
    </div>
  );
}