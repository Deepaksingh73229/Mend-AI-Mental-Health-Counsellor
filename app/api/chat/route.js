import os from "os";
import { join } from "path";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';

import systemInstruction from "../../../data/systemInstruction";

const ai = new GoogleGenAI({});

const MAX_HISTORY_LENGTH = 10;
const KEEP_RECENT_MSGS = 4;

// Store chat sessions with their histories (sessionId -> history)
const chatSessions = new Map();

// Helper function to generate a summary
async function getSummary(oldMessages) {
    try {
        const summaryPrompt = "Summarize the following conversation history. Focus on the user's key problems, emotional state, and the advice given so far. Keep it concise.";

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                ...oldMessages,
                { 
                    role: 'user', 
                    parts: [{ text: summaryPrompt }] 
                }
            ],
        });
        return result.text;
    } 
    catch (error) {
        console.error("Summarization failed", error);
        return null;
    }
}

export async function POST(req) {
    try {
        const formData = await req.formData()
        const file = formData.get('file')
        let userQuery = formData.get('userQuery')
        const sessionId = formData.get('sessionId')

        if (!userQuery || !userQuery.trim()) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        const currentSessionId = sessionId || "default-session";

        // Get or create session history
        let History = chatSessions.get(currentSessionId) || [];
        // let History = [];

        if (file) {
            let docContent = ""
            let uploadPath = null

            console.log("File configured: ", typeof(file))

            // Convert file to buffer and save temporarily
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // os.tmpdir() works cross-platform and in serverless environments
            const tempDir = os.tmpdir()
            uploadPath = join(tempDir, file.name)

            // write file to temp storage
            await writeFile(uploadPath, buffer)

            const pdfloader = new PDFLoader(uploadPath)
            const rawDocs = await pdfloader.load()

            rawDocs.forEach((page) => {
                docContent += page.pageContent
            })

            if (uploadPath) {
                try {
                    await unlink(uploadPath);
                    console.log("Temporary file deleted");
                } 
                catch (error) {
                    console.error("Could not delete temp file:", error.message);
                }
            }

            userQuery = `
                        Based on the following document content:\n\n${docContent}\n\n
                        User Question: ${userQuery}\n\n
                        Provide a compassionate, therapeutic response that incorporates insights from the document while maintaining your role as a counselor.
                    `;

            // console.log("Using document context for enhanced response\n: ", userQuery);
        }

        History.push({
            role: 'user',
            parts: [{ text: userQuery }]
        });

        if (History.length > MAX_HISTORY_LENGTH) {
            const cutoffIndex = History.length - KEEP_RECENT_MSGS;
            const olderMessages = History.slice(0, cutoffIndex);
            const recentMessages = History.slice(cutoffIndex);

            const summaryText = await getSummary(olderMessages);

            if (summaryText) {
                History = [
                    {
                        role: 'user',
                        parts: [{ text: `[SYSTEM SUMMARY of previous conversation]: ${summaryText}` }]
                    },
                    ...recentMessages
                ];
            }
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: History,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json"
            }
        });

        History.push({
            role: 'model',
            parts: [{ text: response.text }]
        });

        chatSessions.set(currentSessionId, History);

        return NextResponse.json({
            chatbotResponse: response.text,
            sessionId: currentSessionId,
            debugHistoryLength: History.length
        });

    }
    catch (error) {
        console.error("Error in chat API:", error);

        return NextResponse.json(
            {
                error: "Failed to process request",
                details: error.message
            },
            { status: 500 }
        );
    }
}