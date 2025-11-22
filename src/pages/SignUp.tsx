import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { STORAGE_KEYS } from '../constants';
import '../styles/SignUp.css';

function SignUp() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [localError, setLocalError] = useState('');

  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
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
    if (!formData.username || !formData.email || !formData.password) {
      setLocalError('All fields are required');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }

    try {
      await register(formData);

      // Clear any previous analysis data when user logs in
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });

      // Set a flag to indicate fresh login
      sessionStorage.setItem('freshLogin', 'true');

      navigate('/analyzer');
    } catch (error) {
      setLocalError(authError || 'Registration failed. Please try again.');
    }
  };

  const displayError = localError || authError;

  return (
    <div className='signup-container'>
      <div className='signup-card'>
        <img src='../../public/logo.svg' alt='FastFix Logo' className='logo' />
        <h1>Join FastFix</h1>
        <p className='subtitle'>
          Already have an account? <a href='/login'>Sign in</a>
        </p>

        {displayError && <div className='error-message'>{displayError}</div>}

        <form onSubmit={handleSubmit} className='signup-form'>
          <div className='form-group'>
            <label htmlFor='username'>Username</label>
            <input
              type='text'
              id='username'
              name='username'
              value={formData.username}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

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
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignUp;
