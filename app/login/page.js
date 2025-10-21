import LoginForm from '@/components/admin/LoginForm';

export const metadata = {
  title: 'Acceso Administrador - Tamara Valencia Joyas',
  description: 'Panel de administración Tamara Valencia Joyas',
  robots: 'noindex, nofollow',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#FFF2E0]/20 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="font-elegant text-4xl font-light text-gray-900 mb-2">
            Tamara Valencia
          </h1>
          <p className="text-gray-600 font-light">Panel de Administración</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
}