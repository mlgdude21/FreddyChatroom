import React, { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
  isSystemMessage?: boolean;
}

interface UserInfo {
  username: string;
  userId: string;
}

export default function ChatRoom() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('user_joined', (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          userId: 'system',
          username: 'System',
          content: `${data.username} joined the chat`,
          timestamp: new Date().toISOString(),
          isSystemMessage: true,
        },
      ]);
      setUserCount(data.count);
    });

    newSocket.on('message_history', (history) => {
      setMessages(history);
    });

    newSocket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('user_count', (count) => {
      setUserCount(count);
    });

    newSocket.on('user_left', (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          userId: 'system',
          username: 'System',
          content: `${data.username} left the chat`,
          timestamp: new Date().toISOString(),
          isSystemMessage: true,
        },
      ]);
      setUserCount(data.count);
    });

    newSocket.on('message_deleted', (messageId) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleSendMessage = (content: string) => {
    if (socket && content.trim()) {
      socket.emit('send_message', { content });
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (socket) {
      socket.emit('delete_message', messageId);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Anonymous Chatroom</h1>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
              {isConnected ? '● Connected' : '● Disconnected'}
            </div>
            <div className="px-3 py-1 rounded-full text-sm bg-blue-900 text-blue-200">
              👥 {userCount} online
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-4xl w-full mx-auto">
        <MessageList messages={messages} onDeleteMessage={handleDeleteMessage} />
        <MessageInput onSendMessage={handleSendMessage} isConnected={isConnected} />
      </div>
    </div>
  );
}