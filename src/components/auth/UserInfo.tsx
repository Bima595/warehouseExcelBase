import { getAuthUser } from '@/lib/auth';
import LogoutButton from './LogoutButton';

export default async function UserInfo() {
  const user = await getAuthUser();

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 relative z-10">
      <div className="text-sm">
        <p className="font-medium text-black dark:text-zinc-50">
          {user.username}
        </p>
        <p className="text-zinc-600 dark:text-zinc-400">{user.email}</p>
      </div>
      <LogoutButton />
    </div>
  );
}


