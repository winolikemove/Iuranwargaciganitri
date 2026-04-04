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
  Calendar,
  Plus,
  MapPin,
  Clock,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import type { Agenda } from '@/types';

export function AgendaPage() {
  const { user, permissions } = useAuth();
  const { settings } = useApp();
  
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    targetBlok: 'ALL',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      const res = await api.getAgenda();
      if (res.ok && res.data) {
        setAgendas(res.data);
      }
    } catch (err) {
      console.error('Failed to load agendas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await api.createAgenda({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        targetBlok: formData.targetBlok,
      });
      
      if (result.ok) {
        setShowAddDialog(false);
        setFormData({
          title: '',
          description: '',
          location: '',
          startDate: '',
          endDate: '',
          startTime: '',
          endTime: '',
          targetBlok: 'ALL',
        });
        loadData();
      }
    } catch (err) {
      console.error('Failed to create agenda:', err);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return <Badge>Akan Datang</Badge>;
      case 'ONGOING':
        return <Badge className="bg-green-500">Berlangsung</Badge>;
      case 'COMPLETED':
        return <Badge variant="secondary">Selesai</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus agenda ini?')) {
      const result = await api.deleteAgenda(id);
      if (result.ok) {
        loadData();
      }
    }
  };

  if (!settings?.enableAgenda) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Fitur agenda tidak diaktifkan.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Agenda</h2>
          <p className="text-muted-foreground">Kelola kegiatan dan acara warga</p>
        </div>
        {permissions?.canCreateAgenda && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Agenda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Agenda Baru</DialogTitle>
                <DialogDescription>Masukkan detail agenda</DialogDescription>
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
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Lokasi</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Mulai</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Selesai</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Waktu Mulai</Label>
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Waktu Selesai</Label>
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agendas.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                Tidak ada agenda
              </CardContent>
            </Card>
          ) : (
            agendas.map((agenda) => (
              <Card key={agenda.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{agenda.title}</CardTitle>
                      {agenda.location && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {agenda.location}
                        </CardDescription>
                      )}
                    </div>
                    {getStatusBadge(agenda.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(agenda.startDate)}</span>
                      {agenda.startTime && <span>- {agenda.startTime}</span>}
                    </div>
                    
                    {agenda.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {agenda.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {agenda.targetBlok === 'ALL' ? 'Semua Blok' : `Blok ${agenda.targetBlok}`}
                      </Badge>
                    </div>
                    
                    {permissions?.canEditAgenda && (
                      <div className="flex items-center gap-2 pt-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {permissions?.canDeleteAgenda && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() => handleDelete(agenda.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Hapus
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
