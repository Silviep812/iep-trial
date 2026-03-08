import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function Auth() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        {/* Header — unchanged from original */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <img
              src="/lovable-uploads/e8e18250-fa27-4ae4-a4bc-867e063bcfd1.png"
              alt="IEP logo"
              className="h-8 w-8 object-contain"
            />
            <span className="text-xl font-bold text-primary">IEP</span>
          </div>
        </div>

        {/* Card — unchanged from original */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to IEP</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Supabase Auth UI — handles sign in, sign up, magic link & password reset */}
            <SupabaseAuth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'hsl(var(--primary))',
                      brandAccent: 'hsl(var(--primary))',
                      inputBackground: 'hsl(var(--background))',
                      inputText: 'hsl(var(--foreground))',
                      inputBorder: 'hsl(var(--border))',
                      inputBorderFocus: 'hsl(var(--ring))',
                      inputBorderHover: 'hsl(var(--border))',
                      inputPlaceholder: 'hsl(var(--muted-foreground))',
                      messageText: 'hsl(var(--foreground))',
                      messageBackground: 'hsl(var(--muted))',
                      anchorTextColor: 'hsl(var(--primary))',
                      dividerBackground: 'hsl(var(--border))',
                    },
                    space: {
                      buttonPadding: '10px 15px',
                      inputPadding: '10px 15px',
                    },
                    borderWidths: {
                      buttonBorderWidth: '1px',
                      inputBorderWidth: '1px',
                    },
                    radii: {
                      borderRadiusButton: '6px',
                      buttonBorderRadius: '6px',
                      inputBorderRadius: '6px',
                    },
                    fonts: {
                      bodyFontFamily: `inherit`,
                      buttonFontFamily: `inherit`,
                      inputFontFamily: `inherit`,
                      labelFontFamily: `inherit`,
                    },
                  },
                },
                style: {
                  button: {
                    fontWeight: '500',
                  },
                  label: {
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'hsl(var(--foreground))',
                  },
                  anchor: {
                    fontSize: '14px',
                  },
                  container: {
                    gap: '16px',
                  },
                },
              }}
              providers={[]}
              redirectTo={`${window.location.origin}/dashboard`}
              view="sign_in"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}