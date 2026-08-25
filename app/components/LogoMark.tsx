type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className = "" }: LogoMarkProps) {
  return (
    <span className={`pdf-mark ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 40 40" width="40" height="40">
        <rect width="40" height="13.3" fill="#FECB00" />
        <rect y="13.3" width="40" height="13.4" fill="#34B233" />
        <rect y="26.7" width="40" height="13.3" fill="#EA2839" />
        <polygon
          points="20,11 22.4,18.2 30,18.2 23.8,22.6 26.2,30 20,25.4 13.8,30 16.2,22.6 10,18.2 17.6,18.2"
          fill="#fff"
        />
      </svg>
    </span>
  );
}
