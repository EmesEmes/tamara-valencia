import FactorForm from '@/components/admin/FactorForm';

export const metadata = {
  title: 'Nuevo Factor - Admin',
};

export default function NuevoFactorPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="font-elegant text-4xl font-light text-gray-900 mb-8">
        Nuevo Factor de Precio
      </h1>
      <div className="bg-white rounded-lg shadow-sm p-8">
        <FactorForm />
      </div>
    </div>
  );
}