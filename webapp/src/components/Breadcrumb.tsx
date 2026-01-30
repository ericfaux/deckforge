import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export function Breadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Don't show breadcrumb on homepage
  if (pathSegments.length === 0) {
    return null;
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/', icon: <Home className="w-3 h-3" /> },
  ];

  // Build breadcrumb trail
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Format label (capitalize and replace hyphens)
    let label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Custom labels for specific routes
    if (segment === 'marketplace' && pathSegments[index + 1] === 'upload') {
      label = 'Marketplace';
    } else if (segment === 'upload' && pathSegments[index - 1] === 'marketplace') {
      label = 'Upload Design';
    } else if (segment === 'marketplace' && pathSegments[index + 1] === 'dashboard') {
      label = 'Marketplace';
    } else if (segment === 'dashboard' && pathSegments[index - 1] === 'marketplace') {
      label = 'Designer Dashboard';
    } else if (segment === 'marketplace' && pathSegments[index + 1] === 'design') {
      label = 'Marketplace';
    } else if (segment === 'design' && pathSegments[index - 1] === 'marketplace') {
      // This will be overridden if there's an ID after it
      label = 'Design';
    } else if (segment === 'fingerpark') {
      label = 'Park Builder';
    }

    // Skip IDs in breadcrumb display (UUIDs, etc.)
    const isId = segment.length > 20 || /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(segment);
    if (isId) {
      return;
    }

    breadcrumbs.push({
      label,
      href: index === pathSegments.length - 1 ? undefined : currentPath,
    });
  });

  return (
    <nav className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border text-xs">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
          {item.href ? (
            <Link
              to={item.href}
              className={cn(
                'flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors',
                'hover:underline'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 text-foreground font-medium">
              {item.icon}
              <span>{item.label}</span>
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
