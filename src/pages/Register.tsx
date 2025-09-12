import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { RegisterForm } from '../components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <AuthLayout 
      title="Create your account" 
      subtitle="Join Gen.C Alpha and start creating amazing content"
    >
      <RegisterForm />
    </AuthLayout>
  );
}