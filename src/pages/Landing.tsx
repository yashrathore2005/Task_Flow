import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(37,99,235,0.1),transparent)] pointer-events-none" />
      <div className="w-20 h-20 rounded-[2rem] bg-blue-600 flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-blue-200 mb-8 transform rotate-3">
        TF
      </div>
      <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-foreground mb-4 text-center">
        TaskFlow
      </h1>
      <p className="text-lg sm:text-xl text-muted-foreground font-medium mb-12 text-center max-w-md">
        Your high-performance second brain. Master your tasks, habits, and focus in one polished workspace.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <Link to="/auth" className="flex-1">
          <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 dark:shadow-none transition-all active:scale-95">
            Open Workspace
          </Button>
        </Link>
        <a href="https://github.com" target="_blank" className="flex-1">
          <Button variant="outline" className="w-full h-14 rounded-2xl border-border font-black uppercase tracking-widest text-xs transition-all active:scale-95">
            GitHub
          </Button>
        </a>
      </div>
      <div className="mt-16 flex items-center gap-8 grayscale opacity-30">
        <span className="font-black text-xs uppercase tracking-widest">Fast</span>
        <span className="font-black text-xs uppercase tracking-widest">Secure</span>
        <span className="font-black text-xs uppercase tracking-widest">Polished</span>
      </div>
    </div>
  );
}
