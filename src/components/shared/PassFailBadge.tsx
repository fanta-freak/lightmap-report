interface PassFailBadgeProps {
  passed: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PassFailBadge({ passed, size = 'md' }: PassFailBadgeProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-7 h-7 text-sm',
    lg: 'w-9 h-9 text-base',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        inline-flex items-center justify-center rounded-full
        font-bold transition-transform hover:scale-110
        ${passed
          ? 'bg-pass-green/15 text-pass-green'
          : 'bg-fail-red/15 text-fail-red'
        }
      `}
    >
      {passed ? (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-[70%] h-[70%]">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-[70%] h-[70%]">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      )}
    </div>
  );
}
