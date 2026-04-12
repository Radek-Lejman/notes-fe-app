import { NavLink } from 'react-router-dom';
import { Text } from '@chakra-ui/react';
import { useRegister } from '../model/hooks/useRegister';
import { AuthLayout } from './AuthLayout/AuthLayout';
import { AuthBranding } from './AuthBranding/AuthBranding';
import { RegisterForm } from './RegisterForm/RegisterForm';
import { AppAlert } from '@shared/ui/AppAlert';

export const RegisterPageContainer = () => {
  const { submitRegistration, isLoading, error } = useRegister();

  return (
    <AuthLayout>
      <AuthBranding title="Create an account" description="to continue to your notes" />

      {error && <AppAlert status="error">{error}</AppAlert>}

      <RegisterForm onSubmit={submitRegistration} isLoading={isLoading} buttonText="Register" />

      <Text color="gray.600" _dark={{ color: 'gray.400' }} textAlign="center">
        Already have an account?{' '}
        <NavLink to="/login" style={{ color: '#319795', fontWeight: 'medium' }}>
          Sign In
        </NavLink>
      </Text>
    </AuthLayout>
  );
};
