'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { api } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Image as ImageIcon,
  Plus,
  Loader2,
  AlertCircle,
  Trash2,
  Upload,
} from 'lucide-react';
import type { Gallery } from '@/types';

export function GalleryPage() {
  const { user, permissions } = useAuth();
  const { settings } = useApp();
  
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Gallery | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    takenAt: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      const res = await api.getGallery();
      if (res.ok && res.data) {
        setGalleries(res.data);
      }
    } catch (err) {
      console.error('Failed to load gallery:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await api.uploadGallery({
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl,
        takenAt: formData.takenAt || undefined,
      });
      
      if (result.ok) {
        setShowAddDialog(false);
        setFormData({
          title: '',
          description: '',
          imageUrl: '',
          takenAt: '',
        });
        loadData();
      }
    } catch (err) {
      console.error('Failed to upload gallery:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus foto ini?')) {
      const result = await api.deleteGallery(id);
      if (result.ok) {
        loadData();
      }
    }
  };

  if (!settings?.enableGallery) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Fitur galeri tidak diaktifkan.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Galeri</h2>
          <p className="text-muted-foreground">Dokumentasi kegiatan warga</p>
        </div>
        {permissions?.canUploadGallery && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Foto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Foto Baru</DialogTitle>
                <DialogDescription>Masukkan detail foto</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Judul</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>URL Foto</Label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Tanggal Diambil</Label>
                  <Input
                    type="date"
                    value={formData.takenAt}
                    onChange={(e) => setFormData({ ...formData, takenAt: e.target.value })}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : galleries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Tidak ada foto di galeri
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {galleries.map((gallery) => (
            <Card
              key={gallery.id}
              className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedImage(gallery)}
            >
              <div className="aspect-square relative">
                <img
                  src={gallery.thumbnailUrl || gallery.imageUrl}
                  alt={gallery.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                {permissions?.canDeleteGallery && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(gallery.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <CardContent className="p-3">
                <p className="font-medium truncate">{gallery.title}</p>
                {gallery.description && (
                  <p className="text-xs text-muted-foreground truncate">{gallery.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedImage.title}</DialogTitle>
                {selectedImage.description && (
                  <DialogDescription>{selectedImage.description}</DialogDescription>
                )}
              </DialogHeader>
              <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.title}
                  className="w-full h-full object-contain"
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
