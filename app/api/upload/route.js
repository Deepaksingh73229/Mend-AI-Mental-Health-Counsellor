// import * as dotenv from 'dotenv';
import { NextResponse } from 'next/server';
// import pdf from 'pdf-parse'
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import os from "os";
import { Document } from '@langchain/core/documents'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
// load the pdf file
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { OpenAIEmbeddings } from "@langchain/openai";
// import langchain embedding model
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';

// dotenv.config();

export async function POST(req) {
    console.log("Indexing Backend")
    let uploadPath = null;  // ✅ Declare at top so it's accessible in catch block

    try {
        const formData = await req.formData();
        // console.log("formData: ", formData)
        const file = formData.get('file');
        const sessionId = formData.get('sessionId');

        if (!file) {
            return NextResponse.json(
                { error: "File is required" },
                { status: 400 }
            );
        }

        console.log("Processing document:", file.name);
        console.log("Session ID:", sessionId);


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

        console.log("File saved to: ", uploadPath)
        // console.log("RawDocs: ", rawDocs)

        rawDocs.forEach((page) => {
            console.log("Doc content: \n", page.pageContent)
        })

        // Chunking
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200
        });

        const chunkedDocs = await textSplitter.splitDocuments(rawDocs);

        console.log("Chunking completed, chunks:", chunkedDocs);

        // vector embedding model
        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GEMINI_API_KEY,
            model: 'text-embedding-004',
        });

        console.log("Embedding model configured");

        // Initialize Pinecone client
        const pinecone = new Pinecone();
        const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

        console.log("Pinecone configured");

        // Store in Pinecone with metadata
        await PineconeStore.fromDocuments(chunkedDocs, embeddings, {
            pineconeIndex,
            maxConcurrency: 5,
        });

        console.log("Data stored successfully in Pinecone");

        // After Pinecone storage succeeds
        if (uploadPath) {
            try {
                await unlink(uploadPath);
                console.log("✅ Temporary file deleted");
            } catch (unlinkError) {
                console.error("⚠️ Could not delete temp file:", unlinkError.message);
            }
        }

        return NextResponse.json({
            message: "Document indexed successfully",
            rawDocs: rawDocs,
            chunks: chunkedDocs.length,
            sessionId: sessionId,
            fileName: file.name
        });

    } catch (error) {
        console.error("Error processing document:", error);

        // Cleanup temp file even if processing failed
        if (uploadPath) {
            try {
                await unlink(uploadPath);
                console.log("🧹 Cleanup: Temporary file deleted");
            } catch (unlinkError) {
                console.error("⚠️ Cleanup failed:", unlinkError.message);
            }
        }

        return NextResponse.json(
            {
                error: "Failed to index document",
                details: error.message
            },
            { status: 500 }
        );
    }
}