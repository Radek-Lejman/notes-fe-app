import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@shared/lib/test/render';
import { LoginForm } from './LoginForm/LoginForm';
import { RegisterForm } from './RegisterForm/RegisterForm';

const forms = [
  ['LoginForm', LoginForm, 'Login', 'current-password'],
  ['RegisterForm', RegisterForm, 'Register', 'new-password'],
] as const;

/** The eye button next to the password has no label (see audit finding D7). */
const passwordToggle = () =>
  screen.getAllByRole('button').find((button) => button.getAttribute('type') !== 'submit')!;

describe.each(forms)('%s', (_, Form, buttonText, autoComplete) => {
  it('submits the typed credentials', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<Form onSubmit={onSubmit} isLoading={false} />);

    await userEvent.type(screen.getByPlaceholderText('Enter your email'), 'ada@example.com');
    await userEvent.type(screen.getByLabelText(/Password/), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: buttonText }));

    expect(onSubmit).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'secret123' });
  });

  it('requires both fields', () => {
    renderWithProviders(<Form onSubmit={vi.fn()} isLoading={false} />);

    expect(screen.getByPlaceholderText('Enter your email')).toBeRequired();
    expect(screen.getByLabelText(/Password/)).toBeRequired();
  });

  it('lets the browser fill the password', () => {
    renderWithProviders(<Form onSubmit={vi.fn()} isLoading={false} />);

    expect(screen.getByLabelText(/Password/)).toHaveAttribute('autocomplete', autoComplete);
  });

  it('shows and hides the password without submitting the form', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<Form onSubmit={onSubmit} isLoading={false} />);
    const password = screen.getByLabelText(/Password/);
    expect(password).toHaveAttribute('type', 'password');

    await userEvent.click(passwordToggle());
    expect(password).toHaveAttribute('type', 'text');

    await userEvent.click(passwordToggle());
    expect(password).toHaveAttribute('type', 'password');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('blocks a second submit while loading', () => {
    renderWithProviders(<Form onSubmit={vi.fn()} isLoading />);

    const submit = screen
      .getAllByRole('button')
      .find((button) => button.getAttribute('type') === 'submit');
    expect(submit).toBeDisabled();
    expect(submit).not.toHaveTextContent(buttonText);
  });

  it('uses a custom button text', () => {
    renderWithProviders(<Form onSubmit={vi.fn()} isLoading={false} buttonText="Continue" />);

    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });
});
