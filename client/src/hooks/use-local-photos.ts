import { useState, useEffect } from "react";

export interface LocalPhoto {
  id: string;
  propertyId: number;
  url: string;
  isCover: boolean;
}

const STORAGE_KEY = "estateflow_photos";

export function useLocalPhotos(propertyId: number) {
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allPhotos: LocalPhoto[] = stored ? JSON.parse(stored) : [];
    const propertyPhotos = allPhotos.filter(p => p.propertyId === propertyId);
    setPhotos(propertyPhotos);
    setIsLoading(false);
  }, [propertyId]);

  const addPhoto = (url: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allPhotos: LocalPhoto[] = stored ? JSON.parse(stored) : [];
    
    const newPhoto: LocalPhoto = {
      id: `${propertyId}_${Date.now()}_${Math.random()}`,
      propertyId,
      url,
      isCover: false,
    };
    
    allPhotos.push(newPhoto);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allPhotos));
    
    setPhotos(prev => [...prev, newPhoto]);
    return newPhoto;
  };

  const deletePhoto = (photoId: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allPhotos: LocalPhoto[] = stored ? JSON.parse(stored) : [];
    
    const filtered = allPhotos.filter(p => p.id !== photoId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const setCoverPhoto = (photoId: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allPhotos: LocalPhoto[] = stored ? JSON.parse(stored) : [];
    
    allPhotos.forEach(p => {
      if (p.propertyId === propertyId) {
        p.isCover = p.id === photoId;
      }
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allPhotos));
    
    setPhotos(prev =>
      prev.map(p => ({
        ...p,
        isCover: p.id === photoId,
      }))
    );
  };

  return {
    photos,
    isLoading,
    addPhoto,
    deletePhoto,
    setCoverPhoto,
  };
}
