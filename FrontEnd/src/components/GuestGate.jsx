import { LogIn, UserPlus, MapPin } from "lucide-react";

export function GuestGate({ onLogin, onRegister, pageName = "this page" }) {
  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <MapPin className="w-8 h-8 text-[#22C55E]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in required</h2>
        <p className="text-sm text-gray-500 mb-7">
          You need an account to access {pageName}. Join the SmartEco community and help keep Cambodia clean!
        </p>
        <button
          onClick={onRegister}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#22C55E] text-white font-bold hover:bg-[#16A34A] transition-colors shadow-sm mb-3"
        >
          <UserPlus className="w-4 h-4" />
          Create an account
        </button>
        <button
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold hover:border-[#22C55E] hover:text-[#22C55E] transition-all"
        >
          <LogIn className="w-4 h-4" />
          I already have an account
        </button>
      </div>
    </div>
  );
}
