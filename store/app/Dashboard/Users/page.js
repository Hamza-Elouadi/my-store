import { cookies } from 'next/headers';
import { verifyToken } from '../../../lib/auth';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { redirect } from 'next/navigation';
import LogoutButton from '../../../components/LogoutButton';

async function getUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    redirect('/login');
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');

    const user = await users.findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } }
    );

    return user;
  } catch (error) {
    redirect('/login');
  }
}

export default async function Dashboard() {
  const user = await getUser();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              أهلاً وسهلاً، {user?.name}!
            </h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">البريد الإلكتروني: {user?.email}</p>
              <p className="text-sm text-gray-600">
                تاريخ التسجيل: {new Date(user?.createdAt).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}