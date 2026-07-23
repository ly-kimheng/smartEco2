import React from "react";

export default function Avatar({ initials, size = "sm", className = "" }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg"
  };

  return (
    <div
      className={`rounded-full bg-[#16A34A] text-white font-bold flex items-center justify-center flex-shrink-0 shadow-sm ${sizeClasses[size] || sizeClasses.sm} ${className}`}
    >
      {initials}
    </div>
  );
}
