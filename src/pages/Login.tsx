import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Eye, EyeOff } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { useAuthStore } from "@/lib/authStore";
import { useToast } from "@/components/ui/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, register } = useAuthStore();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration Forms
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  
  // Shared Forms
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegistering) {
      if (!name || !username || !email || !password) {
        toast({ title: "Validation Error", description: "Please fill all fields.", variant: "destructive" });
        return;
      }
      
      const { success, message } = register({ name, username, email, password });
      
      if (success) {
        toast({ title: "Registration Successful", description: "You can now log in with your credentials." });
        setIsRegistering(false); // Switch back to login
      } else {
        toast({ title: "Registration Failed", description: message, variant: "destructive" });
      }
    } else {
      if (!email || !password) {
        toast({ title: "Validation Error", description: "Please enter your email and password.", variant: "destructive" });
        return;
      }
      
      const { success, message } = login(email, password);
      
      if (success) {
         toast({ title: "Welcome back", description: "Successfully logged in." });
         navigate("/dashboard");
      } else {
         toast({ title: "Access Denied", description: message, variant: "destructive" });
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <motion.div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <Brain className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="text-title gradient-text">AI Dementia Guardian</h1>
          <p className="mt-1 text-caption text-muted-foreground">Protecting memories, ensuring safety</p>
        </div>

        <GlassCard>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <AnimatePresence mode="popLayout">
              {isRegistering && (
                <motion.div 
                   key="register-fields"
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   className="space-y-4"
                >
                  <div>
                    <label className="mb-1.5 block text-caption font-medium text-foreground">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-body outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-caption font-medium text-foreground">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="janedoe99"
                      className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-body outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="mb-1.5 block text-caption font-medium text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="caregiver@example.com"
                className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-body outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-caption font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 pr-12 text-body outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-primary py-3 text-body font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
            >
              {isRegistering ? "Register Account" : "Sign In"}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button 
              type="button" 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-caption text-primary hover:underline"
            >
              {isRegistering ? "Already have an account? Sign In" : "Don't have an account? Register"}
            </button>
          </div>
        </GlassCard>

        <p className="mt-4 text-center text-[12px] text-muted-foreground">
          {isRegistering ? "Your data is encrypted and securely stored locally" : "Secure access for authorized caregivers only"}
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
