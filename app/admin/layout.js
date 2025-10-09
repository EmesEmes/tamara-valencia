import ProtectedRoute from '@/components/admin/ProtectedRoute';
import AdminNav from '@/components/admin/AdminNav';

export const metadata = {
  title: 'Admin - Tamara Valencia',
};

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <main className="pt-16">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}