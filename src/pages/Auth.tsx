import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';
import { auth } from '../firebase';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Github, Send } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isLinkSent, setIsLinkSent] = useState(false);
  
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthStore();

  useEffect(() => {
    // Check if user is redirected from email link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let emailForSignIn = window.localStorage.getItem('emailForSignIn');
      
      if (!emailForSignIn) {
        emailForSignIn = window.prompt('Please provide your email for confirmation');
      }

      if (emailForSignIn) {
        setLoading(true);
        signInWithEmailLink(auth, emailForSignIn, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
            toast.success('Successfully signed in with email link!');
            navigate('/dashboard');
          })
          .catch((error) => {
            console.error('Error signing in with email link:', error);
            toast.error(getFriendlyErrorMessage(error));
          })
          .finally(() => setLoading(false));
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const getFriendlyErrorMessage = (error: any) => {
    const code = error?.code || '';
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/email-already-in-use':
        return 'This email is already registered. Try logging in instead.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/popup-closed-by-user':
        return 'Login popup was closed. Please try again.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled in the Firebase Console.';
      case 'auth/unauthorized-continue-uri':
        return 'The domain is not whitelisted in Firebase. Please add this URL to authorized domains.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  };

  const handleEmailLink = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const actionCodeSettings = {
        url: window.location.origin + '/auth',
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setIsLinkSent(true);
      toast.success('Sign-in link sent! Please check your email.');
    } catch (error: any) {
      console.error('Error sending email link:', error);
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (isLogin: boolean) => {
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
        toast.success('Account created successfully!');
      }
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Force account selection to fix some persistence issues in some environments
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      toast.success('Successfully logged in with Google');
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Google Auth error:", error);
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setResetLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md border-none shadow-2xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-2xl shadow-xl transform rotate-3">
              TF
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight">TaskFlow</CardTitle>
          <CardDescription className="text-base font-medium">
            Elevate your productivity today
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="login" className="font-bold">Login</TabsTrigger>
              <TabsTrigger value="register" className="font-bold">Register</TabsTrigger>
              <TabsTrigger value="magic" className="font-bold">Magic Link</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleAuth(true); }}
                className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="space-y-2">
                  <Label htmlFor="email-login">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email-login"
                      type="email" 
                      placeholder="name@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password-login">Password</Label>
                    <button 
                      type="button"
                      onClick={handleResetPassword}
                      disabled={resetLoading}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      {resetLoading ? 'Sending...' : 'Forgot password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password-login"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit"
                  className="w-full h-11 font-bold text-base shadow-lg" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign In
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleAuth(false); }}
                className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="space-y-2">
                  <Label htmlFor="name-reg">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="name-reg"
                      placeholder="John Doe" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-reg">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email-reg"
                      type="email" 
                      placeholder="name@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-reg">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password-reg"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">At least 6 characters</p>
                </div>
                <Button 
                  type="submit"
                  className="w-full h-11 font-bold text-base shadow-lg" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Account
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="magic" className="space-y-4">
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="email-magic">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email-magic"
                      type="email" 
                      placeholder="name@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                {isLinkSent ? (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-700 font-medium text-center">
                    Check your inbox! We've sent a magic link to <strong>{email}</strong>. Click the link in the email to sign in instantly.
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground font-medium text-center px-4">
                    We'll send a login link to your inbox. No password required!
                  </div>
                )}

                <Button 
                  onClick={handleEmailLink}
                  className="w-full h-11 font-bold text-base shadow-lg" 
                  disabled={loading || isLinkSent}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {isLinkSent ? 'Link Sent' : 'Send Magic Link'}
                </Button>

                {isLinkSent && (
                  <button onClick={() => setIsLinkSent(false)} className="w-full text-xs font-bold text-primary hover:underline">
                    Use a different email
                  </button>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase font-bold">
              <span className="bg-muted/30 px-3 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button variant="outline" className="w-full h-11 font-bold" onClick={handleGoogle} disabled={loading}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-center border-t py-4">
          <p className="text-xs text-muted-foreground font-medium">
            By continuing, you agree to our Terms of Service.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

