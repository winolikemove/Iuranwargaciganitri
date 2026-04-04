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
} from 'lucide-react';
import type { Information } from '@/types';

export function InformationPage() {
  const { user, permissions } = useAuth();
  const { settings } = useApp();
  
  const [informations, setInformations] = useState<Information[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
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
        loadData();
      }
    }
  };

  const categories = settings?.informationCategories || ['UMUM', 'Pengumuman', 'Kegiatan', 'Lainnya'];

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
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
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
                        <SelectItem value="A">Blok A</SelectItem>
                        <SelectItem value="B">Blok B</SelectItem>
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
              <Card key={info.id} className={info.isPinned ? 'border-emerald-500' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle>{info.title}</CardTitle>
                        {info.isPinned && (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                            <Pin className="h-3 w-3 mr-1" />
                            Disematkan
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(info.publishedAt)}
                        <Badge variant="outline" className="text-xs">{info.category}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {info.targetBlok === 'ALL' ? 'Semua' : `Blok ${info.targetBlok}`}
                        </Badge>
                      </CardDescription>
                    </div>
                    {permissions?.canEditInformation && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleTogglePin(info.id)}
                        >
                          {info.isPinned ? (
                            <PinOff className="h-4 w-4" />
                          ) : (
                            <Pin className="h-4 w-4" />
                          )}
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
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
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{info.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
