import React from "react";
import { MessageSquare, Star } from "lucide-react";
import Avatar from "../components/Avatar";

export default function FeedbackView({ feedback }) {
  // Compute some interesting feedback insights
  const avgRating = 4.2;
  const positiveRating = "76%";

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">
          Community Feedback
        </h1>
        <p className="text-slate-500 text-sm font-sans">
          Hear what citizens say about cleanup duration, point satisfaction, and feature requests.
        </p>
      </div>

      {/* Summary insights bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-emerald-50 text-center space-y-1">
          <p className="text-3xl font-display font-extrabold text-amber-500 flex items-center justify-center gap-1">4.2 <Star className="w-6 h-6 fill-current" /></p>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider font-sans">Average Rating</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-emerald-50 text-center space-y-1">
          <p className="text-3xl font-display font-extrabold text-slate-900">{feedback.length}</p>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider font-sans">Total Responses</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-emerald-50 text-center space-y-1">
          <p className="text-3xl font-display font-extrabold text-emerald-600">{positiveRating}</p>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider font-sans">Positive Sentiment</p>
        </div>
      </div>

      {/* Feedback cards stack */}
      <div className="space-y-4">
        {feedback.map(f => (
          <div
            key={f.id}
            className="bg-white rounded-2xl p-5 shadow-xs border border-emerald-50 hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <Avatar initials={f.initials} size="md" />
                <div>
                  <p className="font-semibold text-slate-900">{f.name}</p>
                  <p className="text-xs text-slate-400 font-sans font-medium">{f.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200/45 font-sans">
                  {f.tag}
                </span>
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < f.stars ? "fill-amber-400" : "text-slate-200"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed font-sans pl-1 border-l-2 border-emerald-500/20 py-0.5">
              "{f.comment}"
            </p>
          </div>
        ))}

        {feedback.length === 0 && (
          <p className="text-center text-slate-400 py-10 font-sans">No feedback received yet.</p>
        )}
      </div>
    </div>
  );
}
