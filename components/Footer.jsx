"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, SendHorizontal, Shield, Loader2, FileText, X } from "lucide-react";

export default function Footer({ onSendMessage, isLoading }) {
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const [value, setValue] = useState("");
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // Reset textarea height when loading completes
    useEffect(() => {
        if (!isLoading && textareaRef.current) {
            textareaRef.current.style.height = "28px";
        }
    }, [isLoading]);

    // Logic to auto-resize the textarea based on content
    const handleInput = (e) => {
        const target = e.target;
        setValue(target.value);

        // Reset height to auto to get the correct scrollHeight for shrinking
        target.style.height = "auto";
        // Set height to scrollHeight to expand
        target.style.height = `${target.scrollHeight}px`;
    };

    const handleSend = async () => {
        if ((value.trim() || uploadedFile) && onSendMessage && !isLoading) {
            await onSendMessage(value.trim(), uploadedFile);
            setValue("");
            setUploadedFile(null);
            if (textareaRef.current) {
                textareaRef.current.style.height = "28px";
            }
        }
    };

    const handleKeyDown = (e) => {
        // Send on Enter, new line on Shift+Enter
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Handle file upload
    const handleFileSelect = (file) => {
        if (file && file.type === "application/pdf") {
            setUploadedFile(file);
        } else {
            alert("Please upload a PDF file only");
        }
    };

    // Handle plus button click
    const handlePlusClick = () => {
        fileInputRef.current?.click();
    };

    // Handle file input change
    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    // Handle drag and drop
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    // Remove uploaded file
    const handleRemoveFile = () => {
        setUploadedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="w-full py-2 bg-gray-50/5 dark:bg-neutral-950/5 backdrop-blur-xs shadow-neutral-900">
            <div 
                className={`flex flex-col max-w-4xl mx-auto border ${
                    isDragging 
                        ? "border-teal-400 dark:border-teal-500 border-2" 
                        : "border-gray-200 dark:border-neutral-700"
                } shadow-lg rounded-2xl bg-white dark:bg-neutral-900 transition-colors`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Drag overlay */}
                {isDragging && (
                    <div className="absolute inset-0 bg-teal-50/90 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center z-10 pointer-events-none">
                        <div className="text-center">
                            <FileText className="w-12 h-12 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
                                Drop your PDF here
                            </p>
                        </div>
                    </div>
                )}

                {/* File preview */}
                {uploadedFile && (
                    <div className="px-6 pt-4 pb-2">
                        <div className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl">
                            <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-teal-900 dark:text-teal-100 truncate">
                                    {uploadedFile.name}
                                </p>
                                <p className="text-xs text-teal-600 dark:text-teal-400">
                                    {(uploadedFile.size / 1024).toFixed(2)} KB
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleRemoveFile}
                                className="h-7 w-7 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                <div className="px-6 pt-5 pb-2">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        placeholder="Share what's on your mind..."
                        value={value}
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        className="w-full resize-none text-lg text-gray-800 dark:text-gray-300 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none max-h-[300px] overflow-y-auto bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ minHeight: "28px" }}
                    />
                </div>

                <div className="flex justify-between items-center px-4 pb-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePlusClick}
                        className="h-9 w-9 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        disabled={isLoading}
                    >
                        <Plus className="w-5 h-5" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSend}
                        disabled={(!value.trim() && !uploadedFile) || isLoading}
                        className="h-9 w-9 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <SendHorizontal className="w-5 h-5" />
                        )}
                    </Button>
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                />
            </div>

            <div className="my-3 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Shield className="w-4 h-4" />
                <span>Your conversations are private and confidential</span>
            </div>
        </div>
    );
}