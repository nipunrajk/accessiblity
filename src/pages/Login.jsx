import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS } from '../constants';
import '../styles/SignUp.css';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    // Clear any previous analysis data when user logs in
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });

    // Set a flag to indicate fresh login
    sessionStorage.setItem('freshLogin', 'true');

    // Here you would typically make an API call to authenticate the user
    navigate('/analyzer');
  };

  return (
    <div className='signup-container'>
      <div className='signup-card'>
        <img src='../../public/logo.svg' alt='FastFix Logo' className='logo' />
        <h1>Welcome Back</h1>
        <p className='subtitle'>
          Don't have an account? <a href='/'>Sign up</a>
        </p>

        {error && <div className='error-message'>{error}</div>}

        <form onSubmit={handleSubmit} className='signup-form'>
          <div className='form-group'>
            <label htmlFor='email'>Email address</label>
            <input
              type='email'
              id='email'
              name='email'
              value={formData.email}
              onChange={handleChange}
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
              />
            </div>
          </div>

          <button type='submit' className='signup-button'>
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
