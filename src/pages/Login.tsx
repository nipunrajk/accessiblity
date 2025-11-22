import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { STORAGE_KEYS } from '../constants';
import '../styles/SignUp.css';

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

    // Basic validation
    if (!formData.email || !formData.password) {
      setLocalError('All fields are required');
      return;
    }

    try {
      await login(formData);

      // Clear any previous analysis data when user logs in
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });

      // Set a flag to indicate fresh login
      sessionStorage.setItem('freshLogin', 'true');

      navigate('/analyzer');
    } catch (error) {
      setLocalError(authError || 'Login failed. Please try again.');
    }
  };

  const displayError = localError || authError;

  return (
    <div className='signup-container'>
      <div className='signup-card'>
        <img src='../../public/logo.svg' alt='FastFix Logo' className='logo' />
        <h1>Welcome Back</h1>
        <p className='subtitle'>
          Don't have an account? <a href='/'>Sign up</a>
        </p>

        {displayError && <div className='error-message'>{displayError}</div>}

        <form onSubmit={handleSubmit} className='signup-form'>
          <div className='form-group'>
            <label htmlFor='email'>Email address</label>
            <input
              type='email'
              id='email'
              name='email'
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className='form-group'>
            <label htmlFor='password'>Password</label>
            <div className='password-input-container'>
              <input
                type='password'
                id='password'
                name='password'
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <button type='submit' className='signup-button' disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
