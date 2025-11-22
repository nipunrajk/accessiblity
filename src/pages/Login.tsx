import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
// @ts-ignore
import { STORAGE_KEYS } from '../constants';
import Button from '../components/common/Button.tsx';
import Input from '../components/common/Input.tsx';
import Label from '../components/common/Label.tsx';
import Badge from '../components/common/Badge.tsx';

// Icons - using simple SVG icons inline
const ZapIcon = () => (
  <svg
    className='h-6 w-6'
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M13 10V3L4 14h7v7l9-11h-7z'
    />
  </svg>
);

const EyeIcon = () => (
  <svg
    className='h-6 w-6'
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
    />
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
    />
  </svg>
);

const TrendingUpIcon = () => (
  <svg
    className='h-6 w-6'
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
    />
  </svg>
);

const CheckCircleIcon = () => (
  <svg
    className='h-6 w-6'
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    />
  </svg>
);

const ShieldIcon = () => (
  <svg
    className='h-4 w-4'
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
    />
  </svg>
);

const GithubIcon = () => (
  <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 24 24'>
    <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
  </svg>
);

const GoogleIcon = () => (
  <svg className='h-4 w-4' viewBox='0 0 24 24'>
    <path
      fill='#4285F4'
      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
    />
    <path
      fill='#34A853'
      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
    />
    <path
      fill='#FBBC05'
      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
    />
    <path
      fill='#EA4335'
      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
    />
  </svg>
);

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [localError, setLocalError] = useState('');

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const authError = useAuthStore((state) => state.error);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    setLocalError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError('');

    if (!formData.email || !formData.password) {
      setLocalError('All fields are required');
      return;
    }

    try {
      await login(formData);

      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key as string);
      });

      sessionStorage.setItem('freshLogin', 'true');
      navigate('/analyzer');
    } catch (error) {
      setLocalError(authError || 'Login failed. Please try again.');
    }
  };

  const displayError = localError || authError;

  const features = [
    {
      icon: EyeIcon,
      title: 'Accessibility Checker',
      description: 'WCAG 2.1 compliance analysis with automated fixes',
    },
    {
      icon: TrendingUpIcon,
      title: 'Performance Optimization',
      description: 'Core Web Vitals monitoring and improvement suggestions',
    },
    {
      icon: CheckCircleIcon,
      title: 'SEO Analysis',
      description: 'Search ranking insights and meta tag optimization',
    },
  ];

  return (
    <div className='flex min-h-screen bg-background'>
      {/* Left Panel - Features */}
      <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-accent/5 to-background p-12 flex-col justify-between'>
        <div>
          {/* Logo */}
          <div className='flex items-center gap-2 mb-12'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-primary'>
              <ZapIcon />
            </div>
            <span className='text-xl font-bold text-foreground'>FastFix</span>
          </div>

          {/* Main Content */}
          <div className='space-y-8 max-w-md'>
            <div>
              <h1 className='text-4xl font-bold text-foreground text-balance mb-4'>
                AI-Powered Website Optimization
              </h1>
              <p className='text-lg text-muted-foreground text-balance'>
                Diagnose, optimize, and fix your website's accessibility,
                performance, and search rankings automatically.
              </p>
            </div>

            {/* Features List */}
            <div className='space-y-4'>
              {features.map((feature) => (
                <div key={feature.title} className='flex gap-3 items-start'>
                  <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
                    <feature.icon />
                  </div>
                  <div>
                    <h3 className='font-semibold text-foreground mb-1'>
                      {feature.title}
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Badges */}
        <div className='flex items-center gap-6 text-sm text-muted-foreground'>
          <div className='flex items-center gap-2'>
            <ShieldIcon />
            <span>SOC 2 Certified</span>
          </div>
          <div className='flex items-center gap-2'>
            <CheckCircleIcon />
            <span>99.9% Uptime</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className='flex flex-1 items-center justify-center px-4 py-12'>
        <div className='w-full max-w-md'>
          {/* Mobile Logo */}
          <div className='lg:hidden mb-8 text-center'>
            <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary'>
              <ZapIcon />
            </div>
            <span className='text-xl font-bold text-foreground'>FastFix</span>
          </div>

          {/* Header */}
          <div className='mb-8'>
            <h2 className='text-3xl font-bold text-foreground mb-2'>
              Welcome back
            </h2>
            <p className='text-muted-foreground'>
              Enter your credentials to access your dashboard
            </p>
          </div>

          {/* Error Message */}
          {displayError && (
            <div className='mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm'>
              {displayError}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email address</Label>
              <Input
                id='email'
                type='email'
                placeholder='you@company.com'
                name='email'
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                className='h-11'
              />
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='password'>Password</Label>
                <a
                  href='/forgot-password'
                  className='text-sm text-primary hover:underline'
                  tabIndex={-1}
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id='password'
                type='password'
                name='password'
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                className='h-11'
              />
            </div>

            <Button type='submit' disabled={isLoading} className='w-full h-11'>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {/* Divider */}
          <div className='relative my-6'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-background px-2 text-muted-foreground'>
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className='grid grid-cols-2 gap-3'>
            <Button
              type='button'
              variant='outline'
              disabled={isLoading}
              className='h-11 bg-transparent'
            >
              <GithubIcon />
              GitHub
            </Button>
            <Button
              type='button'
              variant='outline'
              disabled={isLoading}
              className='h-11 bg-transparent'
            >
              <GoogleIcon />
              Google
            </Button>
          </div>

          {/* Sign Up Link */}
          <div className='mt-6 text-center text-sm text-muted-foreground'>
            Don't have an account?{' '}
            <a href='/' className='text-primary font-medium hover:underline'>
              Create account
            </a>
          </div>

          {/* Trusted By Section */}
          <div className='mt-8 pt-6 border-t'>
            <p className='text-xs text-muted-foreground text-center mb-3'>
              Trusted by over 10,000+ developers
            </p>
            <div className='flex justify-center items-center gap-6 opacity-50'>
              <Badge variant='outline' className='font-normal'>
                Vercel
              </Badge>
              <Badge variant='outline' className='font-normal'>
                GitHub
              </Badge>
              <Badge variant='outline' className='font-normal'>
                Linear
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
