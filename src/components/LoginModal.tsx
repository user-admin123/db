import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  onLogin: (email: string, password: string) => boolean;
}

const LoginModal = ({ onLogin }: Props) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(email, password);
    if (success) {
      setOpen(false);
      setEmail("");
      setPassword("");
      toast({ title: "Welcome back!", description: "You're now logged in as owner." });
    } else {
      toast({ title: "Login failed", description: "Invalid email or password.", variant: "destructive" });
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-40 w-10 h-10 rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
        aria-label="Owner login"
      >
        <LogIn className="w-4 h-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card border-border/30 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Owner Login</DialogTitle>
            <DialogDescription>Sign in to manage your menu.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@restaurant.com" required className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required className="bg-muted/50" />
            </div>
            <Button type="submit" className="w-full">Sign In</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginModal;
