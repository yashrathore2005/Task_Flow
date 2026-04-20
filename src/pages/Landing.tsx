import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
      <h1 className="text-4xl font-bold">TaskFlow - Your Second Brain</h1>
      <Link to="/auth">
        <Button>Get Started</Button>
      </Link>
    </div>
  );
}
