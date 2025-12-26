'use client';

import { useState } from 'react';

const ChatPage = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setResponse('');
    
    if (!query || query.length > 500) {
      setError('Query must be a non-empty string and less than 500 characters.');
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch('/api/knowledge/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (res.ok) {
        displayResponse(data.answer);
      } else {
        setError(data.error || 'An error occurred while fetching the response.');
      }
    } catch (err) {
      setError('Failed to fetch response from the server.');
    } finally {
      setLoading(false);
    }
  };

  const displayResponse = (text: string) => {
    let index = 0;
    setResponse('');

    const interval = setInterval(() => {
      if (index < text.length) {
        setResponse((prev) => prev + text[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 100); // Adjust the speed of word display here
  };

  return (
    <div className="chat-container">
      <h1 className="text-2xl font-bold mb-4">Chatbot</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask your question..."
          className="border p-2 w-full"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 mt-2">
          Send
        </button>
      </form>
      {loading && <div className="loader">Thinking...</div>}
      {error && <div className="error">{error}</div>}
      <div className="response">{response}</div>
    </div>
  );
};

export default ChatPage;