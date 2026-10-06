"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";

type Message = { role: "user" | "bot"; text: string; time: number };

export function LiveChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hi! I'm AceWears Support. How can I help you today?", time: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", text: input, time: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    // Simulated bot response (in production: connect to a chat API or LLM)
    setTimeout(() => {
      const responses = [
        "Thanks for reaching out! Our team will get back to you within 24 hours.",
        "I can help with orders, returns, sizing, and product questions. What do you need?",
        "For order tracking, visit your Purchase History page. Need anything else?",
        "Free shipping over $75 and 30-day returns on all unworn items!",
        "Our AI Virtual Try-On is available for Premium members. Would you like to upgrade?",
      ];
      const botMsg: Message = {
        role: "bot",
        text: responses[Math.floor(Math.random() * responses.length)],
        time: Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);
      setTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-amber text-navy shadow-lg transition hover:scale-110 lg:bottom-6"
        aria-label="Chat support"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-36 right-4 z-40 flex h-[400px] w-[320px] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl lg:bottom-20"
          >
            {/* Header */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-navy to-navy-700 p-3 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber/20">
                <Bot className="h-4 w-4 text-amber" />
              </div>
              <div>
                <p className="text-sm font-bold">AceWears Support</p>
                <p className="text-[10px] text-white/60">Typically replies in minutes</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                    msg.role === "user" ? "bg-amber text-navy" : "bg-muted text-navy"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-2xl bg-muted px-3 py-3">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full border border-border bg-muted/30 px-3 py-2 text-xs outline-none focus:border-amber"
                />
                <button
                  onClick={sendMessage}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-amber text-navy"
                  aria-label="Send"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
