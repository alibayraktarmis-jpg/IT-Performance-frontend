import { render, screen } from '@testing-library/react';
import Login from './pages/Login';

test('renders login form', () => {
  render(<Login />);
  expect(screen.getByPlaceholderText(/ornek@sirket.com/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /giriş yap/i })).toBeInTheDocument();
});
