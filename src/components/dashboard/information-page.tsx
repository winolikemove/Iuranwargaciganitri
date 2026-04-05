'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bell,
  Plus,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  Pin,
  PinOff,
  Calendar,
  Clock,
  User,
  Tag,
  Eye,
  X,
} from 'lucide-react';
import type { Information } from '@/types';

export function InformationPage() {
  const { user, permissions } = useAuth();
  const { settings } = useApp();
  
  const [informations, setInformations] = useState<Information[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<Information | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'UMUM',
    isPinned: false,
    targetBlok: 'ALL',
    expiredAt: '',
  });

  const [editFormData, setEditFormData] = useState({
    id: '',
    title: '',
    content: '',
    category: 'UMUM',
    isPinned: false,
    targetBlok: 'ALL',
    expiredAt: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      const res = await api.getInfo();
      if (res.ok && res.data) {
        setInformations(res.data);
      }
    } catch (err) {
      console.error('Failed to load information:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await api.createInfo({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        isPinned: formData.isPinned,
        targetBlok: formData.targetBlok,
        expiredAt: formData.expiredAt || undefined,
      });
      
      if (result.ok) {
        setShowAddDialog(false);
        setFormData({
          title: '',
          content: '',
          category: 'UMUM',
          isPinned: false,
          targetBlok: 'ALL',
          expiredAt: '',
        });
        loadData();
      }
    } catch (err) {
      console.error('Failed to create info:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await api.updateInfo(editFormData.id, {
        title: editFormData.title,
        content: editFormData.content,
        category: editFormData.category,
        isPinned: editFormData.isPinned,
        targetBlok: editFormData.targetBlok,
        expiredAt: editFormData.expiredAt || undefined,
      });
      
      if (result.ok) {
        setShowEditDialog(false);
        setSelectedInfo(null);
        loadData();
      }
    } catch (err) {
      console.error('Failed to update info:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      title: '',
      content: '',
      category: 'UMUM',
      isPinned: false,
      targetBlok: 'ALL',
      expiredAt: '',
    });
  };

  const openEditDialog = (info: Information) => {
    setEditFormData({
      id: info.id,
      title: info.title,
      content: info.content,
      category: info.category,
      isPinned: info.isPinned,
      targetBlok: info.targetBlok || 'ALL',
      expiredAt: info.expiredAt || '',
    });
    setShowEditDialog(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleTogglePin = async (id: string) => {
    const result = await api.togglePinInfo(id);
    if (result.ok) {
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus informasi ini?')) {
      const result = await api.deleteInfo(id);
      if (result.ok) {
        setSelectedInfo(null);
        loadData();
      }
    }
  };

  // Get categories based on user's blok
  const userBlok = user?.blok || 'A';
  const blokCategories = userBlok === 'A' ? settings?.categoriesA : settings?.categoriesB;
  const categories = blokCategories?.information || settings?.informationCategories || ['UMUM', 'Pengumuman', 'Kegiatan', 'Lainnya'];

  if (!settings?.enableInformation) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Fitur informasi tidak diaktifkan.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Informasi</h2>
          <p className="text-muted-foreground">Kelola pengumuman dan berita warga</p>
        </div>
        {permissions?.canCreateInformation && (
          <Dialog open={showAddDialog} onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) resetFormData();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Informasi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Informasi Baru</DialogTitle>
                <DialogDescription>Masukkan detail informasi</DialogDescription>
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
                  <Label>Isi</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Target</Label>
                    <Select
                      value={formData.targetBlok}
                      onValueChange={(value) => setFormData({ ...formData, targetBlok: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Semua Blok</SelectItem>
                        {settings?.bloks?.map((blok) => (
                          <SelectItem key={blok} value={blok}>Blok {blok}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Kadaluarsa (Opsional)</Label>
                  <Input
                    type="date"
                    value={formData.expiredAt}
                    onChange={(e) => setFormData({ ...formData, expiredAt: e.target.value })}
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
      ) : (
        <div className="space-y-4">
          {informations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Tidak ada informasi
              </CardContent>
            </Card>
          ) : (
            informations.map((info) => (
              <Card 
                key={info.id} 
                className={`${info.isPinned ? 'border-emerald-500' : ''} cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => setSelectedInfo(info)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{info.title}</CardTitle>
                        {info.isPinned && (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                            <Pin className="h-3 w-3 mr-1" />
                            Disematkan
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-2 mt-2 flex-wrap">
                        <Calendar className="h-3 w-3" />
                        {formatDate(info.publishedAt)}
                        <Badge variant="outline" className="text-xs">{info.category}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {info.targetBlok === 'ALL' ? 'Semua' : `Blok ${info.targetBlok}`}
                        </Badge>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {permissions?.canEditInformation && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTogglePin(info.id)}
                            title={info.isPinned ? 'Lepas sematkan' : 'Sematkan'}
                          >
                            {info.isPinned ? (
                              <PinOff className="h-4 w-4" />
                            ) : (
                              <Pin className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => openEditDialog(info)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {permissions?.canDeleteInformation && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDelete(info.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap line-clamp-3">{info.content}</p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto mt-2 text-emerald-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInfo(info);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Lihat selengkapnya
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Detail Information Modal */}
      <Dialog open={!!selectedInfo && !showEditDialog} onOpenChange={() => setSelectedInfo(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedInfo && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <DialogTitle className="text-xl">{selectedInfo.title}</DialogTitle>
                  {selectedInfo.isPinned && (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 shrink-0">
                      <Pin className="h-3 w-3 mr-1" />
                      Disematkan
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{selectedInfo.category}</Badge>
                  <Badge variant="outline">
                    {selectedInfo.targetBlok === 'ALL' ? 'Semua Blok' : `Blok ${selectedInfo.targetBlok}`}
                  </Badge>
                </div>
              </DialogHeader>
              
              {/* Meta Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4 border-y">
                {/* Published Date */}
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Dipublikasikan</p>
                    <p className="font-medium text-sm">{formatDate(selectedInfo.publishedAt)}</p>
                  </div>
                </div>
                
                {/* Author */}
                {selectedInfo.createdBy && (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Dibuat oleh</p>
                      <p className="font-medium text-sm">{selectedInfo.createdBy}</p>
                    </div>
                  </div>
                )}
                
                {/* Expiry Date */}
                {selectedInfo.expiredAt && (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Berlaku hingga</p>
                      <p className="font-medium text-sm">{formatDate(selectedInfo.expiredAt)}</p>
                    </div>
                  </div>
                )}
                
                {/* Category */}
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Tag className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Kategori</p>
                    <p className="font-medium text-sm">{selectedInfo.category}</p>
                  </div>
                </div>
                
                {/* Created At */}
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Ditambahkan</p>
                    <p className="font-medium text-sm">{formatDateTime(selectedInfo.createdAt)}</p>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="py-4">
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedInfo.content}</p>
                </div>
              </div>
              
              {/* Actions */}
              {permissions?.canEditInformation && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleTogglePin(selectedInfo.id);
                      setSelectedInfo(null);
                    }}
                  >
                    {selectedInfo.isPinned ? (
                      <>
                        <PinOff className="h-4 w-4 mr-2" />
                        Lepas Sematkan
                      </>
                    ) : (
                      <>
                        <Pin className="h-4 w-4 mr-2" />
                        Sematkan
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      openEditDialog(selectedInfo);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {permissions?.canDeleteInformation && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedInfo(null);
                        handleDelete(selectedInfo.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Information Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Informasi</DialogTitle>
            <DialogDescription>Ubah detail informasi</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Isi</Label>
              <Textarea
                value={editFormData.content}
                onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                rows={4}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={editFormData.category}
                  onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Target</Label>
                <Select
                  value={editFormData.targetBlok}
                  onValueChange={(value) => setEditFormData({ ...editFormData, targetBlok: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Blok</SelectItem>
                    {settings?.bloks?.map((blok) => (
                      <SelectItem key={blok} value={blok}>Blok {blok}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Kadaluarsa (Opsional)</Label>
              <Input
                type="date"
                value={editFormData.expiredAt}
                onChange={(e) => setEditFormData({ ...editFormData, expiredAt: e.target.value })}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPinned"
                checked={editFormData.isPinned}
                onChange={(e) => setEditFormData({ ...editFormData, isPinned: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isPinned" className="font-normal">Sematkan informasi ini</Label>
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowEditDialog(false)}
              >
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
