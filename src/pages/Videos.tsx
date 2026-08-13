import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Radio, PlayCircle } from 'lucide-react';
import ReactPlayer from 'react-player';

interface VideoItem {
  id: string;
  title: string;
  url: string;
  isLive: boolean;
}

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
          setVideos([]);
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
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  const featuredVideo = videos.length > 0 ? videos[0] : null;
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
          <div className="aspect-video w-full bg-gray-900 rounded-sm overflow-hidden border border-gray-800 relative">
            <ReactPlayer
              url={featuredVideo.url}
              width="100%"
              height="100%"
              controls
              playing={featuredVideo.isLive}
              config={{
                facebook: {
                  attributes: {
                    allowFullScreen: true
                  }
                }
              }}
              style={{ position: 'absolute', top: 0, left: 0 }}
            />
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
                <div className="aspect-video w-full bg-gray-900 rounded-sm overflow-hidden border border-gray-800 relative">
                  <ReactPlayer
                    url={video.url}
                    width="100%"
                    height="100%"
                    controls
                    config={{
                      facebook: {
                        attributes: {
                          allowFullScreen: true
                        }
                      }
                    }}
                    style={{ position: 'absolute', top: 0, left: 0 }}
                  />
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
      
      {videos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No videos available right now.</p>
        </div>
      )}
    </div>
  );
}
