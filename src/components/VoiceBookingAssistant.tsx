import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, MessageCircle, Send, X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDiesVisita, useCrearCita } from '@/hooks/useDiesVisita';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { generatePin } from '@/lib/generatePin';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface BookingAction {
  action: 'BOOK';
  data: {
    tipus: 'metge' | 'infermera';
    dia_visita_id: string;
    numero_tanda: number;
    nom_complet: string;
    telefon: string;
    email: string;
  };
}

export function VoiceBookingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const scrollRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: diesVisita = [] } = useDiesVisita();
  const crearCita = useCrearCita();

  const speak = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const data = await response.json();
      
      if (data.audioContent) {
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => setIsSpeaking(false);
        audioRef.current.onerror = () => setIsSpeaking(false);
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error TTS:', error);
      setIsSpeaking(false);
      // Fallback a síntesi del navegador
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ca-ES';
        utterance.rate = 0.9;
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      toast.error('El teu navegador no suporta el reconeixement de veu');
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'ca-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [SpeechRecognitionAPI]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const processBookingAction = async (content: string) => {
    const jsonMatch = content.match(/\{"action":\s*"BOOK".*?\}/s);
    if (jsonMatch) {
      try {
        const action: BookingAction = JSON.parse(jsonMatch[0]);
        if (action.action === 'BOOK' && action.data) {
          const pin = generatePin();
          await crearCita.mutateAsync({
            dia_visita_id: action.data.dia_visita_id,
            tipus: action.data.tipus,
            numero_tanda: action.data.numero_tanda,
            nom_complet: action.data.nom_complet,
            telefon: action.data.telefon,
            email: action.data.email,
            pin_cancelacio: pin,
          });
          toast.success(`Cita reservada! El teu PIN de cancel·lació és: ${pin}`);
          return content.replace(jsonMatch[0], '');
        }
      } catch (e) {
        console.error('Error processant reserva:', e);
      }
    }
    return content;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const availableDays = diesVisita.map(dia => ({
        id: dia.id,
        data: dia.data,
        metge_actiu: dia.metge_actiu,
        infermera_activa: dia.infermera_activa,
        max_tandes_metge: dia.max_tandes_metge,
        max_tandes_infermera: dia.max_tandes_infermera,
      }));

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-booking-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          availableDays,
        }),
      });

      if (!response.ok) {
        throw new Error('Error de connexió');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content;
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
                // Ignorar errors de parsing
              }
            }
          }
        }
      }

      const cleanContent = await processBookingAction(assistantContent);
      
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: cleanContent } : m
          );
        }
        return prev;
      });

      // Llegir resposta amb veu ElevenLabs
      speak(cleanContent.replace(/[#*`]/g, ''));

    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de connexió amb l\'assistent');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome = 'Hola! Sóc l\'Alba, l\'assistent virtual del Consultori de l\'Albagés. Puc ajudar-te a demanar cita amb el metge o la infermera. Què necessites?';
      setMessages([{ role: 'assistant', content: welcome }]);
      speak(welcome);
    }
  }, [isOpen, messages.length, speak]);

  return (
    <>
      {/* Botó integrat a la pàgina - NO flotant */}
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card 
            className="cursor-pointer border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
            onClick={() => setIsOpen(true)}
          >
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Parla amb l'Alba</h3>
                  <p className="text-sm text-muted-foreground">L'assistent virtual que t'ajuda a agendar visita</p>
                </div>
                <Button variant="default" size="sm">
                  Començar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Modal de l'assistent */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <Card className="max-h-[80vh] flex flex-col">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    L'Alba - Assistent de Cites
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {isSpeaking && (
                      <Button variant="ghost" size="icon" onClick={stopSpeaking}>
                        <Volume2 className="w-4 h-4 animate-pulse text-primary" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
                  <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
                    <div className="space-y-4">
                      {messages.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] px-4 py-2 rounded-2xl ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {msg.role === 'assistant' ? (
                              <div className="prose prose-sm dark:prose-invert">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            ) : (
                              msg.content
                            )}
                          </div>
                        </motion.div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted px-4 py-2 rounded-2xl">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-75" />
                              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-150" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant={isListening ? 'destructive' : 'outline'}
                      size="icon"
                      onClick={isListening ? stopListening : startListening}
                      disabled={isLoading}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Escriu o parla..."
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
