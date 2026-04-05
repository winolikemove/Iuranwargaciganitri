'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { api } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  CheckCircle,
  X,
  Link,
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    takenAt: '',
  });
  
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('File harus berupa gambar (JPG, PNG, WEBP)');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setUploadError('Ukuran file maksimal 2MB');
        return;
      }
      
      setSelectedFile(file);
      setUploadError(null);
      setUploadSuccess(false);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadError(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadError(null);
    
    try {
      let imageUrl = formData.imageUrl;
      
      // If using file upload, upload the file first
      if (uploadMethod === 'file' && selectedFile) {
        setIsUploadingFile(true);
        const uploadResult = await api.uploadFile(selectedFile);
        setIsUploadingFile(false);
        
        if (uploadResult.ok && uploadResult.data?.url) {
          imageUrl = uploadResult.data.url;
        } else {
          setUploadError(uploadResult.error || 'Gagal mengupload foto');
          setIsSubmitting(false);
          return;
        }
      }
      
      if (!imageUrl) {
        setUploadError('Foto wajib diupload');
        setIsSubmitting(false);
        return;
      }
      
      const result = await api.uploadGallery({
        title: formData.title,
        description: formData.description,
        imageUrl: imageUrl,
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
        setSelectedFile(null);
        setFilePreview(null);
        setUploadMethod('file');
        loadData();
      } else {
        setUploadError(result.error || 'Gagal menyimpan foto');
      }
    } catch (err) {
      setUploadError('Terjadi kesalahan');
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

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      takenAt: '',
    });
    setSelectedFile(null);
    setFilePreview(null);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadMethod('file');
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
          <Dialog open={showAddDialog} onOpenChange={(open) => {
            if (!open) handleCloseDialog();
            else setShowAddDialog(true);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Foto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Foto Baru</DialogTitle>
                <DialogDescription>Masukkan detail foto (maksimal 2MB)</DialogDescription>
              </DialogHeader>
              
              {uploadError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Judul</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Judul foto"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi singkat"
                  />
                </div>
                
                <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as 'file' | 'url')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </TabsTrigger>
                    <TabsTrigger value="url">
                      <Link className="h-4 w-4 mr-2" />
                      URL
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="file" className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {filePreview ? (
                      <div className="relative">
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={removeFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="font-medium">Klik untuk upload foto</p>
                        <p className="text-sm text-muted-foreground">JPG, PNG, WEBP (max 2MB)</p>
                      </div>
                    )}
                    
                    {selectedFile && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>{selectedFile.name}</span>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="url">
                    <div className="space-y-2">
                      <Label>URL Foto</Label>
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Masukkan URL gambar dari sumber eksternal
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="space-y-2">
                  <Label>Tanggal Diambil</Label>
                  <Input
                    type="date"
                    value={formData.takenAt}
                    onChange={(e) => setFormData({ ...formData, takenAt: e.target.value })}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting || isUploadingFile}>
                  {isSubmitting || isUploadingFile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isUploadingFile ? 'Mengupload...' : 'Menyimpan...'}
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
