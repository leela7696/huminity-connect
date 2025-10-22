import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

type Message = { role: 'user' | 'assistant'; content: string };

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const response = await fetch(
        `https://uapjjplsrwxhirlwxpvp.supabase.co/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: [...messages, userMsg] }),
        }
      );

      if (response.status === 429 || response.status === 402) {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (!response.ok || !response.body) throw new Error('Failed to start stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>AI Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[400px] pr-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`mb-4 p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]'
                  : 'bg-muted max-w-[80%]'
              }`}
            >
              {msg.content}
            </div>
          ))}
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            disabled={isLoading}
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChat;
