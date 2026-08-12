import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Radio, PlayCircle } from 'lucide-react';

interface VideoItem {
  id: string;
  title: string;
  url: string;
  isLive: boolean;
}

const getEmbedUrl = (url: string) => {
  if (!url) return '';
  try {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split('?')[0];
      else if (url.includes('v=')) videoId = new URL(url).searchParams.get('v') || '';
      else if (url.includes('/live/')) videoId = url.split('/live/')[1]?.split('?')[0];
      
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
    } else if (url.includes('facebook.com')) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=auto`;
    }
  } catch (e) {
    console.error(e);
  }
  return '';
};

export function Videos() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const docRef = doc(db, 'settings', 'videos');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().items) {
          setVideos(docSnap.data().items);
        } else {
          // Fallback to old featured video
          const oldRef = doc(db, 'settings', 'featured_video');
          const oldSnap = await getDoc(oldRef);
          if (oldSnap.exists() && oldSnap.data().url) {
            setVideos([{
              id: '1',
              title: 'Featured Video',
              url: oldSnap.data().url,
              isLive: oldSnap.data().isLive || false
            }]);
          }
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, []);

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center text-white">Loading videos...</div>;
  }

  if (videos.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Latest Videos</h1>
        <p className="text-gray-400">No videos available at the moment.</p>
      </div>
    );
  }

  const featuredVideo = videos[0];
  const otherVideos = videos.slice(1);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-black min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-8 border-b border-gray-800 pb-4">Latest Videos</h1>
      
      {/* Featured Video */}
      {featuredVideo && (
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            {featuredVideo.isLive ? (
              <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm flex items-center gap-1">
                <Radio size={12} className="animate-pulse" /> LIVE NOW
              </span>
            ) : (
              <span className="bg-[#eab308] text-black text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm flex items-center gap-1">
                <PlayCircle size={12} /> FEATURED
              </span>
            )}
            <h2 className="text-xl font-bold text-white ml-2">{featuredVideo.title}</h2>
          </div>
          <div className="aspect-video w-full bg-gray-900 rounded-sm overflow-hidden border border-gray-800">
            {getEmbedUrl(featuredVideo.url) ? (
              <iframe 
                src={getEmbedUrl(featuredVideo.url)} 
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen>
              </iframe>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Invalid Video URL
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid of Other Videos */}
      {otherVideos.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-300 mb-6 uppercase tracking-widest">More Videos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {otherVideos.map(video => (
              <div key={video.id} className="flex flex-col gap-3">
                <div className="aspect-video w-full bg-gray-900 rounded-sm overflow-hidden border border-gray-800">
                  {getEmbedUrl(video.url) ? (
                    <iframe 
                      src={getEmbedUrl(video.url)} 
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      allowFullScreen>
                    </iframe>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                      Invalid Video URL
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {video.isLive && (
                      <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                        LIVE
                      </span>
                    )}
                    <h4 className="text-white font-bold leading-tight">{video.title}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
