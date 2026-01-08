import { useState } from "react";
import "../../styles/kakaoChat.css";

export default function MessageInput({ disabled, onSend }) {
    const [text, setText] = useState("");

    const send = async () => {
        const v = text.trim();
        if (!v || disabled) return;
        await onSend(v);
        setText("");
    };

    return (
        <div className="kcInputBar">
            <input
                className="kcInput"
                value={text}
                disabled={disabled}
                placeholder={disabled ? "방을 선택하세요" : "메시지를 입력하세요"}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button className="kcSend" disabled={disabled} onClick={send}>
                전송
            </button>
        </div>
    );
}


