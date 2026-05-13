import React, { useEffect, useRef } from 'react';

interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
  isSystemMessage?: boolean;
}

interface MessageListProps {
  messages: Message[];
  onDeleteMessage: (messageId: string) => void;
}

export default function MessageList({ messages, onDeleteMessage }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${message.isSystemMessage ? 'justify-center' : ''}`}
        >
          {message.isSystemMessage ? (
            <div className="text-center text-gray-500 text-sm italic w-full">
              {message.content}
            </div>
          ) : (
            <>
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                {message.username.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-400">{message.username}</span>
                  <span className="text-gray-500 text-xs">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="bg-gray-800 rounded-lg p-2 mt-1 break-words">
                  <p className="text-gray-100">{message.content}</p>
                </div>
              </div>
              <button
                onClick={() => onDeleteMessage(message.id)}
                className="text-gray-600 hover:text-red-500 text-sm opacity-0 hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </>
          )}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}