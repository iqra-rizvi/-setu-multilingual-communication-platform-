import { useState } from "react";
import { sendMessageToBot } from "../services/chatbotService";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! 👋 I'm your AI Assistant. How can I help you?",
    },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
  if (!input.trim()) return;

  const question = input;

  // User message
  const userMessage = {
    sender: "user",
    text: question,
  };

  setMessages((prev) => [...prev, userMessage]);
  setInput("");

  // Backend response
  const answer = await sendMessageToBot(question);

  const botMessage = {
    sender: "bot",
    text: answer,
  };

  setMessages((prev) => [...prev, botMessage]);
};

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-blue-900 text-white w-14 h-14 rounded-full shadow-lg text-2xl"
      >
        💬
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-blue-950 rounded-lg shadow-xl border">

          {/* Header */}
          <div className="bg-blue-900 text-white p-3 rounded-t-lg font-semibold">
            AI Assistant
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg max-w-[80%] ${
                  msg.sender === "user"
                    ? "bg-blue-900 text-white ml-auto"
                    : "bg-blue-900"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex border-t">
            <input
              type="text"
              placeholder="Type your message..."
             className="flex-1 p-2 outline-none text-blue-950 placeholder:text-gray-400"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />

            <button
              onClick={sendMessage}
              className="bg-blue-900 text-white px-4"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}