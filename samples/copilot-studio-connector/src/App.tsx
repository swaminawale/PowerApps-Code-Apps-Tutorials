import "./App.css";
import { MicrosoftCopilotStudioService } from "./generated";
import { useEffect, useRef, useState } from "react";

const AGENT_NAME = "crec4_agentpXtQ7R";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

type CopilotResponsePayload = {
  responses?: string[];
  conversationId?: string;
  ConversationId?: string;
  conversationID?: string;
  completed?: boolean;
  Completed?: boolean;
  isExpectingInput?: boolean;
};

function App() {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const endOfChatRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endOfChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const addMessage = (role: ChatMessage["role"], text: string) => {
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now() + currentMessages.length,
        role,
        text,
      },
    ]);
  };

  const handleSend = async () => {
    const nextMessage = inputValue.trim();
    if (!nextMessage || isLoading) {
      return;
    }

    setErrorMessage("");
    addMessage("user", nextMessage);
    setInputValue("");
    setIsLoading(true);

    try {
      const requestBody = {
        message: nextMessage,
        notificationUrl: "https://notificationurlplaceholder",
        agentName: AGENT_NAME,
      };
      console.log("Sending request to Microsoft Copilot Studio Service:", {
        AGENT_NAME,
        requestBody,
        conversationId,
      });
      const result = await MicrosoftCopilotStudioService.ExecuteCopilotAsyncV2(
        AGENT_NAME,
        requestBody,
        conversationId,
      );

      const payload = (result.data ?? {}) as CopilotResponsePayload;
      const returnedConversationId =
        payload.conversationId ??
        payload.ConversationId ??
        payload.conversationID;
      const returnedMessages = Array.isArray(payload.responses)
        ? payload.responses.filter((responseText) =>
            Boolean(responseText?.trim()),
          )
        : [];

      if (returnedConversationId) {
        setConversationId(returnedConversationId);
      }

      if (returnedMessages.length > 0) {
        addMessage("assistant", returnedMessages.join("\n\n"));
      } else {
        addMessage(
          "assistant",
          "I got your request, but the connector did not return a text response.",
        );
      }
    } catch (error) {
      const nextErrorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send message. Please try again.";
      setErrorMessage(nextErrorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(undefined);
    setInputValue("");
    setErrorMessage("");
  };

  return (
    <main className="chat-page">
      <section className="chat-shell">
        <header className="chat-header">
          <div>
            <h1>Copilot Chat</h1>
            <p>Send messages and continue in the same conversation.</p>
          </div>
          <button
            type="button"
            className="new-conversation-button"
            onClick={handleNewConversation}
            disabled={isLoading}
          >
            New conversation
          </button>
        </header>

        <section className="chat-messages" aria-live="polite">
          {messages.length === 0 ? (
            <div className="empty-state">
              Type a message and click Send to start a conversation.
            </div>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className={`message-row message-row-${message.role}`}
              >
                <div
                  className={`message-bubble message-bubble-${message.role}`}
                >
                  {message.text}
                </div>
              </article>
            ))
          )}

          {isLoading ? (
            <article className="message-row message-row-assistant">
              <div className="message-bubble message-bubble-assistant typing-indicator">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </article>
          ) : null}

          <div ref={endOfChatRef} />
        </section>

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

        <form
          className="chat-composer"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend();
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Type your message..."
            aria-label="Message input"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !inputValue.trim()}>
            {isLoading ? "Sending..." : "Send"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default App;
