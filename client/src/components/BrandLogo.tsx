type BrandLogoProps = {
  className?: string;
  alt?: string;
};

export default function BrandLogo({
  className = "h-12 w-auto",
  alt = "BRAC logo",
}: BrandLogoProps) {
  return <img src="/brac-logo.png" alt={alt} className={className} />;
}
