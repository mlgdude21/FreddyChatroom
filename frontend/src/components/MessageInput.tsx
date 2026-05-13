import React, { useState } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isConnected: boolean;
}

export default function MessageInput({ onSendMessage, isConnected }: MessageInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && isConnected) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-700 p-4 bg-gray-800">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
          disabled={!isConnected}
          maxLength={500}
          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!isConnected || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          Send
        </button>
      </div>
      <div className="text-gray-400 text-xs mt-2">{input.length}/500</div>
    </form>
  );
}