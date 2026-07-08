import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import "./MessageInput.css";

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
}

export default function MessageInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="message-input-shell">
      <div className="message-input">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="输入问题，回车发送，Shift+回车换行"
          rows={1}
          disabled={disabled}
        />
        <button
          className="send-btn"
          onClick={send}
          disabled={disabled || !text.trim()}
          aria-label="发送消息"
          type="button"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
