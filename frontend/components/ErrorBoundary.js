"use client";
import { Component } from "react";
import { toast } from "sonner";

export default class ErrorBoundary extends Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
    toast.error("Something went wrong. Please try again.");
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          <h3>Something went wrong</h3>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Try Again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}