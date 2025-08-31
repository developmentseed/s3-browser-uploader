"use client";

interface HeaderProps {
  username?: string;
  onSignOut?: () => void;
}

export function Header({ username, onSignOut }: HeaderProps) {
  return (
    <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-geist text-xl font-semibold text-gray-900 dark:text-white">
              S3 Browser Upload
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {username && (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome, {username}
                </span>
                <button
                  onClick={onSignOut}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
