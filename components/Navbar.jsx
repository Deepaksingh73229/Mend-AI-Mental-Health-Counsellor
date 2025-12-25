"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  User
} from "lucide-react";

import logo from "@/app/icon0.svg"

export default function Navbar() {


  return (
    <>
      {/* Main Navbar */}
      <nav className="sticky top-0 z-50 border-b border-black/20 dark:border-gray-800 bg-white/10 dark:bg-neutral-950/50 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2">
              <div className="">
                <img
                src={logo.src}
                alt="logo"
                className="w-11 aspect-square rounded-full"
                />
              </div>

              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold bg-linear-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  Mend
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
                  AI Counselling Assistant
                </p>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              
              {/* Status Badge */}
              <div className="hidden sm:block">
                <Badge
                  variant="secondary"
                  className="gap-1.5 rounded-full px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-medium">Always Available</span>
                </Badge>
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Avatar */}
              <Button
                variant="ghost"
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}