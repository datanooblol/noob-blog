import Link from 'next/link';

interface FeatureCardProps {
  title: string;
  description: string;
  href: string;
  linkText: string;
}

export default function FeatureCard({ title, description, href, linkText }: FeatureCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <Link href={href} className="text-black hover:text-gray-700">
        {linkText} →
      </Link>
    </div>
  );
}