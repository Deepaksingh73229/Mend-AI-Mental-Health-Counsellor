"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertCircle,
  Lightbulb,
} from "lucide-react";

import suggestedPrompts from "@/data/suggestedPrompts"

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setMounted(true);
    // Generate unique session ID on mount
    setSessionId(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (text, file = null) => {
    if ((!text && !file) || isLoading) return;
    console.log("Text Input Message: ", text)
    console.log("File Input Message: ", file)

    const userMessage = {
      id: Date.now(),
      text: text.trim() || (file ? `📎 ${file.name}` : ""),
      sender: "user",
      timestamp: Date.now(),
      file: file ? {
        name: file.name,
        size: file.size,
        type: file.type
      } : null
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('userQuery', text)
    formData.append('sessionId', sessionId)

    if(file){
      formData.append('file', file);
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        console.log("failed to get response from backend!")
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      // console.log("Received data:", data);

      let structuredResponse;
      try {
        // Clean the response before parsing
        let cleanedResponse = data.chatbotResponse;

        if (typeof cleanedResponse === 'string') {
          // Remove control characters
          cleanedResponse = cleanedResponse
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .trim();

          // Remove markdown code blocks
          cleanedResponse = cleanedResponse
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();

          // console.log("Cleaned response:", cleanedResponse);
          structuredResponse = JSON.parse(cleanedResponse);
        } 
        else {
          structuredResponse = cleanedResponse;
        }
      } 
      catch (parseError) {
        // console.error("Error parsing JSON:", parseError);
        structuredResponse = {
          safety_alert: false,
          warm_opening: data.chatbotResponse,
          key_insights: [],
          guiding_question: "",
          suggested_replies: []
        };
      }

      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        timestamp: Date.now(),
        ...structuredResponse
      };

      setMessages((prev) => [...prev, botMessage]);
    } 
    catch (error) {
      console.error('Error sending message:', error);

      const errorMessage = {
        id: Date.now() + 1,
        text: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        sender: "bot",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt) => {
    handleSendMessage(prompt);
  };

  const handleSuggestedReplyClick = (reply) => {
    handleSendMessage(reply);
  };

  if (!mounted) return null;

  const isEmptyChat = messages.length === 0;

  return (
    <div className="flex flex-col">
      <div className="">
        {/* Empty State - Welcome Screen */}
        {isEmptyChat ? (
          <div className="flex items-center justify-center">
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-5">
              <div className="flex flex-col text-center gap-4">
                <h1 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-gray-100">
                  Hello, I'm here to listen
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                  Welcome to your safe space. Share what's on your mind — I'm here to support you without judgment.
                </p>
              </div>

              <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200 text-center">
                How can I help you today?
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestedPrompts.map((prompt, index) => {
                  const Icon = prompt.icon;
                  return (
                    <Card
                      key={index}
                      className="group p-6 cursor-pointer border border-gray-200 dark:border-gray-800 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-md transition-all duration-200 bg-white dark:bg-neutral-950"
                      onClick={() => handleSuggestedPrompt(prompt.prompt)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/30 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 flex items-center justify-center transition-colors">
                          <Icon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {prompt.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {prompt.subtitle}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Chat Interface - Scrollable area */
          <div className="max-w-5xl mx-auto py-6 space-y-2">
            {messages.map((message) => {
              // Check if this is a structured bot response (new format)
              const isStructured = message.sender === "bot" && message.warm_opening;

              // Get display text
              const displayText = isStructured
                ? message.warm_opening
                : message.text;

              return (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {/* Bot Avatar */}
                  {message.sender === "bot" && (
                    <Avatar className="w-8 h-8 shrink-0 mt-1">
                      <AvatarFallback className="bg-linear-to-br from-teal-500 to-emerald-500 text-white text-xs font-semibold">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Message Container */}
                  <div className={`max-w-[85%] space-y-3 ${message.sender === "user" ? "items-end flex flex-col" : "w-full"}`}>

                    {/* Safety Alert (Crisis Card) */}
                    {isStructured && message.safety_alert && (
                      <div className="w-full flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-2xl mb-3">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5 animate-pulse" />
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-red-800 dark:text-red-200 mb-1">
                            🚨 Immediate Help Available
                          </h4>
                          <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                            You are not alone. Please reach out to a professional immediately.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href="tel:18005990019"
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full font-semibold transition"
                            >
                              📞 Call Kiran: 1800-599-0019
                            </a>
                            <a
                              href="tel:9152987821"
                              className="text-xs bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 px-4 py-2 rounded-full font-semibold hover:bg-red-200 dark:hover:bg-red-900/70 transition"
                            >
                              AASRA: 9152987821
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Warm Opening (Main Message) */}
                    <div
                      className={`px-5 py-3 text-sm leading-relaxed shadow-sm ${message.sender === "user"
                        ? "bg-neutral-700 dark:bg-neutral-200 text-white dark:text-gray-900 rounded-3xl rounded-br-lg"
                        : "bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 rounded-3xl rounded-bl-lg border border-gray-100 dark:border-neutral-700"
                        }`}
                    >
                      {displayText}
                    </div>

                    {/* Key Insights Section */}
                    {isStructured && message.key_insights && message.key_insights.length > 0 && (
                      <div className="w-full bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <h4 className="text-sm font-semibold text-teal-800 dark:text-teal-200">
                            Key Insights
                          </h4>
                        </div>
                        <ul className="space-y-2">
                          {message.key_insights.map((insight, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-teal-900 dark:text-teal-100">
                              <span className="text-teal-600 dark:text-teal-400 mt-0.5">•</span>
                              <span className="flex-1">{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Guiding Question */}
                    {isStructured && message.guiding_question && (
                      <div className="w-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-4">
                        <p className="text-sm text-purple-900 dark:text-purple-100 italic">
                          💭 {message.guiding_question}
                        </p>
                      </div>
                    )}

                    {/* Suggested Replies (Quick Response Chips) */}
                    {isStructured && message.suggested_replies && message.suggested_replies.length > 0 && (
                      <div className="w-full flex flex-wrap gap-2">
                        {message.suggested_replies.map((reply, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestedReplyClick(reply)}
                            className="text-xs px-4 py-2 rounded-full bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/40 hover:border-teal-400 dark:hover:border-teal-600 transition-all font-medium"
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <span className="text-xs text-gray-400 dark:text-gray-500 px-2">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <Avatar className="w-8 h-8 shrink-0 mt-1">
                  <AvatarFallback className="bg-linear-to-br from-teal-500 to-emerald-500 text-white text-xs font-semibold">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 dark:bg-gray-900 px-5 py-3 rounded-3xl rounded-bl-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom padding for footer space */}
            <div className="h-40"></div>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Fixed Footer at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <Footer onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}