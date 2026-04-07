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
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Plus,
  MapPin,
  Clock,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  User,
  CalendarDays,
  X,
  Eye,
} from 'lucide-react';
import type { Agenda } from '@/types';

export function AgendaPage() {
  const { user, permissions } = useAuth();
  const { settings } = useApp();
  
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAgenda, setSelectedAgenda] = useState<Agenda | null>(null);
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

  const [editFormData, setEditFormData] = useState({
    id: '',
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    targetBlok: 'ALL',
    status: 'UPCOMING',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await api.getAgenda();
      if (res.ok && res.data) {
        setAgendas(res.data);
      } else {
        throw new Error('Gagal memuat data agenda');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
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
        resetFormData();
        loadData();
      }
    } catch (err) {
      console.error('Failed to create agenda:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await api.updateAgenda(editFormData.id, {
        title: editFormData.title,
        description: editFormData.description,
        location: editFormData.location,
        startDate: editFormData.startDate,
        endDate: editFormData.endDate || undefined,
        startTime: editFormData.startTime || undefined,
        endTime: editFormData.endTime || undefined,
        targetBlok: editFormData.targetBlok,
        status: editFormData.status,
      });
      
      if (result.ok) {
        setShowEditDialog(false);
        setSelectedAgenda(null);
        loadData();
      }
    } catch (err) {
      console.error('Failed to update agenda:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFormData = () => {
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
  };

  const openEditDialog = (agenda: Agenda) => {
    setEditFormData({
      id: agenda.id,
      title: agenda.title,
      description: agenda.description || '',
      location: agenda.location || '',
      startDate: agenda.startDate,
      endDate: agenda.endDate || '',
      startTime: agenda.startTime || '',
      endTime: agenda.endTime || '',
      targetBlok: agenda.targetBlok || 'ALL',
      status: agenda.status,
    });
    setShowEditDialog(true);
  };

  const openDetailModal = (agenda: Agenda) => {
    setSelectedAgenda(agenda);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return <Badge className="bg-blue-500">Akan Datang</Badge>;
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
        setSelectedAgenda(null);
        loadData();
      }
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const result = await api.updateAgendaStatus(id, status);
    if (result.ok) {
      loadData();
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
          <Dialog open={showAddDialog} onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) resetFormData();
          }}>
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
                      {settings?.bloks?.map((blok) => (
                        <SelectItem key={blok} value={blok}>Blok {blok}</SelectItem>
                      ))}
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadData}>
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
              <Card 
                key={agenda.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => openDetailModal(agenda)}
              >
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
                      <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEditDialog(agenda)}
                        >
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

      {/* Detail Agenda Modal */}
      <Dialog open={!!selectedAgenda && !showEditDialog} onOpenChange={() => setSelectedAgenda(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedAgenda && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <DialogTitle className="text-xl">{selectedAgenda.title}</DialogTitle>
                  {getStatusBadge(selectedAgenda.status)}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <Badge variant="outline">
                    {selectedAgenda.targetBlok === 'ALL' ? 'Semua Blok' : `Blok ${selectedAgenda.targetBlok}`}
                  </Badge>
                </div>
              </DialogHeader>
              
              {/* Meta Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4 border-y">
                {/* Start Date */}
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Tanggal Mulai</p>
                    <p className="font-medium text-sm">{formatDate(selectedAgenda.startDate)}</p>
                  </div>
                </div>
                
                {/* End Date */}
                {selectedAgenda.endDate && (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <CalendarDays className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Tanggal Selesai</p>
                      <p className="font-medium text-sm">{formatDate(selectedAgenda.endDate)}</p>
                    </div>
                  </div>
                )}
                
                {/* Time */}
                {(selectedAgenda.startTime || selectedAgenda.endTime) && (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Waktu</p>
                      <p className="font-medium text-sm">
                        {selectedAgenda.startTime || '-'}
                        {selectedAgenda.endTime && ` - ${selectedAgenda.endTime}`}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Location */}
                {selectedAgenda.location && (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Lokasi</p>
                      <p className="font-medium text-sm">{selectedAgenda.location}</p>
                    </div>
                  </div>
                )}
                
                {/* Created By */}
                {selectedAgenda.createdBy && (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Dibuat oleh</p>
                      <p className="font-medium text-sm">{selectedAgenda.createdBy}</p>
                    </div>
                  </div>
                )}
                
                {/* Created At */}
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Ditambahkan</p>
                    <p className="font-medium text-sm">{formatDateTime(selectedAgenda.createdAt)}</p>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              {selectedAgenda.description && (
                <div className="py-4">
                  <h4 className="font-medium mb-2">Deskripsi</h4>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedAgenda.description}
                  </p>
                </div>
              )}
              
              {/* Status Change */}
              {permissions?.canEditAgenda && (
                <div className="py-4 border-t">
                  <h4 className="font-medium mb-2">Ubah Status</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={selectedAgenda.status === 'UPCOMING' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange(selectedAgenda.id, 'UPCOMING')}
                    >
                      Akan Datang
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedAgenda.status === 'ONGOING' ? 'default' : 'outline'}
                      className={selectedAgenda.status === 'ONGOING' ? 'bg-green-500 hover:bg-green-600' : ''}
                      onClick={() => handleStatusChange(selectedAgenda.id, 'ONGOING')}
                    >
                      Berlangsung
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedAgenda.status === 'COMPLETED' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange(selectedAgenda.id, 'COMPLETED')}
                    >
                      Selesai
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedAgenda.status === 'CANCELLED' ? 'destructive' : 'outline'}
                      onClick={() => handleStatusChange(selectedAgenda.id, 'CANCELLED')}
                    >
                      Dibatalkan
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Actions */}
              {permissions?.canEditAgenda && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAgenda(null);
                      openEditDialog(selectedAgenda);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {permissions?.canDeleteAgenda && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(selectedAgenda.id)}
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

      {/* Edit Agenda Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Agenda</DialogTitle>
            <DialogDescription>Ubah detail agenda</DialogDescription>
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
              <Label>Deskripsi</Label>
              <Textarea
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Lokasi</Label>
              <Input
                value={editFormData.location}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={editFormData.startDate}
                  onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Selesai</Label>
                <Input
                  type="date"
                  value={editFormData.endDate}
                  onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Waktu Mulai</Label>
                <Input
                  type="time"
                  value={editFormData.startTime}
                  onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Waktu Selesai</Label>
                <Input
                  type="time"
                  value={editFormData.endTime}
                  onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                />
              </div>
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

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPCOMING">Akan Datang</SelectItem>
                  <SelectItem value="ONGOING">Berlangsung</SelectItem>
                  <SelectItem value="COMPLETED">Selesai</SelectItem>
                  <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
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
