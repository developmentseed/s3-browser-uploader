"use client";

export function ActionButton({
  onClick,
  disabled = false,
  loading = false,
  icon,
  children,
  variant = "default",
}: ActionButtonProps) {
  const baseClasses =
    "flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    default:
      "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500",
    danger:
      "text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 border border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-800 hover:border-red-400 dark:hover:border-red-500",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      <div className="w-3.5 h-3.5">
        {loading ? (
          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
        ) : (
          icon
        )}
      </div>
      {children}
    </button>
  );
} // Compact Action Button Component

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "danger";
}
