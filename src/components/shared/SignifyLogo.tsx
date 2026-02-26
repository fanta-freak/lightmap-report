interface SignifyLogoProps {
  className?: string;
}

export function SignifyLogo({ className = 'h-8' }: SignifyLogoProps) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}images/signify-logo.svg`}
      alt="Signify"
      className={className}
    />
  );
}
