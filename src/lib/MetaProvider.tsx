import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

interface MetaTags {
  title: string;
  description: string;
  image: string;
  type?: string;
}

interface MetaContextType {
  setMeta: (tags: Partial<MetaTags>) => void;
}

const MetaContext = createContext<MetaContextType | null>(null);

const DEFAULT_META: MetaTags = {
  title: 'PLATNUMZ CUESPORT',
  description: 'The Ultimate Destination for Cuesport News and Live Scores',
  image: 'https://images.unsplash.com/photo-1593928131346-60786df7ac46?q=80&w=1200&h=630&fit=crop',
  type: 'website'
};

export function MetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMetaState] = useState<MetaTags>(DEFAULT_META);
  const location = useLocation();

  // Intercept route changes to reset meta tags to default unless overridden by the page
  useEffect(() => {
    setMetaState(DEFAULT_META);
  }, [location.pathname]);

  const setMeta = (tags: Partial<MetaTags>) => {
    setMetaState(prev => ({ ...prev, ...tags }));
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <MetaContext.Provider value={{ setMeta }}>
      <Helmet>
        <title>{meta.title === DEFAULT_META.title ? meta.title : `${meta.title} - ${DEFAULT_META.title}`}</title>
        <meta name="description" content={meta.description} />
        
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:image" content={meta.image} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:type" content={meta.type || 'website'} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
      </Helmet>
      {children}
    </MetaContext.Provider>
  );
}

export function useMetaTags(tags?: Partial<MetaTags>) {
  const context = useContext(MetaContext);
  if (!context) throw new Error('useMetaTags must be used within MetaProvider');
  
  useEffect(() => {
    if (tags && Object.keys(tags).length > 0) {
      context.setMeta(tags);
    }
  }, [tags?.title, tags?.description, tags?.image, tags?.type]);
  
  return context;
}
